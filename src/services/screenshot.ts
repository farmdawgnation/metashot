import { chromium, Browser, Page } from 'playwright';
import { ScreenshotRequest } from '../types';
import {
  browserLifecycle,
  activeBrowsers,
  screenshotDuration,
  screenshotErrors,
  pageLoadDuration,
  metricsUtils,
} from '../metrics';
import { tracingUtils } from '../tracing';

export class ScreenshotService {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    await tracingUtils.traceOperation(
      'browser.initialize',
      async () => {
        await metricsUtils.trackDuration(
          browserLifecycle,
          { operation: 'startup' },
          async () => {
            const launchOptions: any = {
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox'],
            };

            // Use system Chromium if available (for Docker deployment)
            if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
              launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
            }

            this.browser = await chromium.launch(launchOptions);
            activeBrowsers.inc();
          }
        );
      },
      { 'browser.type': 'chromium' }
    );
  }

  async close(): Promise<void> {
    if (this.browser) {
      await tracingUtils.traceOperation(
        'browser.close',
        async () => {
          await metricsUtils.trackDuration(
            browserLifecycle,
            { operation: 'shutdown' },
            async () => {
              await this.browser!.close();
              this.browser = null;
              activeBrowsers.dec();
            }
          );
        },
        { 'browser.type': 'chromium' }
      );
    }
  }

  async takeScreenshot(request: ScreenshotRequest, embedUrl: string): Promise<Buffer> {
    if (!this.browser) {
      screenshotErrors.inc({ error_type: 'browser_not_initialized' });
      throw new Error('Screenshot service not initialized');
    }

    return await tracingUtils.traceOperation(
      'screenshot.generate',
      async () => {
        return await metricsUtils.trackDuration(
          screenshotDuration,
          { status: 'unknown' },
          async () => {
            const page: Page = await this.browser!.newPage();
            
            try {
              await tracingUtils.traceOperation(
                'screenshot.setup_viewport',
                async () => {
                  await page.setViewportSize({
                    width: request.width || 1920,
                    height: request.height || 1080,
                  });
                },
                {
                  'viewport.width': request.width || 1920,
                  'viewport.height': request.height || 1080,
                }
              );

              // Track page load with tracing
              await tracingUtils.traceOperation(
                'screenshot.page_load',
                async () => {
                  await metricsUtils.trackDuration(
                    pageLoadDuration,
                    { status: 'unknown' },
                    async () => {
                      await page.goto(embedUrl, {
                        timeout: 30000,
                        waitUntil: 'networkidle',
                      });

                      await page.waitForSelector('div[data-testid=embed-frame]', {
                        timeout: 30000,
                      });
                    }
                  );
                },
                {
                  'page.url': embedUrl,
                  'page.selector': 'div[data-testid=embed-frame]',
                }
              );

              const screenshot = await tracingUtils.traceOperation(
                'screenshot.capture',
                async () => {
                  return await page.screenshot({
                    type: 'png',
                    fullPage: true,
                  });
                },
                { 'screenshot.type': 'png', 'screenshot.fullPage': true }
              );

              // Update success status after successful completion
              screenshotDuration.observe({ status: 'success' }, Date.now() / 1000);
              pageLoadDuration.observe({ status: 'success' }, Date.now() / 1000);

              return screenshot;
            } catch (error) {
              // Track different types of errors
              if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                  screenshotErrors.inc({ error_type: 'timeout' });
                } else if (error.message.includes('selector')) {
                  screenshotErrors.inc({ error_type: 'selector_not_found' });
                } else {
                  screenshotErrors.inc({ error_type: 'unknown' });
                }
              }
              
              // Update failure status
              screenshotDuration.observe({ status: 'error' }, Date.now() / 1000);
              pageLoadDuration.observe({ status: 'error' }, Date.now() / 1000);
              
              throw error;
            } finally {
              await page.close();
            }
          }
        );
      },
      {
        'request.questionId': request.questionId,
        'request.width': request.width || 1920,
        'request.height': request.height || 1080,
      }
    );
  }
}
