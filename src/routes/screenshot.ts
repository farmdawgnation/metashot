import { Router, Request, Response } from 'express';
import { ScreenshotService } from '../services/screenshot';
import { StorageService } from '../services/storage';
import { ScreenshotRequest, ScreenshotResponse, ErrorResponse } from '../types';
import { Config } from '../config';
import { generateMetabaseEmbedUrl } from '../metabase';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../logger';
import {
  screenshotRequests,
  concurrentRequests,
  metabaseUrlGeneration,
  metabaseUrlErrors,
  metricsUtils,
} from '../metrics';
import { tracingUtils } from '../tracing';

const router = Router();
const screenshotService = new ScreenshotService();
const storageService = new StorageService();

export async function initializeServices(): Promise<void> {
  await screenshotService.initialize();
  await storageService.ensureBucketExists();
}

export async function closeServices(): Promise<void> {
  await screenshotService.close();
}

router.post('/screenshot', authenticateToken, async (req: Request, res: Response<ScreenshotResponse | ErrorResponse>) => {
  concurrentRequests.inc();
  
  try {
    const request: ScreenshotRequest = req.body;

    if (!request.questionId) {
      screenshotRequests.inc({ status: 'error' });
      return res.status(400).json({
        error: 'BadRequest',
        message: 'questionId is required',
      });
    }

    // Track Metabase URL generation with tracing
    const embedUrl = await tracingUtils.traceOperation(
      'metabase.generate_embed_url',
      async () => {
        try {
          return await metricsUtils.trackDuration(
            metabaseUrlGeneration,
            { status: 'success' },
            async () => generateMetabaseEmbedUrl({ 
              questionId: request.questionId,
              params: request.params 
            })
          );
        } catch (metabaseError: any) {
          metabaseUrlErrors.inc({ error_type: metabaseError.message.includes('secret') ? 'missing_secret' : 'unknown' });
          metabaseUrlGeneration.observe({ status: 'error' }, Date.now() / 1000);
          throw metabaseError;
        }
      },
      { 'metabase.questionId': request.questionId }
    );

    const screenshot = await screenshotService.takeScreenshot(request, embedUrl);
    const fileName = storageService.generateFileName();
    
    await storageService.uploadImage(screenshot, fileName);
    const presignedUrl = await storageService.generatePresignedUrl(fileName);

    const expiresAt = new Date(Date.now() + Config.presignedUrlExpiry * 1000).toISOString();

    screenshotRequests.inc({ status: 'success' });
    res.json({
      presignedUrl,
      fileName,
      expiresAt,
    });
  } catch (error) {
    screenshotRequests.inc({ status: 'error' });
    logger.error({ error, questionId: req.body.questionId }, 'Screenshot error');
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to generate screenshot',
    });
  } finally {
    concurrentRequests.dec();
  }
});

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default router;