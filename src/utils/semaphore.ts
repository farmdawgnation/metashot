export class QueueFullError extends Error {
  constructor(message = "Queue is full") {
    super(message);
    this.name = "QueueFullError";
  }
}

export type Release = () => void;

export interface SemaphoreState {
  active: number;
  queued: number;
}

/**
 * Counting semaphore with a bounded wait queue.
 *
 * Callers past `maxConcurrent` wait for a slot; callers past `maxQueued`
 * waiters are rejected immediately with `QueueFullError` so a flood of
 * requests can't pile up in memory waiting on a browser that is already busy.
 */
export class Semaphore {
  private active = 0;
  private readonly waiters: Array<(release: Release) => void> = [];

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueued: number,
    private readonly onStateChange?: (state: SemaphoreState) => void,
  ) {
    if (maxConcurrent < 1) {
      throw new Error("maxConcurrent must be at least 1");
    }
    if (maxQueued < 0) {
      throw new Error("maxQueued must not be negative");
    }
  }

  get activeCount(): number {
    return this.active;
  }

  get queuedCount(): number {
    return this.waiters.length;
  }

  /**
   * Acquires a slot. Resolves with a release function that must be called
   * exactly once when the work is done; repeat calls are ignored.
   */
  acquire(): Promise<Release> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      this.notify();
      return Promise.resolve(this.createRelease());
    }

    if (this.waiters.length >= this.maxQueued) {
      return Promise.reject(new QueueFullError());
    }

    return new Promise<Release>((resolve) => {
      this.waiters.push(resolve);
      this.notify();
    });
  }

  private createRelease(): Release {
    let released = false;

    return () => {
      if (released) return;
      released = true;

      // Hand the slot straight to the next waiter instead of decrementing,
      // so the active count never dips below the work actually in flight.
      const next = this.waiters.shift();
      if (next) {
        next(this.createRelease());
      } else {
        this.active--;
      }
      this.notify();
    };
  }

  private notify(): void {
    this.onStateChange?.({ active: this.active, queued: this.waiters.length });
  }
}
