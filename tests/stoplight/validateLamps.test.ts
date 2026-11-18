import { describe, expect, it } from "vitest";
import { standardStoplight } from "../../src/stoplight/config";
import { validateLamps } from "../../src/stoplight/validateLamps";

describe("validateLamps", () => {
  it("finds no problems in the stoplight", () => {
    expect(validateLamps(standardStoplight)).toEqual([]);
  });

  it("reports a lamp that doesn't exist and a node missing from litLampsByNode", () => {
    const problems = validateLamps({
      ...standardStoplight,
      litLampsByNode: { green: ["green"], yellow: ["amber"] },
    });
    expect(problems).toEqual(['Node "yellow" lights unknown lamp "amber"', 'Node "red" has no entry in litLampsByNode']);
  });
});
