import { Histogram } from "prom-client";
import { tracingUtils } from "./tracing";

export interface TraceAndTrackOptions {
  // Span/operation name, shared by the trace and (if present) the histogram timer
  name: string;
  attributes?: Record<string, any>;
  histogram?: Histogram<string>;
  labels?: Record<string, string | number>;
  // Extra labels merged in on success/error, e.g. a dynamic `status` label
  successLabels?: Record<string, string | number>;
  errorLabels?: Record<string, string | number>;
}

type TimerEnd = (labels?: Record<string, string | number>) => number;

// Metrics are best-effort: a labeling mistake (e.g. a label not declared on
// the histogram) must not fail the operation it's measuring.
function startTimer(
  histogram: Histogram<string>,
  labels?: Record<string, string | number>,
): TimerEnd | null {
  try {
    return histogram.startTimer(labels);
  } catch (error) {
    console.error("Failed to start histogram timer:", error);
    return null;
  }
}

function endTimer(
  end: TimerEnd | null,
  labels?: Record<string, string | number>,
): void {
  if (!end) return;
  try {
    end(labels);
  } catch (error) {
    console.error("Failed to record histogram duration:", error);
  }
}

// Wraps an operation with a trace span and, if a histogram is provided, a
// duration timer whose labels can be refined based on the operation's outcome.
export async function traceAndTrack<T>(
  options: TraceAndTrackOptions,
  operation: () => Promise<T>,
): Promise<T> {
  return tracingUtils.traceOperation(
    options.name,
    async () => {
      if (!options.histogram) {
        return operation();
      }

      const end = startTimer(options.histogram, options.labels);
      try {
        const result = await operation();
        endTimer(end, options.successLabels);
        return result;
      } catch (error) {
        endTimer(end, options.errorLabels);
        throw error;
      }
    },
    options.attributes,
  );
}
