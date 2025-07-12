import { 
  S3Client, 
  HeadBucketCommand, 
  CreateBucketCommand, 
  PutObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Config } from '../config';

export class StorageService {
  private s3: S3Client;

  constructor() {
    const s3Config = {
      credentials: {
        accessKeyId: Config.s3.accessKeyId,
        secretAccessKey: Config.s3.secretAccessKey,
      },
      region: Config.s3.region,
    };

    // Only set endpoint and forcePathStyle for non-AWS S3 services (like MinIO)
    if (Config.s3.endpoint) {
      (s3Config as any).endpoint = Config.s3.endpoint;
      (s3Config as any).forcePathStyle = true;
    }

    this.s3 = new S3Client(s3Config);
  }

  async ensureBucketExists(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: Config.s3.bucket }));
    } catch (error: any) {
      if (error.$metadata?.httpStatusCode === 404) {
        await this.s3.send(new CreateBucketCommand({ Bucket: Config.s3.bucket }));
      } else {
        throw error;
      }
    }
  }

  async uploadImage(buffer: Buffer, fileName: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: Config.s3.bucket,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/png',
    });

    await this.s3.send(command);
  }

  async generatePresignedUrl(fileName: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: Config.s3.bucket,
      Key: fileName,
    });

    return await getSignedUrl(this.s3, command, { expiresIn: Config.presignedUrlExpiry });
  }

  generateFileName(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `screenshot-${timestamp}-${random}.png`;
  }
}