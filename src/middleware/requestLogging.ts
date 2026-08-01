import onFinished from "on-finished";
import { NextFunction, Request, Response } from "express";
import { createRequestLogger } from "../logger";

type RequestLogger = ReturnType<typeof createRequestLogger>;

export const createRequestLoggingMiddleware = (
  requestLogger: RequestLogger,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    onFinished(res, () => {
      requestLogger.logRequest(
        req.method,
        req.originalUrl,
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
