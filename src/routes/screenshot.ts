import { Router, Request, Response } from "express";
import { ScreenshotService } from "../services/screenshot";
import { StorageService } from "../services/storage";
import { ScreenshotResponse, ErrorResponse } from "../types";
import { Config } from "../config";
import { generateMetabaseEmbedUrl } from "../metabase";
import { authenticateToken } from "../middleware/auth";
import { screenshotRateLimiter } from "../middleware/rateLimiter";
import { logger } from "../logger";
import { sanitizeError } from "../utils/sanitize";
import { validateScreenshotRequest } from "../utils/validation";
import { QueueFullError, Semaphore } from "../utils/semaphore";
import { TimeoutError, withTimeout } from "../utils/timeout";
import {
  screenshotRequests,
  concurrentRequests,
  screenshotRejections,
  screenshotActiveJobs,
  screenshotQueueDepth,
  metabaseUrlGeneration,
  metabaseUrlErrors,
} from "../metrics";
import { traceAndTrack } from "../observability";

const router = Router();
const screenshotService = new ScreenshotService();
const storageService = new StorageService();

// Caps how much browser work is in flight at once. Requests beyond the queue
// depth are shed immediately rather than piling up behind a busy browser.
const screenshotSemaphore = new Semaphore(
  Config.screenshot.maxConcurrency,
  Config.screenshot.maxQueueDepth,
  ({ active, queued }) => {
    screenshotActiveJobs.set(active);
    screenshotQueueDepth.set(queued);
  },
);

export async function initializeServices(): Promise<void> {
  await screenshotService.initialize();
  await storageService.ensureBucketExists();
}

export async function closeServices(): Promise<void> {
  await screenshotService.close();
}

// Set once the request deadline has passed, so work that is still running can
// bail out instead of finishing on behalf of a caller that already gave up.
interface JobDeadline {
  abandoned: boolean;
}

// Runs `job` under the concurrency limit and an overall deadline. The slot is
// released when the job itself settles — not when the deadline fires — so a
// timed-out request can never leak concurrency to the next caller.
async function runBounded<T>(
  job: (deadline: JobDeadline) => Promise<T>,
): Promise<T> {
  const release = await screenshotSemaphore.acquire();
  const deadline: JobDeadline = { abandoned: false };

  const work = job(deadline);
  work.then(release, release);

  try {
    return await withTimeout(
      work,
      Config.screenshot.requestTimeoutMs,
      `Screenshot request exceeded ${Config.screenshot.requestTimeoutMs}ms`,
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      deadline.abandoned = true;
    }
    throw error;
  }
}

router.post(
  "/screenshot",
  screenshotRateLimiter,
  authenticateToken,
  async (req: Request, res: Response<ScreenshotResponse | ErrorResponse>) => {
    const validation = validateScreenshotRequest(req.body);

    if (!validation.valid) {
      screenshotRequests.inc({ status: "error" });
      screenshotRejections.inc({ reason: "invalid_request" });
      return res.status(400).json({
        error: "BadRequest",
        message: validation.message,
      });
    }

    const request = validation.request;

    if (validation.clamped.length > 0) {
      logger.warn(
        {
          type: "screenshot_dimensions_clamped",
          questionId: request.questionId,
          clamped: validation.clamped,
          width: request.width,
          height: request.height,
        },
        "Requested viewport dimensions clamped to configured range",
      );
    }

    concurrentRequests.inc();

    try {
      const { presignedUrl, fileName } = await runBounded(async (deadline) => {
        // Track Metabase URL generation with tracing
        const embedUrl = await traceAndTrack(
          {
            name: "metabase.generate_embed_url",
            histogram: metabaseUrlGeneration,
            successLabels: { status: "success" },
            errorLabels: { status: "error" },
            attributes: { "metabase.questionId": request.questionId },
          },
          async () => {
            try {
              return await generateMetabaseEmbedUrl({
                questionId: request.questionId,
                params: request.params,
              });
            } catch (metabaseError: unknown) {
              const errorMessage =
                metabaseError instanceof Error
                  ? metabaseError.message
                  : String(metabaseError);
              metabaseUrlErrors.inc({
                error_type: errorMessage.includes("secret")
                  ? "missing_secret"
                  : "unknown",
              });
              throw metabaseError;
            }
          },
        );

        const screenshot = await screenshotService.takeScreenshot(
          request,
          embedUrl,
        );
        // The caller has already been sent a timeout; don't spend an S3 write
        // on an image nobody can retrieve.
        if (deadline.abandoned) {
          throw new TimeoutError("Screenshot abandoned after request deadline");
        }

        const name = storageService.generateFileName();

        await storageService.uploadImage(screenshot, name);

        return {
          presignedUrl: await storageService.generatePresignedUrl(name),
          fileName: name,
        };
      });

      const expiresAt = new Date(
        Date.now() + Config.presignedUrlExpiry * 1000,
      ).toISOString();

      screenshotRequests.inc({ status: "success" });
      res.json({
        presignedUrl,
        fileName,
        expiresAt,
      });
    } catch (error) {
      screenshotRequests.inc({ status: "error" });

      if (error instanceof QueueFullError) {
        screenshotRejections.inc({ reason: "queue_full" });
        logger.warn(
          {
            type: "screenshot_queue_full",
            questionId: request.questionId,
            maxConcurrency: Config.screenshot.maxConcurrency,
            maxQueueDepth: Config.screenshot.maxQueueDepth,
          },
          "Screenshot queue full - shedding request",
        );
        res.setHeader("Retry-After", "5");
        return res.status(503).json({
          error: "ServiceUnavailable",
          message: "Screenshot capacity reached, please retry shortly",
        });
      }

      if (error instanceof TimeoutError) {
        screenshotRejections.inc({ reason: "timeout" });
        logger.warn(
          {
            type: "screenshot_request_timeout",
            questionId: request.questionId,
            timeoutMs: Config.screenshot.requestTimeoutMs,
          },
          "Screenshot request timed out",
        );
        return res.status(504).json({
          error: "GatewayTimeout",
          message: "Screenshot generation timed out",
        });
      }

      logger.error(
        { error: sanitizeError(error), questionId: request.questionId },
        "Screenshot error",
      );
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to generate screenshot",
      });
    } finally {
      concurrentRequests.dec();
    }
  },
);

router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

export default router;
