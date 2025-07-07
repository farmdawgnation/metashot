import AWS from 'aws-sdk';
import { Config } from '../config';

export class StorageService {
  private s3: AWS.S3;

  constructor() {
    const s3Config: AWS.S3.ClientConfiguration = {
      accessKeyId: Config.s3.accessKeyId,
      secretAccessKey: Config.s3.secretAccessKey,
      region: Config.s3.region,
      signatureVersion: 'v4',
    };

    // Only set endpoint and s3ForcePathStyle for non-AWS S3 services (like MinIO)
    if (Config.s3.endpoint) {
      s3Config.endpoint = Config.s3.endpoint;
      s3Config.s3ForcePathStyle = true;
    }

    this.s3 = new AWS.S3(s3Config);
  }

  async ensureBucketExists(): Promise<void> {
    try {
      await this.s3.headBucket({ Bucket: Config.s3.bucket }).promise();
    } catch (error: any) {
      if (error.statusCode === 404) {
        await this.s3.createBucket({ Bucket: Config.s3.bucket }).promise();
      } else {
        throw error;
      }
    }
  }

  async uploadImage(buffer: Buffer, fileName: string): Promise<void> {
    const params = {
      Bucket: Config.s3.bucket,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/png',
      ACL: 'private',
    };

    await this.s3.upload(params).promise();
  }

  async generatePresignedUrl(fileName: string): Promise<string> {
    const params = {
      Bucket: Config.s3.bucket,
      Key: fileName,
      Expires: Config.presignedUrlExpiry,
    };

    return this.s3.getSignedUrl('getObject', params);
  }

  generateFileName(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `screenshot-${timestamp}-${random}.png`;
  }
}