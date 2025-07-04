export interface ScreenshotRequest {
  url: string;
  width?: number;
  height?: number;
  waitForSelector?: string;
  timeout?: number;
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