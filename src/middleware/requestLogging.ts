import onFinished from "on-finished";
import { NextFunction, Request, Response } from "express";
import { createRequestLogger } from "../logger";

type RequestLogger = ReturnType<typeof createRequestLogger>;

export const createRequestLoggingMiddleware = (
  requestLogger: RequestLogger,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip noisy endpoints; req.path excludes the query string.
    if (req.path === "/metrics" || req.path.startsWith("/api/health")) {
      next();
      return;
    }

    const startTime = Date.now();

    onFinished(res, () => {
      requestLogger.logRequest(
        req.method,
        req.path,
        res.statusCode,
        Date.now() - startTime,
      );
    });

    next();
  };
};

export const requestLoggingMiddleware = createRequestLoggingMiddleware(
  createRequestLogger(),
);
