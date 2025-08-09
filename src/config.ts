import { config } from 'dotenv';

config();

// Helper to parse common boolean env representations
const parseBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
};

export const Config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  authToken: process.env.AUTH_TOKEN || undefined,
  tracing: {
    // Disabled by default; enable via TRACING_ENABLED=true and not OTEL_SDK_DISABLED=true
    enabled:
      parseBoolean(process.env.TRACING_ENABLED) &&
      !parseBoolean(process.env.OTEL_SDK_DISABLED || undefined) &&
      (process.env.NODE_ENV || 'development') !== 'test',
    // Prefer OTEL standard env vars; default to local collector (OTLP HTTP)
    otlpTracesEndpoint:
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
      (process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? `${(process.env.OTEL_EXPORTER_OTLP_ENDPOINT as string).replace(/\/?$/, '')}/v1/traces`
        : 'http://localhost:4318/v1/traces'),
  },
  metabase: {
    siteUrl: process.env.METABASE_SITE_URL || 'http://localhost:3000',
    secretKey: process.env.METABASE_SECRET_KEY || '',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || undefined,
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'metashot-images',
    region: process.env.S3_REGION || 'us-east-1',
  },
  presignedUrlExpiry: parseInt(process.env.PRESIGNED_URL_EXPIRY || '3600', 10),
};
