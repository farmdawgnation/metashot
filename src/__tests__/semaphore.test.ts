import { QueueFullError, Semaphore } from "../utils/semaphore";

describe("Semaphore", () => {
  it("runs up to maxConcurrent acquirers immediately", async () => {
    const semaphore = new Semaphore(2, 0);

    await semaphore.acquire();
    await semaphore.acquire();

    expect(semaphore.activeCount).toBe(2);
    await expect(semaphore.acquire()).rejects.toBeInstanceOf(QueueFullError);
  });

  it("queues acquirers up to maxQueued and hands off slots on release", async () => {
    const semaphore = new Semaphore(1, 1);

    const first = await semaphore.acquire();
    let secondAcquired = false;
    const second = semaphore.acquire().then((release) => {
      secondAcquired = true;
      return release;
    });

    expect(semaphore.queuedCount).toBe(1);
    await expect(semaphore.acquire()).rejects.toBeInstanceOf(QueueFullError);
    expect(secondAcquired).toBe(false);

    first();
    await second;

    expect(secondAcquired).toBe(true);
    expect(semaphore.activeCount).toBe(1);
    expect(semaphore.queuedCount).toBe(0);
  });

  it("returns to idle once every slot is released", async () => {
    const semaphore = new Semaphore(1, 1);

    const first = await semaphore.acquire();
    const second = semaphore.acquire();

    first();
    (await second)();

    expect(semaphore.activeCount).toBe(0);
    expect(semaphore.queuedCount).toBe(0);
  });

  it("ignores repeated release calls", async () => {
    const semaphore = new Semaphore(1, 0);

    const release = await semaphore.acquire();
    release();
    release();

    expect(semaphore.activeCount).toBe(0);
  });

  it("reports state changes", async () => {
    const states: Array<{ active: number; queued: number }> = [];
    const semaphore = new Semaphore(1, 1, (state) => states.push(state));

    const release = await semaphore.acquire();
    semaphore.acquire();
    release();

    expect(states).toEqual([
      { active: 1, queued: 0 },
      { active: 1, queued: 1 },
      { active: 1, queued: 0 },
    ]);
  });

  it("rejects invalid limits", () => {
    expect(() => new Semaphore(0, 1)).toThrow("maxConcurrent");
    expect(() => new Semaphore(1, -1)).toThrow("maxQueued");
  });
});
