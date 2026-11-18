import { describe, expect, it } from "vitest";
import type { Machine } from "../../src/machine/types";
import { validateMachine } from "../../src/machine/validate";
import { standardStoplight } from "../../src/stoplight/config";

/** A two-node machine; `overrides` replaces any field. */
function machineWith(overrides: Partial<Machine>): Machine {
  return {
    initialNode: "a",
    nodes: ["a", "b"],
    edges: [
      { from: "a", to: "b", afterMs: 1 },
      { from: "b", to: "a", afterMs: 1 },
    ],
    ...overrides,
  };
}

describe("validateMachine", () => {
  it("finds no problems in the stoplight", () => {
    expect(validateMachine(standardStoplight.machine)).toEqual([]);
  });

  it.each([
    ["a missing initial node", machineWith({ initialNode: "nope" }), /Initial node "nope"/],
    ["a duplicate node", machineWith({ nodes: ["a", "a", "b"] }), /Duplicate node "a"/],
    ["an edge to an unknown node", machineWith({ edges: [{ from: "a", to: "zzz", afterMs: 1 }] }), /unknown "to"/],
    ["a zero-length edge", machineWith({ edges: [{ from: "a", to: "b", afterMs: 0 }] }), /above 0/],
  ])("reports %s", (_description, machine, expectedMessage) => {
    expect(validateMachine(machine).join("\n")).toMatch(expectedMessage);
  });
});
