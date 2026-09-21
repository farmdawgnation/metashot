import { TimeoutError, withTimeout } from "../utils/timeout";

describe("withTimeout", () => {
  it("resolves when the promise settles in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 1000)).resolves.toBe("ok");
  });

  it("propagates rejections from the wrapped promise", async () => {
    await expect(
      withTimeout(Promise.reject(new Error("boom")), 1000),
    ).rejects.toThrow("boom");
  });

  it("rejects with a TimeoutError once the deadline passes", async () => {
    const never = new Promise(() => {});

    await expect(withTimeout(never, 5, "too slow")).rejects.toThrow(
      TimeoutError,
    );
  });

  it("does not leave the timer pending after the promise settles", async () => {
    jest.useFakeTimers();
    try {
      await withTimeout(Promise.resolve("ok"), 60000);
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
