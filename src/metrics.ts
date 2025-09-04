import {
  register,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

// Enable default Node.js metrics collection
collectDefaultMetrics();

// HTTP Metrics (handled by express-prom-bundle)

// Screenshot Service Metrics
export const screenshotDuration = new Histogram({
  name: "metashot_screenshot_duration_seconds",
  help: "Time spent generating screenshots",
  labelNames: ["status"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60], // Seconds
});

export const screenshotErrors = new Counter({
  name: "metashot_screenshot_errors_total",
  help: "Total number of screenshot generation errors",
  labelNames: ["error_type"],
});

export const browserLifecycle = new Histogram({
  name: "metashot_browser_lifecycle_seconds",
  help: "Time spent on browser lifecycle operations",
  labelNames: ["operation"], // 'startup', 'shutdown'
  buckets: [0.1, 0.5, 1, 2, 5, 10], // Seconds
});

export const activeBrowsers = new Gauge({
  name: "metashot_active_browsers",
  help: "Number of active browser instances",
});

export const pageLoadDuration = new Histogram({
  name: "metashot_page_load_duration_seconds",
  help: "Time spent loading pages in browser",
  labelNames: ["status"],
  buckets: [0.5, 1, 2, 5, 10, 15, 30], // Seconds
});

// Storage Service Metrics
export const s3OperationDuration = new Histogram({
  name: "metashot_s3_operation_duration_seconds",
  help: "Time spent on S3 operations",
  labelNames: ["operation"], // 'upload', 'presigned_url', 'bucket_exists'
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5], // Seconds
});

export const s3OperationErrors = new Counter({
  name: "metashot_s3_operation_errors_total",
  help: "Total number of S3 operation errors",
  labelNames: ["operation", "error_type"],
});

export const uploadSize = new Histogram({
  name: "metashot_upload_size_bytes",
  help: "Size of uploaded screenshot files",
  buckets: [1024, 10240, 51200, 102400, 512000, 1048576, 5242880], // Bytes
});

// Authentication Metrics
export const authAttempts = new Counter({
  name: "metashot_auth_attempts_total",
  help: "Total number of authentication attempts",
  labelNames: ["status"], // 'success', 'failure', 'missing_token'
});

// Metabase Integration Metrics
export const metabaseUrlGeneration = new Histogram({
  name: "metashot_metabase_url_generation_seconds",
  help: "Time spent generating Metabase embed URLs",
  labelNames: ["status"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5], // Seconds
});

export const metabaseUrlErrors = new Counter({
  name: "metashot_metabase_url_errors_total",
  help: "Total number of Metabase URL generation errors",
  labelNames: ["error_type"],
});

// Business Logic Metrics
export const screenshotRequests = new Counter({
  name: "metashot_screenshot_requests_total",
  help: "Total number of screenshot requests",
  labelNames: ["status"], // 'success', 'error'
});

export const concurrentRequests = new Gauge({
  name: "metashot_concurrent_requests",
  help: "Number of requests currently being processed",
});

// Utility functions for common metric operations
export const metricsUtils = {
  // Track operation duration with automatic labeling
  trackDuration: <T>(
    histogram: Histogram<string>,
    labels: Record<string, string | number>,
    operation: () => Promise<T>,
  ): Promise<T> => {
    const end = histogram.startTimer(labels);
    return operation().finally(() => end());
  },

  // Increment counter with error handling
  incrementCounter: (
    counter: Counter<string>,
    labels: Record<string, string | number>,
  ): void => {
    try {
      counter.inc(labels);
    } catch (error) {
      // Don't let metrics collection break the application
      console.error("Failed to increment counter:", error);
    }
  },

  // Record histogram value with error handling
  recordHistogram: (
    histogram: Histogram<string>,
    value: number,
    labels: Record<string, string | number>,
  ): void => {
    try {
      histogram.observe(labels, value);
    } catch (error) {
      // Don't let metrics collection break the application
      console.error("Failed to record histogram:", error);
    }
  },
};

// Export the default register for /metrics endpoint
export { register };
