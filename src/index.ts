// Initialize tracing before any other imports
import { initializeTracing } from "./tracing";
initializeTracing();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import promBundle from "express-prom-bundle";
import screenshotRouter, {
  initializeServices,
  closeServices,
} from "./routes/screenshot";
import { Config } from "./config";
import { logger } from "./logger";
import { requestLoggingMiddleware } from "./middleware/requestLogging";
import { register } from "./metrics";
import packageJson from "../package.json";

const app = express();

if (Config.trustProxy) {
  app.set("trust proxy", true);
}

// Prometheus metrics middleware (before other middleware)
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { service: "metashot" },
  bypass: (req) => req.path === "/metrics", // Don't track metrics endpoint itself
});
app.use(metricsMiddleware);

// Request logging middleware
app.use(requestLoggingMiddleware);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: Config.requestBodyLimit }));

app.use("/api", screenshotRouter);

app.get("/", (req, res) => {
  res.json({
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
  });
});

// Prometheus metrics endpoint
app.get("/metrics", async (_req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error({ error }, "Failed to generate metrics");
    res.status(500).end();
  }
});

async function startServer(): Promise<void> {
  try {
    if (!Config.authToken && !Config.allowUnauthenticated) {
      logger.error(
        "AUTH_TOKEN is not set. Refusing to start: the API would otherwise be fully public. " +
          "Set AUTH_TOKEN, or explicitly opt out with ALLOW_UNAUTHENTICATED=true.",
      );
      process.exit(1);
    }

    if (Config.allowUnauthenticated && !Config.authToken) {
      logger.warn(
        "AUTH_TOKEN is not set and ALLOW_UNAUTHENTICATED=true: authentication is DISABLED and the API is publicly accessible. This is intended for non-production use only.",
      );
    } else {
      logger.info(
        { authEnabled: true },
        "Authentication enabled: AUTH_TOKEN is set. All /api/* routes require a valid token.",
      );
    }

    await initializeServices();

    const server = app.listen(Config.port, () => {
      logger.info(
        { port: Config.port },
        `Server running on port ${Config.port}`,
      );
    });

    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM, shutting down gracefully");
      await closeServices();
      server.close(() => {
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      logger.info("Received SIGINT, shutting down gracefully");
      await closeServices();
      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

startServer();
