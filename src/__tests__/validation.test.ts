import { validateScreenshotRequest } from "../utils/validation";
import { Config } from "../config";

describe("validateScreenshotRequest", () => {
  const expectValid = (body: unknown) => {
    const result = validateScreenshotRequest(body);
    if (!result.valid) {
      throw new Error(`Expected valid request, got: ${result.message}`);
    }
    return result;
  };

  const expectInvalid = (body: unknown) => {
    const result = validateScreenshotRequest(body);
    if (result.valid) {
      throw new Error("Expected invalid request");
    }
    return result;
  };

  describe("questionId", () => {
    it("accepts a positive integer", () => {
      expect(expectValid({ questionId: 42 }).request.questionId).toBe(42);
    });

    it("accepts a numeric string", () => {
      expect(expectValid({ questionId: "42" }).request.questionId).toBe(42);
    });

    it("requires questionId", () => {
      expect(expectInvalid({}).message).toBe("questionId is required");
      expect(expectInvalid({ questionId: null }).message).toBe(
        "questionId is required",
      );
    });

    it.each([0, -1, 1.5, "abc", "1e3", true, [], {}, Number.MAX_VALUE, NaN])(
      "rejects %p",
      (questionId) => {
        expect(expectInvalid({ questionId }).message).toBe(
          "questionId must be a positive integer",
        );
      },
    );
  });

  describe("width and height", () => {
    it("defaults to 1920x1080", () => {
      const { request } = expectValid({ questionId: 1 });
      expect(request.width).toBe(1920);
      expect(request.height).toBe(1080);
    });

    it("passes through in-range dimensions", () => {
      const { request, clamped } = expectValid({
        questionId: 1,
        width: 800,
        height: 600,
      });
      expect(request.width).toBe(800);
      expect(request.height).toBe(600);
      expect(clamped).toEqual([]);
    });

    it("clamps oversized dimensions to the configured maximum", () => {
      const { request, clamped } = expectValid({
        questionId: 1,
        width: 100000,
        height: 999999,
      });
      expect(request.width).toBe(Config.screenshot.maxDimension);
      expect(request.height).toBe(Config.screenshot.maxDimension);
      expect(clamped).toEqual(["width", "height"]);
    });

    it("clamps undersized dimensions to the configured minimum", () => {
      const { request, clamped } = expectValid({
        questionId: 1,
        width: 1,
        height: 640,
      });
      expect(request.width).toBe(Config.screenshot.minDimension);
      expect(request.height).toBe(640);
      expect(clamped).toEqual(["width"]);
    });

    it.each(["width", "height"])("rejects a non-integer %s", (dimension) => {
      expect(expectInvalid({ questionId: 1, [dimension]: -5 }).message).toBe(
        `${dimension} must be a positive integer`,
      );
      expect(
        expectInvalid({ questionId: 1, [dimension]: "wide" }).message,
      ).toBe(`${dimension} must be a positive integer`);
    });
  });

  describe("params", () => {
    it("accepts an object", () => {
      expect(
        expectValid({ questionId: 1, params: { region: "us" } }).request.params,
      ).toEqual({ region: "us" });
    });

    it("rejects non-objects", () => {
      expect(expectInvalid({ questionId: 1, params: "nope" }).message).toBe(
        "params must be an object",
      );
      expect(expectInvalid({ questionId: 1, params: [1, 2] }).message).toBe(
        "params must be an object",
      );
    });
  });

  it.each([null, undefined, "string", 5, [1]])(
    "rejects a non-object body (%p)",
    (body) => {
      expect(expectInvalid(body).message).toBe(
        "Request body must be a JSON object",
      );
    },
  );
});
