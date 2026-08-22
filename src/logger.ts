import pino from "pino";
import { Config } from "./config";
import { sanitizeError } from "./utils/sanitize";

// Redacts sensitive tokens, then hands Errors to pino's standard serializer so the
// message and stack survive JSON serialization (Error's own fields are non-enumerable).
export const sanitizingErrorSerializer = (value: unknown) => {
  const sanitized = sanitizeError(value);
  return sanitized instanceof Error
    ? pino.stdSerializers.err(sanitized)
    : sanitized;
};

// Create logger configuration based on environment
const pinoConfig = {
  level: Config.nodeEnv === "test" ? "silent" : "info",
  serializers: {
    err: sanitizingErrorSerializer,
    error: sanitizingErrorSerializer,
  },
  ...(Config.nodeEnv === "production"
    ? {
        // Production: JSON format for structured logging
        formatters: {
          level: (label: string) => ({ level: label }),
        },
      }
    : {
        // Development: Pretty print for readability
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "yyyy-mm-dd HH:MM:ss",
          },
        },
      }),
};

export const logger = pino(pinoConfig);

// Helper function for request logging
export const createRequestLogger = () => {
  return {
    logRequest: (
      method: string,
      url: string,
      statusCode: number,
      responseTime: number,
    ) => {
      logger.info(
        {
          type: "http_request",
          method,
          url,
          statusCode,
          responseTime,
        },
        `${method} ${url} - ${statusCode} - ${responseTime}ms`,
      );
    },
  };
};
