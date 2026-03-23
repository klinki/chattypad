import { describe, expect, test } from "bun:test";
import {
  isProjectTreeCollapsed,
  isProjectTreeLocked,
} from "../../src/renderer/components/sidebar-tree-state.js";

describe("sidebar tree state", () => {
  test("forces locked encrypted projects to render collapsed", () => {
    expect(
      isProjectTreeLocked({
        isEncrypted: true,
        isLocked: true,
      })
    ).toBe(true);

    expect(
      isProjectTreeCollapsed({
        isEncrypted: true,
        isLocked: true,
        isCollapsed: false,
      })
    ).toBe(true);
  });

  test("preserves saved collapse state for unlocked or unencrypted projects", () => {
    expect(
      isProjectTreeCollapsed({
        isEncrypted: true,
        isLocked: false,
        isCollapsed: false,
      })
    ).toBe(false);

    expect(
      isProjectTreeCollapsed({
        isEncrypted: false,
        isLocked: false,
        isCollapsed: true,
      })
    ).toBe(true);
  });
});
