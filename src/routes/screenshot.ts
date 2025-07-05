import { Router, Request, Response } from 'express';
import { ScreenshotService } from '../services/screenshot';
import { StorageService } from '../services/storage';
import { ScreenshotRequest, ScreenshotResponse, ErrorResponse } from '../types';
import { Config } from '../config';
import { generateMetabaseEmbedUrl } from '../metabase';
import { authenticateToken } from '../middleware/auth';

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
  try {
    const request: ScreenshotRequest = req.body;

    if (!request.questionId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'questionId is required',
      });
    }

    const embedUrl = generateMetabaseEmbedUrl({ questionId: request.questionId });
    const screenshot = await screenshotService.takeScreenshot(request, embedUrl);
    const fileName = storageService.generateFileName();
    
    await storageService.uploadImage(screenshot, fileName);
    const presignedUrl = await storageService.generatePresignedUrl(fileName);

    const expiresAt = new Date(Date.now() + Config.presignedUrlExpiry * 1000).toISOString();

    res.json({
      presignedUrl,
      fileName,
      expiresAt,
    });
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to generate screenshot',
    });
  }
});

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default router;