import type { StoplightConfig } from "./types";

/** The behavior from the brief, as data: green 5s → yellow 1s → red 2s → repeat. */
export const standardStoplight: StoplightConfig = {
  lamps: [
    { id: "red", label: "Red", color: "#e5322d" },
    { id: "yellow", label: "Yellow", color: "#f5c400" },
    { id: "green", label: "Green", color: "#1fbf5a" },
  ],
  machine: {
    initialNode: "green",
    nodes: ["green", "yellow", "red"],
    edges: [
      { from: "green", to: "yellow", afterMs: 5000 },
      { from: "yellow", to: "red", afterMs: 1000 },
      { from: "red", to: "green", afterMs: 2000 },
    ],
  },
  litLampsByNode: {
    green: ["green"],
    yellow: ["yellow"],
    red: ["red"],
  },
};
