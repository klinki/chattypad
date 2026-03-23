import { describe, expect, test } from "bun:test";
import { getWorkspaceShellRenderMode } from "../../src/renderer/components/workspace-shell-state.js";

describe("workspace shell state", () => {
  test("shows a full-screen loading state before the first snapshot arrives", () => {
    expect(
      getWorkspaceShellRenderMode({
        isLoading: true,
        error: null,
        hasSnapshot: false,
      })
    ).toBe("loading");
  });

  test("keeps the sidebar shell when a recoverable error happens after load", () => {
    expect(
      getWorkspaceShellRenderMode({
        isLoading: false,
        error: {
          code: "PROJECT_LOCKED",
          message: "The project is locked. Please unlock it to access its contents.",
          recoverable: true,
        },
        hasSnapshot: true,
      })
    ).toBe("shell-with-main-error");
  });

  test("uses a full-screen error only when no snapshot is available", () => {
    expect(
      getWorkspaceShellRenderMode({
        isLoading: false,
        error: {
          code: "WORKSPACE_LOAD_FAILED",
          message: "Workspace data is currently unavailable.",
          recoverable: true,
        },
        hasSnapshot: false,
      })
    ).toBe("full-error");
  });
});
