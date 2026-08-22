import { config } from "dotenv";

config();

// Helper to parse common boolean env representations
const parseBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
};

// Helper to parse an integer env var, falling back to the default when the
// value is missing, unparseable, or below the minimum the code can work with.
const parseIntAtLeast = (
  value: string | undefined,
  fallback: number,
  min: number,
): number => {
  const parsed = parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed >= min ? parsed : fallback;
};

export const Config = {
  port: parseInt(process.env.PORT || "8080", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  trustProxy: parseBoolean(process.env.TRUST_PROXY),
  authToken: process.env.AUTH_TOKEN || undefined,
  tracing: {
    // Disabled by default; enable via TRACING_ENABLED=true and not OTEL_SDK_DISABLED=true
    enabled:
      parseBoolean(process.env.TRACING_ENABLED) &&
      !parseBoolean(process.env.OTEL_SDK_DISABLED || undefined) &&
      (process.env.NODE_ENV || "development") !== "test",
    // Prefer OTEL standard env vars; default to local collector (OTLP HTTP).
    // Note: OTLP endpoints should use TLS (https://) in production environments to secure telemetry transmission.
    otlpTracesEndpoint:
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
      (process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? `${(process.env.OTEL_EXPORTER_OTLP_ENDPOINT as string).replace(/\/?$/, "")}/v1/traces`
        : "http://localhost:4318/v1/traces"),
  },
  metabase: {
    siteUrl: process.env.METABASE_SITE_URL || "http://localhost:3000",
    secretKey: process.env.METABASE_SECRET_KEY || "",
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || undefined,
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
    bucket: process.env.S3_BUCKET || "metashot-images",
    region: process.env.S3_REGION || "us-east-1",
  },
  presignedUrlExpiry: parseInt(process.env.PRESIGNED_URL_EXPIRY || "3600", 10),
  playwright: {
    chromiumExecutablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "30", 10),
  },
  // Bounds on the work a single screenshot request is allowed to cause. Each
  // request holds a Chromium page open, so these cap memory and CPU per pod.
  screenshot: {
    minDimension: parseIntAtLeast(process.env.SCREENSHOT_MIN_DIMENSION, 320, 1),
    maxDimension: parseIntAtLeast(
      process.env.SCREENSHOT_MAX_DIMENSION,
      4096,
      1,
    ),
    maxConcurrency: parseIntAtLeast(
      process.env.SCREENSHOT_MAX_CONCURRENCY,
      4,
      1,
    ),
    maxQueueDepth: parseIntAtLeast(
      process.env.SCREENSHOT_MAX_QUEUE_DEPTH,
      20,
      0,
    ),
    requestTimeoutMs: parseIntAtLeast(
      process.env.SCREENSHOT_REQUEST_TIMEOUT_MS,
      120000,
      1000,
    ),
  },
  // Maximum accepted JSON request body size (passed to express.json)
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || "100kb",
};
