import { ScreenshotService } from "../services/screenshot";
import { ScreenshotRequest } from "../types";
import { screenshotBlockedRequests } from "../metrics";

describe("ScreenshotService", () => {
  let screenshotService: ScreenshotService;

  beforeEach(() => {
    screenshotService = new ScreenshotService();
  });

  afterEach(async () => {
    await screenshotService.close();
  });

  describe("initialization", () => {
    it("should initialize browser", async () => {
      try {
        await screenshotService.initialize();
        expect(screenshotService["browser"]).toBeTruthy();
      } catch (error) {
        // Skip test if browser is not available
        if (
          error instanceof Error &&
          error.message.includes("Executable doesn't exist")
        ) {
          console.log(
            "Skipping browser test - Playwright browser not installed",
          );
          return;
        }
        throw error;
      }
    });

    it("should close browser", async () => {
      try {
        await screenshotService.initialize();
        await screenshotService.close();
        expect(screenshotService["browser"]).toBeNull();
      } catch (error) {
        // Skip test if browser is not available
        if (
          error instanceof Error &&
          error.message.includes("Executable doesn't exist")
        ) {
          console.log(
            "Skipping browser test - Playwright browser not installed",
          );
          return;
        }
        throw error;
      }
    });
  });

  describe("takeScreenshot", () => {
    it("should throw error if not initialized", async () => {
      const request: ScreenshotRequest = {
        questionId: 1,
      };
      const embedUrl = "https://example.com";

      await expect(
        screenshotService.takeScreenshot(request, embedUrl),
      ).rejects.toThrow("Screenshot service not initialized");
    });

    it("should take screenshot of valid URL", async () => {
      try {
        await screenshotService.initialize();

        const request: ScreenshotRequest = {
          questionId: 1,
          width: 800,
          height: 600,
          params: { userId: 123, region: "us-west" },
        };
        const embedUrl =
          'data:text/html,<html><body><h1>Test</h1><div data-testid="embed-frame">Chart</div></body></html>';

        const screenshot = await screenshotService.takeScreenshot(
          request,
          embedUrl,
        );
        expect(screenshot).toBeInstanceOf(Buffer);
        expect(screenshot.length).toBeGreaterThan(0);
      } catch (error) {
        // Skip test if browser is not available
        if (
          error instanceof Error &&
          error.message.includes("Executable doesn't exist")
        ) {
          console.log(
            "Skipping browser test - Playwright browser not installed",
          );
          return;
        }
        throw error;
      }
    }, 60000);

    it("should block cross-origin requests from the rendered page", async () => {
      try {
        await screenshotService.initialize();

        const request: ScreenshotRequest = {
          questionId: 1,
          width: 400,
          height: 300,
        };
        const embedUrl =
          'data:text/html,<html><body><div data-testid="embed-frame">Chart' +
          '<img src="https://blocked.invalid/pixel.png"></div></body></html>';

        const countBefore = (
          await screenshotBlockedRequests.get()
        ).values.reduce((sum, v) => sum + v.value, 0);

        await screenshotService.takeScreenshot(request, embedUrl);

        const countAfter = (
          await screenshotBlockedRequests.get()
        ).values.reduce((sum, v) => sum + v.value, 0);

        expect(countAfter).toBeGreaterThan(countBefore);
      } catch (error) {
        // Skip test if browser is not available
        if (
          error instanceof Error &&
          error.message.includes("Executable doesn't exist")
        ) {
          console.log(
            "Skipping browser test - Playwright browser not installed",
          );
          return;
        }
        throw error;
      }
    }, 60000);
  });
});
