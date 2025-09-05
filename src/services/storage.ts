import {
  S3Client,
  S3ClientConfig,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Config } from "../config";
import {
  s3OperationDuration,
  s3OperationErrors,
  uploadSize,
  metricsUtils,
} from "../metrics";
import { tracingUtils } from "../tracing";

interface ExtendedS3ClientConfig extends S3ClientConfig {
  endpoint?: string;
  forcePathStyle?: boolean;
}

interface AWSError {
  name?: string;
  $metadata?: {
    httpStatusCode?: number;
  };
}

function isAWSError(error: unknown): error is AWSError {
  return typeof error === "object" && error !== null;
}

export class StorageService {
  private s3: S3Client;

  constructor() {
    const s3Config: ExtendedS3ClientConfig = {
      credentials: {
        accessKeyId: Config.s3.accessKeyId,
        secretAccessKey: Config.s3.secretAccessKey,
      },
      region: Config.s3.region,
    };

    // Only set endpoint and forcePathStyle for non-AWS S3 services (like MinIO)
    if (Config.s3.endpoint) {
      s3Config.endpoint = Config.s3.endpoint;
      s3Config.forcePathStyle = true;
    }

    this.s3 = new S3Client(s3Config);
  }

  async ensureBucketExists(): Promise<void> {
    try {
      await metricsUtils.trackDuration(
        s3OperationDuration,
        { operation: "bucket_exists" },
        async () => {
          await this.s3.send(
            new HeadBucketCommand({ Bucket: Config.s3.bucket }),
          );
        },
      );
    } catch (error: unknown) {
      if (isAWSError(error) && error.$metadata?.httpStatusCode === 404) {
        try {
          await metricsUtils.trackDuration(
            s3OperationDuration,
            { operation: "create_bucket" },
            async () => {
              await this.s3.send(
                new CreateBucketCommand({ Bucket: Config.s3.bucket }),
              );
            },
          );
        } catch (createError: unknown) {
          const errorName =
            isAWSError(createError) && createError.name
              ? createError.name
              : "unknown";
          s3OperationErrors.inc({
            operation: "create_bucket",
            error_type: errorName,
          });
          throw createError;
        }
      } else {
        const errorName =
          isAWSError(error) && error.name ? error.name : "unknown";
        s3OperationErrors.inc({
          operation: "bucket_exists",
          error_type: errorName,
        });
        throw error;
      }
    }
  }

  async uploadImage(buffer: Buffer, fileName: string): Promise<void> {
    // Record upload size
    uploadSize.observe(buffer.length);

    await tracingUtils.traceOperation(
      "s3.upload",
      async () => {
        try {
          await metricsUtils.trackDuration(
            s3OperationDuration,
            { operation: "upload" },
            async () => {
              const command = new PutObjectCommand({
                Bucket: Config.s3.bucket,
                Key: fileName,
                Body: buffer,
                ContentType: "image/png",
              });

              await this.s3.send(command);
            },
          );
        } catch (error: unknown) {
          const errorName =
            isAWSError(error) && error.name ? error.name : "unknown";
          s3OperationErrors.inc({
            operation: "upload",
            error_type: errorName,
          });
          throw error;
        }
      },
      {
        "s3.bucket": Config.s3.bucket,
        "s3.key": fileName,
        "s3.contentType": "image/png",
        "s3.size": buffer.length,
      },
    );
  }

  async generatePresignedUrl(fileName: string): Promise<string> {
    return await tracingUtils.traceOperation(
      "s3.presigned_url",
      async () => {
        try {
          return await metricsUtils.trackDuration(
            s3OperationDuration,
            { operation: "presigned_url" },
            async () => {
              const command = new GetObjectCommand({
                Bucket: Config.s3.bucket,
                Key: fileName,
              });

              return await getSignedUrl(this.s3, command, {
                expiresIn: Config.presignedUrlExpiry,
              });
            },
          );
        } catch (error: unknown) {
          const errorName =
            isAWSError(error) && error.name ? error.name : "unknown";
          s3OperationErrors.inc({
            operation: "presigned_url",
            error_type: errorName,
          });
          throw error;
        }
      },
      {
        "s3.bucket": Config.s3.bucket,
        "s3.key": fileName,
        "s3.expiresIn": Config.presignedUrlExpiry,
      },
    );
  }

  generateFileName(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `screenshot-${timestamp}-${random}.png`;
  }
}
