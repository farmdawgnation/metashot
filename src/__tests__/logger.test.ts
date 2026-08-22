import { sanitizingErrorSerializer } from "../logger";

describe("sanitizingErrorSerializer", () => {
  it("should return a JSON-serializable object retaining message and stack", () => {
    const error = new TypeError(
      "Navigation to http://localhost:3000/embed/question/secretToken failed",
    );

    const serialized = sanitizingErrorSerializer(error);
    expect(serialized).not.toBeInstanceOf(Error);

    const roundTripped = JSON.parse(JSON.stringify(serialized));
    expect(roundTripped.type).toBe("TypeError");
    expect(roundTripped.message).toBe(
      "Navigation to http://localhost:3000/embed/question/[REDACTED] failed",
    );
    expect(roundTripped.stack).toEqual(expect.any(String));
    expect(JSON.stringify(serialized)).not.toContain("secretToken");
  });

  it("should redact non-Error values without std serialization", () => {
    const serialized = sanitizingErrorSerializer({
      url: "http://localhost:3000/embed/question/secretToken",
      code: 500,
    });

    expect(serialized).toEqual({
      url: "http://localhost:3000/embed/question/[REDACTED]",
      code: 500,
    });
  });

  it("should not throw on circular error properties", () => {
    const error = new Error("boom");
    const details: Record<string, unknown> = {};
    details.loop = details;
    (error as unknown as Record<string, unknown>).details = details;

    expect(() => sanitizingErrorSerializer(error)).not.toThrow();
  });
});
