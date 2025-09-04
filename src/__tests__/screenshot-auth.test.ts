import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import screenshotRouter from "../routes/screenshot";
import { Config } from "../config";

describe("Screenshot API with Authentication", () => {
  let app: express.Application;
  const originalAuthToken = Config.authToken;

  beforeAll(() => {
    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use("/api", screenshotRouter);
  });

  afterAll(() => {
    Object.defineProperty(Config, "authToken", {
      value: originalAuthToken,
      writable: true,
    });
  });

  describe("when authToken is not configured", () => {
    beforeEach(() => {
      Object.defineProperty(Config, "authToken", {
        value: undefined,
        writable: true,
      });
    });

    it("should allow requests without authorization header", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .send({ questionId: 1 });

      expect(response.status).not.toBe(401);
    });
  });

  describe("when authToken is configured", () => {
    beforeEach(() => {
      Object.defineProperty(Config, "authToken", {
        value: "test-token-123",
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(Config, "authToken", {
        value: undefined,
        writable: true,
      });
    });

    it("should reject requests without authorization header", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .send({ questionId: 1 });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized",
        message: "Authorization header is required",
      });
    });

    it("should reject requests with invalid authorization header", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .set("Authorization", "Invalid token")
        .send({ questionId: 1 });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized",
        message: "Bearer or Basic authorization is required",
      });
    });

    it("should reject requests with incorrect token", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .set("Authorization", "Bearer wrong-token")
        .send({ questionId: 1 });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized",
        message: "Invalid token",
      });
    });

    it("should allow requests with correct token", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .set("Authorization", "Bearer test-token-123")
        .send({ questionId: 1 });

      expect(response.status).not.toBe(401);
    });

    it("should not require authentication for health endpoint", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "healthy",
        timestamp: expect.any(String),
      });
    });

    it("should accept requests with parameters", async () => {
      const response = await request(app)
        .post("/api/screenshot")
        .set("Authorization", "Bearer test-token-123")
        .send({
          questionId: 1,
          params: { userId: 123, region: "us-west" },
        });

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(400);
    });
  });
});
