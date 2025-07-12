import { 
  S3Client, 
  HeadBucketCommand, 
  CreateBucketCommand, 
  PutObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Config } from '../config';
import {
  s3OperationDuration,
  s3OperationErrors,
  uploadSize,
  metricsUtils,
} from '../metrics';
import { tracingUtils } from '../tracing';

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
      await metricsUtils.trackDuration(
        s3OperationDuration,
        { operation: 'bucket_exists' },
        async () => {
          await this.s3.send(new HeadBucketCommand({ Bucket: Config.s3.bucket }));
        }
      );
    } catch (error: any) {
      if (error.$metadata?.httpStatusCode === 404) {
        try {
          await metricsUtils.trackDuration(
            s3OperationDuration,
            { operation: 'create_bucket' },
            async () => {
              await this.s3.send(new CreateBucketCommand({ Bucket: Config.s3.bucket }));
            }
          );
        } catch (createError: any) {
          s3OperationErrors.inc({ 
            operation: 'create_bucket', 
            error_type: createError.name || 'unknown' 
          });
          throw createError;
        }
      } else {
        s3OperationErrors.inc({ 
          operation: 'bucket_exists', 
          error_type: error.name || 'unknown' 
        });
        throw error;
      }
    }
  }

  async uploadImage(buffer: Buffer, fileName: string): Promise<void> {
    // Record upload size
    uploadSize.observe(buffer.length);

    await tracingUtils.traceOperation(
      's3.upload',
      async () => {
        try {
          await metricsUtils.trackDuration(
            s3OperationDuration,
            { operation: 'upload' },
            async () => {
              const command = new PutObjectCommand({
                Bucket: Config.s3.bucket,
                Key: fileName,
                Body: buffer,
                ContentType: 'image/png',
              });

              await this.s3.send(command);
            }
          );
        } catch (error: any) {
          s3OperationErrors.inc({ 
            operation: 'upload', 
            error_type: error.name || 'unknown' 
          });
          throw error;
        }
      },
      {
        's3.bucket': Config.s3.bucket,
        's3.key': fileName,
        's3.contentType': 'image/png',
        's3.size': buffer.length,
      }
    );
  }

  async generatePresignedUrl(fileName: string): Promise<string> {
    return await tracingUtils.traceOperation(
      's3.presigned_url',
      async () => {
        try {
          return await metricsUtils.trackDuration(
            s3OperationDuration,
            { operation: 'presigned_url' },
            async () => {
              const command = new GetObjectCommand({
                Bucket: Config.s3.bucket,
                Key: fileName,
              });

              return await getSignedUrl(this.s3, command, { expiresIn: Config.presignedUrlExpiry });
            }
          );
        } catch (error: any) {
          s3OperationErrors.inc({ 
            operation: 'presigned_url', 
            error_type: error.name || 'unknown' 
          });
          throw error;
        }
      },
      {
        's3.bucket': Config.s3.bucket,
        's3.key': fileName,
        's3.expiresIn': Config.presignedUrlExpiry,
      }
    );
  }

  generateFileName(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `screenshot-${timestamp}-${random}.png`;
  }
}