import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "../src/App";
import { manualClock } from "../src/machine/clock";

afterEach(cleanup); // unmount between tests so each starts with a clean page

describe("App", () => {
  it("runs green 5s → yellow 1s → red 2s → green, forever", () => {
    const clock = manualClock();
    render(<App clock={clock} />);

    const advance = (ms: number) => act(() => clock.advance(ms));
    const litLamps = () =>
      ["Red", "Yellow", "Green"].filter(
        (label) => screen.getByLabelText(new RegExp(`^${label} lamp`)).dataset.lit === "true",
      );

    expect(litLamps()).toEqual(["Green"]);
    advance(4999);
    expect(litLamps()).toEqual(["Green"]);
    advance(1);
    expect(litLamps()).toEqual(["Yellow"]);
    advance(1000);
    expect(litLamps()).toEqual(["Red"]);
    advance(2000);
    expect(litLamps()).toEqual(["Green"]);
    advance(8000 * 3); // three more full cycles
    expect(litLamps()).toEqual(["Green"]);
  });
});
