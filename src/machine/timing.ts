// The timing core: given a state and an event, work out where the machine is now.
// Each event carries its own time (`at`), so tests can feed in any moment they like.

import type { Edge, ExecutionState, Machine, MachineEvent } from "./types";

export function initialState(machine: Machine, at: number): ExecutionState {
  return { node: machine.initialNode, enteredAt: at };
}

/**
 * Feed one event into the machine and return where it ends up. Returns the same state object
 * if nothing changed.
 *
 *   1. catch up – take every edge that has come due by `event.at`
 *   2. handle   – do whatever this type of event does, at `event.at`
 */
export function receive(machine: Machine, state: ExecutionState, event: MachineEvent): ExecutionState {
  const caughtUp = catchUp(machine, state, event.at);

  switch (event.type) {
    case "TIME_OBSERVED":
      return caughtUp; // reading the clock is all this event does
  }
}

/**
 * Take every edge that has come due by `at`, in order, and return where the machine ends up.
 * It keeps going after each step, so after a long gap (a sleeping laptop, a background tab)
 * it replays green → yellow → red → green… up to the present.
 */
function catchUp(machine: Machine, state: ExecutionState, at: number): ExecutionState {
  let current = state;

  // Ends because every edge moves enteredAt forward (validateMachine requires afterMs > 0).
  let edge = findDueEdge(machine, current, at);
  while (edge) {
    // Enter at the edge's exact deadline. Events usually arrive a little after it (they come
    // on a periodic tick, and timers run late); entering at the deadline keeps that lag from
    // adding up cycle after cycle.
    current = { node: edge.to, enteredAt: current.enteredAt + edge.afterMs };
    edge = findDueEdge(machine, current, at);
  }

  return current;
}

/**
 * Of the edges out of the current node whose time is up at `at`, the one whose deadline came
 * first, so a late event replays what would have happened on time. On a tie, the first one
 * listed wins.
 *
 * `>=` puts a deadline in the next node: green entered at 0 with a 5000ms edge covers
 * [0, 5000), so at exactly 5000 the light is yellow.
 */
function findDueEdge(machine: Machine, state: ExecutionState, at: number): Edge | undefined {
  const timeInNode = at - state.enteredAt;
  let earliest: Edge | undefined;

  for (const edge of edgesLeaving(machine, state.node)) {
    const isDue = timeInNode >= edge.afterMs;
    const isEarlierThanBest = earliest === undefined || edge.afterMs < earliest.afterMs;
    if (isDue && isEarlierThanBest) earliest = edge;
  }

  return earliest;
}

/** Edges out of `node`, in the order they were listed. */
function edgesLeaving(machine: Machine, node: string): Edge[] {
  return machine.edges.filter((edge) => edge.from === node);
}
