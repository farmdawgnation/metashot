import { config } from 'dotenv';

config();

export const Config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'metashot-images',
    region: process.env.S3_REGION || 'us-east-1',
  },
  presignedUrlExpiry: parseInt(process.env.PRESIGNED_URL_EXPIRY || '3600', 10),
};