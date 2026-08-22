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
  return sanitizeValue(error, new Map()) as T;
}

/**
 * Recursive worker for sanitizeError. `seen` maps each already-visited source object to its
 * sanitized copy, so circular references resolve to that copy instead of recursing forever.
 */
function sanitizeValue(value: unknown, seen: Map<object, unknown>): unknown {
  if (!value) return value;

  if (typeof value === "string") {
    return redactSensitiveInfo(value);
  }

  if (typeof value !== "object") return value;

  const visited = seen.get(value);
  if (visited !== undefined) return visited;

  if (value instanceof Error) {
    // Preserve the prototype so the copy keeps its class (TypeError, etc.)
    const copy = Object.create(Object.getPrototypeOf(value)) as Error;
    seen.set(value, copy);
    copy.message = redactSensitiveInfo(value.message);
    copy.name = value.name;
    if (value.stack) {
      copy.stack = redactSensitiveInfo(value.stack);
    }
    // Copy any additional custom properties on the error object
    const record = value as unknown as Record<string, unknown>;
    const target = copy as unknown as Record<string, unknown>;
    for (const key of Object.keys(value)) {
      target[key] = sanitizeValue(record[key], seen);
    }
    return copy;
  }

  try {
    const record = value as Record<string, unknown>;
    const copy = (Array.isArray(value) ? [] : {}) as Record<string, unknown>;
    seen.set(value, copy);
    for (const [key, val] of Object.entries(record)) {
      copy[key] = sanitizeValue(val, seen);
    }
    return copy;
  } catch {
    return value;
  }
}
