import request from "supertest";
import express from "express";
import screenshotRouter from "../routes/screenshot";

describe("Screenshot API Rate Limiting", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api", screenshotRouter);
  });

  it("should return 429 after exceeding rate limit", async () => {
    const maxRequests = 30;

    for (let i = 0; i < maxRequests; i++) {
      const response = await request(app)
        .post("/api/screenshot")
        .send({ questionId: 1 });
      expect(response.status).not.toBe(429);
    }

    const limitedResponse = await request(app)
      .post("/api/screenshot")
      .send({ questionId: 1 });

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body).toEqual({
      error: "TooManyRequests",
      message: "Too many requests, please try again later",
    });
  });

  it("should include rate limit headers", async () => {
    const response = await request(app)
      .post("/api/screenshot")
      .send({ questionId: 1 });

    expect(response.headers["ratelimit-limit"]).toBeDefined();
    expect(response.headers["ratelimit-remaining"]).toBeDefined();
  });
});
