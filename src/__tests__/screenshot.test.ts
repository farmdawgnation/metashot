import { ScreenshotService } from '../services/screenshot';
import { ScreenshotRequest } from '../types';

describe('ScreenshotService', () => {
  let screenshotService: ScreenshotService;

  beforeEach(() => {
    screenshotService = new ScreenshotService();
  });

  afterEach(async () => {
    await screenshotService.close();
  });

  describe('initialization', () => {
    it('should initialize browser', async () => {
      await screenshotService.initialize();
      expect(screenshotService['browser']).toBeTruthy();
    });

    it('should close browser', async () => {
      await screenshotService.initialize();
      await screenshotService.close();
      expect(screenshotService['browser']).toBeNull();
    });
  });

  describe('takeScreenshot', () => {
    it('should throw error if not initialized', async () => {
      const request: ScreenshotRequest = {
        questionId: 1,
      };
      const embedUrl = 'https://example.com';

      await expect(screenshotService.takeScreenshot(request, embedUrl)).rejects.toThrow(
        'Screenshot service not initialized'
      );
    });

    it('should take screenshot of valid URL', async () => {
      await screenshotService.initialize();
      
      const request: ScreenshotRequest = {
        questionId: 1,
        width: 800,
        height: 600,
      };
      const embedUrl = 'data:text/html,<html><body><h1>Test</h1><div data-testid="chart-container">Chart</div></body></html>';

      const screenshot = await screenshotService.takeScreenshot(request, embedUrl);
      expect(screenshot).toBeInstanceOf(Buffer);
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);
  });
});