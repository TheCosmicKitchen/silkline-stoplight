// Time behind an interface, so the same machine can run on real time or on test time.

export interface Clock {
  /** Current time in ms. Only differences matter, so the starting value is arbitrary. */
  now(): number;
  /** Run `callback` after `delayMs` of THIS clock's time. Returns a cancel function (safe to call twice). */
  schedule(callback: () => void, delayMs: number): () => void;
}

// ─── Real time ─────────────────────────────────────────────────────────────────

/** Wall-clock time. performance.now() counts steadily even if the computer's clock is changed. */
export const realClock: Clock = {
  now: () => performance.now(),
  schedule(callback, delayMs) {
    const timeoutId = setTimeout(callback, Math.max(0, delayMs));
    return () => clearTimeout(timeoutId);
  },
};

// ─── Test time ─────────────────────────────────────────────────────────────────

export interface ManualClock extends Clock {
  /** Move time forward by `ms`, running every callback that falls due, in time order. */
  advance(ms: number): void;
}

/** A callback waiting to run, and the clock time it's due. */
interface PendingTimer {
  dueAt: number;
  callback: () => void;
}

/** Time only moves when you call advance(). Fully predictable, for tests. */
export function manualClock(startTime = 0): ManualClock {
  let currentTime = startTime;
  let nextTimerId = 0;
  const pendingTimers = new Map<number, PendingTimer>();

  /**
   * Remove and return the pending timer that's due soonest, as long as it's due by `endTime`.
   * On a tie, the one scheduled first wins (a Map keeps insertion order, and we only switch
   * to a later entry if it's strictly earlier).
   */
  function takeSoonestTimerDueBy(endTime: number): PendingTimer | undefined {
    let soonestId: number | undefined;
    let soonest: PendingTimer | undefined;

    for (const [id, timer] of pendingTimers) {
      const isDue = timer.dueAt <= endTime;
      const isSoonerThanBest = soonest === undefined || timer.dueAt < soonest.dueAt;
      if (isDue && isSoonerThanBest) {
        soonestId = id;
        soonest = timer;
      }
    }

    if (soonestId !== undefined) pendingTimers.delete(soonestId);
    return soonest;
  }

  return {
    now: () => currentTime,

    schedule(callback, delayMs) {
      const id = nextTimerId++;
      pendingTimers.set(id, { dueAt: currentTime + Math.max(0, delayMs), callback });
      return () => pendingTimers.delete(id);
    },

    advance(ms) {
      if (!(ms >= 0)) throw new Error(`advance needs a non-negative number, got ${ms}`);
      const endTime = currentTime + ms;

      // Run due timers one at a time, earliest first. We look again after each one because
      // a callback can schedule a new timer that is also due before endTime (the runner books
      // its next tick from inside every tick).
      let timer = takeSoonestTimerDueBy(endTime);
      while (timer) {
        currentTime = timer.dueAt; // jump to the moment it was due, so now() is exact inside it
        timer.callback();
        timer = takeSoonestTimerDueBy(endTime);
      }

      currentTime = endTime;
    },
  };
}
