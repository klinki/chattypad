import { describe, expect, test } from "bun:test";
import { computeResizedWindowFrame } from "../../src/renderer/components/window-resize-utils.js";

describe("computeResizedWindowFrame", () => {
  test("grows east and south edges", () => {
    const result = computeResizedWindowFrame(
      { x: 100, y: 100, width: 1200, height: 800 },
      "se",
      50,
      25
    );

    expect(result).toEqual({ x: 100, y: 100, width: 1250, height: 825 });
  });

  test("moves origin when resizing from the west edge", () => {
    const result = computeResizedWindowFrame(
      { x: 100, y: 100, width: 1200, height: 800 },
      "w",
      40,
      0
    );

    expect(result).toEqual({ x: 140, y: 100, width: 1160, height: 800 });
  });

  test("respects minimum dimensions on north-west resize", () => {
    const result = computeResizedWindowFrame(
      { x: 100, y: 100, width: 800, height: 600 },
      "nw",
      500,
      300
    );

    expect(result).toEqual({ x: 180, y: 180, width: 720, height: 520 });
  });
});
