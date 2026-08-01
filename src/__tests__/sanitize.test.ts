import { redactSensitiveInfo, sanitizeError } from "../utils/sanitize";

describe("Sanitize Utility", () => {
  describe("redactSensitiveInfo", () => {
    it("should redact Metabase question embed URL tokens", () => {
      const input =
        "Error page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/embed/question/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6...#bordered=true";
      const sanitized = redactSensitiveInfo(input);
      expect(sanitized).not.toContain("eyJhbGci");
      expect(sanitized).toBe(
        "Error page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/embed/question/[REDACTED]#bordered=true",
      );
    });

    it("should redact Metabase dashboard embed URL tokens", () => {
      const input =
        "Failed to load https://metabase.example.com/embed/dashboard/my-secret-token-123#titled=true";
      const sanitized = redactSensitiveInfo(input);
      expect(sanitized).not.toContain("my-secret-token-123");
      expect(sanitized).toBe(
        "Failed to load https://metabase.example.com/embed/dashboard/[REDACTED]#titled=true",
      );
    });

    it("should redact standalone JWT tokens", () => {
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6e3F1ZXN0aW9uOjF9fQ.signature123";
      const input = `Authentication failed for token ${token} in request`;
      const sanitized = redactSensitiveInfo(input);
      expect(sanitized).not.toContain(token);
      expect(sanitized).toBe(
        "Authentication failed for token [REDACTED] in request",
      );
    });

    it("should redact sensitive query parameters in URLs", () => {
      const input =
        "Request failed: http://minio:9000/bucket/file.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=cred&X-Amz-Signature=secretSig123";
      const sanitized = redactSensitiveInfo(input);
      expect(sanitized).not.toContain("secretSig123");
      expect(sanitized).not.toContain("cred");
      expect(sanitized).toBe(
        "Request failed: http://minio:9000/bucket/file.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=[REDACTED]&X-Amz-Signature=[REDACTED]",
      );
    });

    it("should leave normal non-sensitive messages untouched", () => {
      const input = "LoadingSpinner wait timeout - continuing";
      expect(redactSensitiveInfo(input)).toBe(input);
    });

    it("should handle empty or null string gracefully", () => {
      expect(redactSensitiveInfo("")).toBe("");
    });
  });

  describe("sanitizeError", () => {
    it("should sanitize Error object message and stack trace", () => {
      const error = new Error(
        "Navigation to http://localhost:3000/embed/question/secretToken failed",
      );
      error.stack =
        "Error: Navigation to http://localhost:3000/embed/question/secretToken failed\n    at test.js:10";

      const sanitized = sanitizeError(error);
      expect(sanitized.message).not.toContain("secretToken");
      expect(sanitized.message).toBe(
        "Navigation to http://localhost:3000/embed/question/[REDACTED] failed",
      );
      expect(sanitized.stack).not.toContain("secretToken");
      expect(sanitized.stack).toContain(
        "http://localhost:3000/embed/question/[REDACTED]",
      );
    });

    it("should sanitize plain error string", () => {
      const errorStr =
        "Error at http://localhost:3000/embed/question/secretToken";
      const sanitized = sanitizeError(errorStr);
      expect(sanitized).toBe(
        "Error at http://localhost:3000/embed/question/[REDACTED]",
      );
    });

    it("should sanitize nested error object fields", () => {
      const errorObj = {
        details: {
          url: "http://localhost:3000/embed/question/secretToken",
        },
        code: 500,
      };
      const sanitized = sanitizeError(errorObj);
      expect(sanitized.details.url).toBe(
        "http://localhost:3000/embed/question/[REDACTED]",
      );
      expect(sanitized.code).toBe(500);
    });
  });
});
