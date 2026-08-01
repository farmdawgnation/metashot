import { Histogram } from "prom-client";
import { traceAndTrack } from "../observability";

describe("traceAndTrack", () => {
  const makeHistogram = (labelNames: string[] = ["status"]) =>
    new Histogram({
      name: `test_histogram_${Math.random().toString(36).slice(2)}`,
      help: "test histogram",
      labelNames,
      registers: [],
    });

  it("returns the operation's result when no histogram is given", async () => {
    const result = await traceAndTrack({ name: "op" }, async () => "value");

    expect(result).toBe("value");
  });

  it("propagates the operation's error when no histogram is given", async () => {
    await expect(
      traceAndTrack({ name: "op" }, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });

  it("records the histogram with successLabels on success", async () => {
    const histogram = makeHistogram();

    const result = await traceAndTrack(
      {
        name: "op",
        histogram,
        successLabels: { status: "success" },
        errorLabels: { status: "error" },
      },
      async () => "value",
    );

    expect(result).toBe("value");
    const metric = await histogram.get();
    const sample = metric.values.find((v) => v.labels.status === "success");
    expect(sample).toBeDefined();
  });

  it("records the histogram with errorLabels and rethrows on error", async () => {
    const histogram = makeHistogram();

    await expect(
      traceAndTrack(
        {
          name: "op",
          histogram,
          successLabels: { status: "success" },
          errorLabels: { status: "error" },
        },
        async () => {
          throw new Error("boom");
        },
      ),
    ).rejects.toThrow("boom");

    const metric = await histogram.get();
    const errorSample = metric.values.find((v) => v.labels.status === "error");
    expect(errorSample).toBeDefined();
  });

  it("uses base labels as-is when no success/error labels are given", async () => {
    const histogram = makeHistogram(["operation"]);

    await traceAndTrack(
      { name: "op", histogram, labels: { operation: "upload" } },
      async () => "value",
    );

    const metric = await histogram.get();
    const sample = metric.values.find((v) => v.labels.operation === "upload");
    expect(sample).toBeDefined();
  });

  it("does not fail the operation when the histogram labels are invalid on success", async () => {
    const histogram = makeHistogram(["status"]);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await traceAndTrack(
      {
        name: "op",
        histogram,
        // "unexpected" isn't a declared label, so prom-client will throw internally
        successLabels: { status: "success", unexpected: "label" },
      },
      async () => "value",
    );

    expect(result).toBe("value");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("still rethrows the operation's error when the histogram labels are invalid", async () => {
    const histogram = makeHistogram(["status"]);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      traceAndTrack(
        {
          name: "op",
          histogram,
          errorLabels: { status: "error", unexpected: "label" },
        },
        async () => {
          throw new Error("boom");
        },
      ),
    ).rejects.toThrow("boom");

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
