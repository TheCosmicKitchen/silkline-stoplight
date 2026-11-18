import { useEffect, useState } from "react";
import type { Clock } from "./clock";
import { createRunner } from "./runner";
import type { ExecutionState, Machine } from "./types";

/**
 * React's view of a runner: returns the current state and redraws when it changes.
 *
 * The machine and clock are read once, when the component first renders. To switch to a
 * different machine, give the component a new `key` so React starts it fresh.
 */
export function useMachine(machine: Machine, clock?: Clock): ExecutionState {
  // The runner is created on the first render and kept for the component's lifetime.
  const [runner] = useState(() => createRunner(machine, clock));
  const [state, setState] = useState(runner.state);

  useEffect(() => {
    const unsubscribe = runner.subscribe(setState);
    runner.start();
    // Cleanup on unmount: stop ticking and stop listening.
    return () => {
      unsubscribe();
      runner.stop();
    };
  }, [runner]);

  return state;
}
