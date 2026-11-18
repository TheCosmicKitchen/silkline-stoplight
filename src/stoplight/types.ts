import type { Machine } from "../machine/types";

/** One lamp in the housing, e.g. the red one. */
export interface LampConfig {
  /** Unique key that `litLampsByNode` uses to refer to this lamp. */
  id: string;
  /** Text shown on the lamp. */
  label: string;
  /** Any CSS color. */
  color: string;
}

/** Everything that defines a stoplight: its lamps, its state graph, and which lamps each node lights. */
export interface StoplightConfig {
  /** Lamps in top-to-bottom order. */
  lamps: LampConfig[];
  machine: Machine;
  /**
   * For each node of the graph, the ids of the lamps that are lit.
   * The graph says where we are; this says how it looks.
   */
  litLampsByNode: Record<string, string[]>;
}
