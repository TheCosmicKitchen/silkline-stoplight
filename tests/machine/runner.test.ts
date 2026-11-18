import { describe, expect, it } from "vitest";
import { manualClock } from "../../src/machine/clock";
import { createRunner, TICK_MS } from "../../src/machine/runner";
import type { Machine } from "../../src/machine/types";
import { standardStoplight } from "../../src/stoplight/config";

const machine = standardStoplight.machine; // green 5s → yellow 1s → red 2s

describe("createRunner", () => {
  it("ticks itself through the cycle", () => {
    const clock = manualClock();
    const runner = createRunner(machine, clock);
    runner.start();

    const nodesSeen: string[] = [];
    runner.subscribe((state) => nodesSeen.push(`${state.node}@${state.enteredAt}`));
    clock.advance(8000);

    expect(nodesSeen).toEqual(["yellow@5000", "red@6000", "green@8000"]);
  });

  it("notices a deadline that falls between ticks at the next tick, keeping its exact time", () => {
    const offBeat: Machine = { initialNode: "a", nodes: ["a", "b"], edges: [{ from: "a", to: "b", afterMs: 1030 }] };
    const clock = manualClock();
    const runner = createRunner(offBeat, clock);
    runner.start();

    clock.advance(1030);
    expect(runner.state.node).toBe("a"); // the deadline has passed, but the last tick was at 1000

    clock.advance(TICK_MS - 30); // the next tick, at 1050
    expect(runner.state).toEqual({ node: "b", enteredAt: 1030 });
  });

  it("stops ticking when stopped", () => {
    const clock = manualClock();
    const runner = createRunner(machine, clock);
    runner.start();
    runner.stop();
    clock.advance(100_000);
    expect(runner.state.node).toBe("green");
  });

  it("notifies subscribers only when the state changes", () => {
    const clock = manualClock();
    const runner = createRunner(machine, clock);
    let calls = 0;
    runner.subscribe(() => calls++);
    runner.start(); // nothing due yet
    expect(calls).toBe(0);
    clock.advance(5000);
    expect(calls).toBe(1);
  });
});
