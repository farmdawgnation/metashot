import rateLimit from "express-rate-limit";
import { Config } from "../config";
import { rateLimitHits } from "../metrics";

export const screenshotRateLimiter = rateLimit({
  windowMs: Config.rateLimit.windowMs,
  max: Config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    rateLimitHits.inc({ status: "throttled" });
    res.status(429).json({
      error: "TooManyRequests",
      message: "Too many requests, please try again later",
    });
  },
});
