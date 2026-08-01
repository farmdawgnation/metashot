import { chromium, Browser, Page, LaunchOptions } from "playwright";
import { ScreenshotRequest } from "../types";
import {
  browserLifecycle,
  activeBrowsers,
  screenshotDuration,
  screenshotErrors,
  pageLoadDuration,
} from "../metrics";
import { traceAndTrack } from "../observability";
import { logger } from "../logger";
import { Config } from "../config";

export class ScreenshotService {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    await traceAndTrack(
      {
        name: "browser.initialize",
        histogram: browserLifecycle,
        labels: { operation: "startup" },
        attributes: { "browser.type": "chromium" },
      },
      async () => {
        const launchOptions: LaunchOptions = {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        };

        // Use system Chromium if available (for Docker deployment)
        if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
          launchOptions.executablePath =
            process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
        }

        this.browser = await chromium.launch(launchOptions);
        activeBrowsers.inc();
      },
    );
  }

  async close(): Promise<void> {
    if (this.browser) {
      await traceAndTrack(
        {
          name: "browser.close",
          histogram: browserLifecycle,
          labels: { operation: "shutdown" },
          attributes: { "browser.type": "chromium" },
        },
        async () => {
          await this.browser!.close();
          this.browser = null;
          activeBrowsers.dec();
        },
      );
    }
  }

  async takeScreenshot(
    request: ScreenshotRequest,
    embedUrl: string,
  ): Promise<Buffer> {
    if (!this.browser) {
      screenshotErrors.inc({ error_type: "browser_not_initialized" });
      throw new Error("Screenshot service not initialized");
    }

    return await traceAndTrack(
      {
        name: "screenshot.generate",
        histogram: screenshotDuration,
        successLabels: { status: "success" },
        errorLabels: { status: "error" },
        attributes: {
          "request.questionId": request.questionId,
          "request.width": request.width || 1920,
          "request.height": request.height || 1080,
        },
      },
      async () => {
        const page: Page = await this.browser!.newPage();

        try {
          // Use much shorter waits when running tests to avoid long timeouts on synthetic pages
          const isTestEnv = Config.nodeEnv === "test";
          const spinnerHiddenTimeout = isTestEnv ? 500 : 30000;
          const vizContentTimeout = isTestEnv ? 200 : 15000;
          const finalRenderDelayMs = isTestEnv ? 50 : 1000;

          await traceAndTrack(
            {
              name: "screenshot.setup_viewport",
              attributes: {
                "viewport.width": request.width || 1920,
                "viewport.height": request.height || 1080,
              },
            },
            async () => {
              await page.setViewportSize({
                width: request.width || 1920,
                height: request.height || 1080,
              });
            },
          );

          // Track page load with tracing
          await traceAndTrack(
            {
              name: "screenshot.page_load",
              histogram: pageLoadDuration,
              successLabels: { status: "success" },
              errorLabels: { status: "error" },
              attributes: {
                "page.url": embedUrl,
                "page.selector": "div[data-testid=embed-frame]",
              },
            },
            async () => {
              await page.goto(embedUrl, {
                timeout: 30000,
                waitUntil: "networkidle",
              });

              // 1. Wait for embed frame (shorter timeout)
              await page.waitForSelector("div[data-testid=embed-frame]", {
                timeout: 15000,
              });

              // 2. Wait for loading spinner to disappear (only if it exists)
              const spinnerHandle = await page.$(".LoadingSpinner");
              if (spinnerHandle) {
                await page
                  .waitForSelector(".LoadingSpinner", {
                    state: "hidden",
                    timeout: spinnerHiddenTimeout,
                  })
                  .catch((error) => {
                    logger.warn(
                      {
                        type: "screenshot_wait_warning",
                        selector: ".LoadingSpinner",
                        state: "hidden",
                        timeout: spinnerHiddenTimeout,
                        error: error.message,
                      },
                      "LoadingSpinner wait timeout - continuing",
                    );
                  });
              }

              // 3. Wait briefly for visualization content; don't stall long on synthetic/test pages
              await page
                .waitForSelector("svg, canvas, .visualization, .DashCard", {
                  timeout: vizContentTimeout,
                })
                .catch((error) => {
                  logger.warn(
                    {
                      type: "screenshot_wait_warning",
                      selector: "svg, canvas, .visualization, .DashCard",
                      timeout: vizContentTimeout,
                      error: error.message,
                    },
                    "Visualization elements not found in time - continuing",
                  );
                });

              // 4. Brief pause for final rendering
              await page.waitForTimeout(finalRenderDelayMs);
            },
          );

          return await traceAndTrack(
            {
              name: "screenshot.capture",
              attributes: {
                "screenshot.type": "png",
                "screenshot.fullPage": true,
              },
            },
            async () => {
              return await page.screenshot({
                type: "png",
                fullPage: true,
              });
            },
          );
        } catch (error) {
          // Track different types of errors
          if (error instanceof Error) {
            if (error.message.includes("timeout")) {
              screenshotErrors.inc({ error_type: "timeout" });
            } else if (error.message.includes("selector")) {
              screenshotErrors.inc({ error_type: "selector_not_found" });
            } else {
              screenshotErrors.inc({ error_type: "unknown" });
            }
          }

          throw error;
        } finally {
          await page.close();
        }
      },
    );
  }
}
