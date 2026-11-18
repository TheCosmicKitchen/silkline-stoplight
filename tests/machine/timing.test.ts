import { describe, expect, it } from "vitest";
import { initialState, receive } from "../../src/machine/timing";
import type { Machine, MachineEvent } from "../../src/machine/types";
import { standardStoplight } from "../../src/stoplight/config";

const machine = standardStoplight.machine; // green 5s → yellow 1s → red 2s
const greenAtZero = initialState(machine, 0);

/** An event saying the clock read `at`. */
const timeAt = (at: number): MachineEvent => ({ type: "TIME_OBSERVED", at });

describe("receive", () => {
  it("does nothing before a deadline, and returns the very same state", () => {
    expect(receive(machine, greenAtZero, timeAt(4999))).toBe(greenAtZero);
  });

  it("moves at exactly the deadline, entering at the deadline", () => {
    expect(receive(machine, greenAtZero, timeAt(5000))).toEqual({ node: "yellow", enteredAt: 5000 });
  });

  it("enters at the deadline even when the event is late, so lateness doesn't add up", () => {
    expect(receive(machine, greenAtZero, timeAt(5003)).enteredAt).toBe(5000);
  });

  it("catches up through several nodes in one event after a long gap", () => {
    // 0 green, 5 yellow, 6 red, 8 green, 13 yellow, 14 red, 16 green
    expect(receive(machine, greenAtZero, timeAt(20_000))).toEqual({ node: "green", enteredAt: 16_000 });
  });

  it("catches up exactly after a whole day asleep", () => {
    const oneDay = 24 * 60 * 60 * 1000; // 10,800 full 8s cycles
    expect(receive(machine, greenAtZero, timeAt(oneDay))).toEqual({ node: "green", enteredAt: oneDay });
  });

  it("returns the same state for a second event at the same time", () => {
    const yellow = receive(machine, greenAtZero, timeAt(5000));
    expect(receive(machine, yellow, timeAt(5000))).toBe(yellow);
  });
});

describe("receive with several edges out of one node", () => {
  /** Node "a" has two edges out with the given delays, listed in that order. */
  function branching(firstMs: number, secondMs: number): Machine {
    return {
      initialNode: "a",
      nodes: ["a", "first", "second"],
      edges: [
        { from: "a", to: "first", afterMs: firstMs },
        { from: "a", to: "second", afterMs: secondMs },
      ],
    };
  }

  it("takes the edge whose deadline came first, even when it's listed second", () => {
    const machine = branching(10_000, 5_000);
    // Both are due by 12s; on time, the 5s edge would have fired first.
    expect(receive(machine, initialState(machine, 0), timeAt(12_000))).toEqual({ node: "second", enteredAt: 5_000 });
  });

  it("takes the first one listed when two deadlines tie", () => {
    const machine = branching(5_000, 5_000);
    expect(receive(machine, initialState(machine, 0), timeAt(5_000))).toEqual({ node: "first", enteredAt: 5_000 });
  });
});
