import { Config } from "../config";
import { ScreenshotRequest } from "../types";

export interface ValidationSuccess {
  valid: true;
  // Request with defaults applied and dimensions clamped to the configured range
  request: Required<
    Pick<ScreenshotRequest, "questionId" | "width" | "height">
  > &
    Pick<ScreenshotRequest, "params">;
  // Dimensions the caller asked for that had to be clamped, for logging
  clamped: string[];
}

export interface ValidationFailure {
  valid: false;
  message: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;

// Accepts a JSON number or a numeric string and returns it as a positive
// integer, or null when the value can't be one.
function toPositiveInteger(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value)
        : NaN;

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Validates and normalizes an untrusted screenshot request body. Viewport
// dimensions are clamped rather than rejected so existing callers keep working,
// but oversized viewports can no longer be used to exhaust browser memory.
export function validateScreenshotRequest(body: unknown): ValidationResult {
  if (!isPlainObject(body)) {
    return { valid: false, message: "Request body must be a JSON object" };
  }

  if (body.questionId === undefined || body.questionId === null) {
    return { valid: false, message: "questionId is required" };
  }

  const questionId = toPositiveInteger(body.questionId);
  if (questionId === null) {
    return { valid: false, message: "questionId must be a positive integer" };
  }

  if (body.params !== undefined && !isPlainObject(body.params)) {
    return { valid: false, message: "params must be an object" };
  }

  const { minDimension, maxDimension } = Config.screenshot;
  const clamp = (value: number) =>
    Math.min(Math.max(value, minDimension), maxDimension);

  const clamped: string[] = [];
  const dimensions: Record<"width" | "height", number> = {
    width: clamp(DEFAULT_WIDTH),
    height: clamp(DEFAULT_HEIGHT),
  };

  for (const dimension of ["width", "height"] as const) {
    const raw = body[dimension];
    if (raw === undefined || raw === null) continue;

    const parsed = toPositiveInteger(raw);
    if (parsed === null) {
      return {
        valid: false,
        message: `${dimension} must be a positive integer`,
      };
    }

    const bounded = clamp(parsed);
    if (bounded !== parsed) {
      clamped.push(dimension);
    }
    dimensions[dimension] = bounded;
  }

  return {
    valid: true,
    request: {
      questionId,
      width: dimensions.width,
      height: dimensions.height,
      params: body.params as ScreenshotRequest["params"],
    },
    clamped,
  };
}
