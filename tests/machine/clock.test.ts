import { describe, expect, it } from "vitest";
import { manualClock } from "../../src/machine/clock";

describe("manualClock", () => {
  it("runs callbacks in time order, with now() exact inside each", () => {
    const clock = manualClock();
    const log: string[] = [];
    clock.schedule(() => log.push(`b@${clock.now()}`), 300);
    clock.schedule(() => log.push(`a@${clock.now()}`), 100);
    clock.advance(1000);
    expect(log).toEqual(["a@100", "b@300"]);
    expect(clock.now()).toBe(1000);
  });

  it("runs callbacks scheduled during an advance if they fall inside it", () => {
    const clock = manualClock();
    const log: number[] = [];
    const scheduleAgain = () => {
      log.push(clock.now());
      clock.schedule(scheduleAgain, 100);
    };
    clock.schedule(scheduleAgain, 100);
    clock.advance(350);
    expect(log).toEqual([100, 200, 300]);
  });

  it("skips cancelled callbacks, and cancelling twice is fine", () => {
    const clock = manualClock();
    let ran = false;
    const cancel = clock.schedule(() => (ran = true), 10);
    cancel();
    cancel();
    clock.advance(100);
    expect(ran).toBe(false);
  });

  it("refuses to go backwards", () => {
    expect(() => manualClock().advance(-1)).toThrow();
  });
});
