export interface ScreenshotRequest {
  questionId: number;
  width?: number;
  height?: number;
  params?: Record<string, any>;
}

export interface ScreenshotResponse {
  presignedUrl: string;
  fileName: string;
  expiresAt: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
