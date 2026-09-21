import { Config } from "../config";

describe("Config", () => {
  it("should load configuration from environment", () => {
    expect(Config.port).toBe(8080);
    expect(Config.nodeEnv).toBe("test");
    expect(Config.authToken).toBeUndefined();
    expect(Config.allowUnauthenticated).toBe(false);
    expect(Config.s3.endpoint).toBe(process.env.S3_ENDPOINT);
    expect(Config.s3.accessKeyId).toBe("minioadmin");
    expect(Config.s3.secretAccessKey).toBe("minioadmin");
    expect(Config.s3.bucket).toBe("metashot-images");
    expect(Config.s3.region).toBe("us-east-1");
    expect(Config.presignedUrlExpiry).toBe(3600);
  });

  it("should default the screenshot resource limits", () => {
    expect(Config.screenshot).toEqual({
      minDimension: 320,
      maxDimension: 4096,
      maxConcurrency: 4,
      maxQueueDepth: 20,
      requestTimeoutMs: 120000,
    });
    expect(Config.requestBodyLimit).toBe("100kb");
  });

  it("should default tracing to disabled in test", () => {
    // In test env, enabled should be false regardless of env unless explicitly overridden
    expect(Config.tracing.enabled).toBe(false);
    expect(typeof Config.tracing.otlpTracesEndpoint).toBe("string");
  });
});
