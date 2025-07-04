import { Config } from '../config';

describe('Config', () => {
  it('should have default values', () => {
    expect(Config.port).toBe(8080);
    expect(Config.nodeEnv).toBe('test');
    expect(Config.s3.endpoint).toBe('http://localhost:9000');
    expect(Config.s3.accessKeyId).toBe('minioadmin');
    expect(Config.s3.secretAccessKey).toBe('minioadmin');
    expect(Config.s3.bucket).toBe('metashot-images');
    expect(Config.s3.region).toBe('us-east-1');
    expect(Config.presignedUrlExpiry).toBe(3600);
  });
});