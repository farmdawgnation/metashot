import { Config } from '../config';

describe('Config', () => {
  it('should load configuration from environment', () => {
    expect(Config.port).toBe(8080);
    expect(Config.nodeEnv).toBe('test');
    expect(Config.authToken).toBeUndefined();
    expect(Config.s3.endpoint).toBe(process.env.S3_ENDPOINT);
    expect(Config.s3.accessKeyId).toBe('minioadmin');
    expect(Config.s3.secretAccessKey).toBe('minioadmin');
    expect(Config.s3.bucket).toBe('metashot-images');
    expect(Config.s3.region).toBe('us-east-1');
    expect(Config.presignedUrlExpiry).toBe(3600);
  });
});