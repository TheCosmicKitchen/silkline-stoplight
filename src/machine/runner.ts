// The runner keeps a machine running: it holds the current state, tells the machine the time
// every TICK_MS, and tells subscribers whenever the state changes.

import { realClock, type Clock } from "./clock";
import { initialState, receive } from "./timing";
import type { ExecutionState, Machine } from "./types";

/**
 * How often the runner tells the machine the time. A change shows up at most this late on
 * screen, so it should be well below the machine's shortest edge.
 */
export const TICK_MS = 50;

export interface Runner {
  readonly state: ExecutionState;
  /** Begin ticking, first catching up on any time that has already passed. */
  start(): void;
  /** Stop ticking. The scheduled tick is cancelled. */
  stop(): void;
  /** Be told whenever the state changes. Returns an unsubscribe function. */
  subscribe(listener: (state: ExecutionState) => void): () => void;
}

export function createRunner(machine: Machine, clock: Clock = realClock): Runner {
  let state = initialState(machine, clock.now());
  let running = false;
  let cancelScheduledTick: (() => void) | undefined;
  const listeners = new Set<(state: ExecutionState) => void>();

  /** Tell the machine the time, schedule the next tick, and tell subscribers if anything moved. */
  function tick() {
    const before = state;
    state = receive(machine, state, { type: "TIME_OBSERVED", at: clock.now() });

    cancelScheduledTick = clock.schedule(tick, TICK_MS);
    if (state !== before) listeners.forEach((listener) => listener(state));
  }

  return {
    get state() {
      return state;
    },
    start() {
      if (running) return;
      running = true;
      tick();
    },
    stop() {
      running = false;
      cancelScheduledTick?.();
      cancelScheduledTick = undefined;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
