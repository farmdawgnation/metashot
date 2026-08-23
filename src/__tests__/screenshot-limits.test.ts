import request from "supertest";
import express from "express";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("Screenshot API request bounds", () => {
  let app: express.Application;
  let takeScreenshot: jest.Mock;
  let uploadImage: jest.Mock;

  const originalEnv = { ...process.env };

  beforeAll(async () => {
    jest.resetModules();

    // One job at a time, no queue, and a short deadline so shedding and
    // timeouts are observable without a real browser.
    process.env.SCREENSHOT_MAX_CONCURRENCY = "1";
    process.env.SCREENSHOT_MAX_QUEUE_DEPTH = "0";
    process.env.SCREENSHOT_REQUEST_TIMEOUT_MS = "1000";
    process.env.SCREENSHOT_MAX_DIMENSION = "4096";
    process.env.SCREENSHOT_MIN_DIMENSION = "320";
    process.env.RATE_LIMIT_MAX = "1000";
    process.env.METABASE_SECRET_KEY = "test-secret";

    takeScreenshot = jest.fn(async () => Buffer.from("png"));
    uploadImage = jest.fn(async () => {});

    jest.doMock("../services/screenshot", () => ({
      ScreenshotService: class {
        async initialize() {}
        async close() {}
        takeScreenshot(...args: unknown[]) {
          return takeScreenshot(...args);
        }
      },
    }));

    jest.doMock("../services/storage", () => ({
      StorageService: class {
        async ensureBucketExists() {}
        generateFileName() {
          return "screenshot-test.png";
        }
        uploadImage(...args: unknown[]) {
          return uploadImage(...args);
        }
        async generatePresignedUrl() {
          return "https://example.com/signed";
        }
      },
    }));

    const { default: screenshotRouter } = await import("../routes/screenshot");

    app = express();
    app.use(express.json());
    app.use("/api", screenshotRouter);
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  beforeEach(() => {
    takeScreenshot.mockReset();
    takeScreenshot.mockImplementation(async () => Buffer.from("png"));
    uploadImage.mockClear();
  });

  describe("input validation", () => {
    it("rejects a missing questionId", async () => {
      const response = await request(app).post("/api/screenshot").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "BadRequest",
        message: "questionId is required",
      });
      expect(takeScreenshot).not.toHaveBeenCalled();
    });

    it("rejects a non-integer questionId", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .send({ questionId: -3 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "questionId must be a positive integer",
      );
      expect(takeScreenshot).not.toHaveBeenCalled();
    });

    it("rejects non-integer viewport dimensions", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .send({ questionId: 1, width: "huge" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("width must be a positive integer");
      expect(takeScreenshot).not.toHaveBeenCalled();
    });

    it("clamps oversized viewport dimensions before rendering", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .send({ questionId: 1, width: 100000, height: 50000 });

      expect(response.status).toBe(200);
      expect(takeScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({ width: 4096, height: 4096 }),
        expect.any(String),
      );
    });

    it("applies default dimensions when none are supplied", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .send({ questionId: 7 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        presignedUrl: "https://example.com/signed",
        fileName: "screenshot-test.png",
      });
      expect(takeScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({ questionId: 7, width: 1920, height: 1080 }),
        expect.any(String),
      );
    });
  });

  describe("concurrency limit", () => {
    it("sheds requests once the queue is full", async () => {
      const inFlight = deferred<Buffer>();
      const started = deferred<void>();

      takeScreenshot.mockImplementation(() => {
        started.resolve();
        return inFlight.promise;
      });

      // `.then()` is what actually dispatches a supertest request.
      const first = request(app)
        .post("/api/screenshot")
        .send({ questionId: 1 })
        .then((response) => response);
      await started.promise;

      const second = await request(app)
        .post("/api/screenshot")
        .send({ questionId: 2 });

      expect(second.status).toBe(503);
      expect(second.headers["retry-after"]).toBe("5");
      expect(second.body).toEqual({
        error: "ServiceUnavailable",
        message: "Screenshot capacity reached, please retry shortly",
      });

      inFlight.resolve(Buffer.from("png"));
      expect((await first).status).toBe(200);
    });

    it("frees the slot again once the in-flight job finishes", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .send({ questionId: 1 });

      expect(response.status).toBe(200);
    });
  });

  describe("request timeout", () => {
    it("returns 504 when the job outlives the deadline", async () => {
      const inFlight = deferred<Buffer>();
      takeScreenshot.mockImplementation(() => inFlight.promise);

      const response = await request(app)
        .post("/api/screenshot")
        .send({ questionId: 1 });

      expect(response.status).toBe(504);
      expect(response.body).toEqual({
        error: "GatewayTimeout",
        message: "Screenshot generation timed out",
      });

      // The abandoned job must not spend an S3 write once it finally finishes
      inFlight.resolve(Buffer.from("png"));
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(uploadImage).not.toHaveBeenCalled();
    }, 10000);

    it("releases the concurrency slot after a timed-out job settles", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .send({ questionId: 1 });

      expect(response.status).toBe(200);
    });
  });
});
