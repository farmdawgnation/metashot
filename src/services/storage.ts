import AWS from 'aws-sdk';
import { Config } from '../config';

export class StorageService {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: Config.s3.endpoint,
      accessKeyId: Config.s3.accessKeyId,
      secretAccessKey: Config.s3.secretAccessKey,
      region: Config.s3.region,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
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