// The shapes of a state graph: nodes (the colors) joined by timed edges (transitions).

/** Move from `from` to `to` once the machine has been in `from` for `afterMs`. */
export interface Edge {
  from: string;
  to: string;
  afterMs: number;
}

/** A complete machine definition. */
export interface Machine {
  initialNode: string;
  nodes: string[];
  /**
   * If several edges out of a node are due at once, the one whose deadline came first is
   * taken; on a tie, the first one listed.
   */
  edges: Edge[];
}

/** Where the machine is right now. */
export interface ExecutionState {
  node: string;
  /** Clock time the machine entered `node`. Edges out of it are timed from here. */
  enteredAt: number;
}

/** The clock was read, and it said `at`. */
export interface TimeObservedEvent {
  type: "TIME_OBSERVED";
  at: number;
}

/**
 * Everything the machine can be told. Each event carries `at`, the clock time it happened,
 * and a `type` that says what kind of event it is; each new kind is one more member here.
 */
export type MachineEvent = TimeObservedEvent;
