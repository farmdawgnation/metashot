export interface ScreenshotRequest {
  questionId: number;
  width?: number;
  height?: number;
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
