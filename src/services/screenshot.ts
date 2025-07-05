import { chromium, Browser, Page } from 'playwright';
import { ScreenshotRequest } from '../types';

export class ScreenshotService {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    const launchOptions: any = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    // Use system Chromium if available (for Docker deployment)
    if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    }

    this.browser = await chromium.launch(launchOptions);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async takeScreenshot(request: ScreenshotRequest, embedUrl: string): Promise<Buffer> {
    if (!this.browser) {
      throw new Error('Screenshot service not initialized');
    }

    const page: Page = await this.browser.newPage();
    
    try {
      await page.setViewportSize({
        width: request.width || 1920,
        height: request.height || 1080,
      });

      await page.goto(embedUrl, {
        timeout: 30000,
        waitUntil: 'networkidle',
      });

      await page.waitForSelector('div[data-testid=chart-container]', {
        timeout: 30000,
      });

      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: true,
      });

      return screenshot;
    } finally {
      await page.close();
    }
  }
}
