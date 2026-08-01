/**
 * Utility functions for redacting sensitive URLs, JWTs, and tokens from error messages, logs, and trace spans.
 */

/**
 * Redacts sensitive tokens and URLs from strings (such as error messages, stack traces, log outputs).
 * Specifically targets:
 * - Metabase signed embed URLs containing tokens (e.g. /embed/question/<token> or /embed/dashboard/<token>)
 * - Standalone JWT tokens (eyJ...)
 * - Sensitive query parameters (e.g. token=..., access_token=..., secret=..., signature=..., X-Amz-Signature=...)
 */
export function redactSensitiveInfo(input: string): string {
  if (!input) return input;

  let sanitized = input;

  // 1. Redact Metabase embed URL path tokens: /embed/(question|dashboard|card|pivot)/<token>
  sanitized = sanitized.replace(
    /(\/embed\/(?:question|dashboard|card|pivot)\/)[^\s"'#?]+/gi,
    "$1[REDACTED]",
  );

  // 2. Redact standalone JWT tokens (eyJ... . eyJ... . ...)
  sanitized = sanitized.replace(
    /\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
    "[REDACTED]",
  );

  // 3. Redact sensitive query parameters in URLs
  sanitized = sanitized.replace(
    /([?&](?:token|access_token|secret|signature|X-Amz-Signature|X-Amz-Credential|auth|api_key|key)=)[^&\s"'#]+/gi,
    "$1[REDACTED]",
  );

  return sanitized;
}

/**
 * Sanitizes an error object or value by redacting sensitive tokens and URLs from its message and stack trace.
 */
export function sanitizeError<T>(error: T): T {
  if (!error) return error;

  if (error instanceof Error) {
    const copy = new Error(redactSensitiveInfo(error.message));
    copy.name = error.name;
    if (error.stack) {
      copy.stack = redactSensitiveInfo(error.stack);
    }
    // Copy any additional custom properties on the error object
    const record = error as unknown as Record<string, unknown>;
    for (const key of Object.keys(error)) {
      const val = record[key];
      if (typeof val === "string") {
        (copy as unknown as Record<string, unknown>)[key] =
          redactSensitiveInfo(val);
      } else if (val && typeof val === "object") {
        (copy as unknown as Record<string, unknown>)[key] = sanitizeError(val);
      } else {
        (copy as unknown as Record<string, unknown>)[key] = val;
      }
    }
    return copy as unknown as T;
  }

  if (typeof error === "string") {
    return redactSensitiveInfo(error) as unknown as T;
  }

  if (typeof error === "object") {
    try {
      const record = error as Record<string, unknown>;
      const copy = (Array.isArray(error) ? [] : {}) as Record<string, unknown>;
      for (const [key, val] of Object.entries(record)) {
        if (typeof val === "string") {
          copy[key] = redactSensitiveInfo(val);
        } else if (val && typeof val === "object") {
          copy[key] = sanitizeError(val);
        } else {
          copy[key] = val;
        }
      }
      return copy as unknown as T;
    } catch {
      return error;
    }
  }

  return error;
}
