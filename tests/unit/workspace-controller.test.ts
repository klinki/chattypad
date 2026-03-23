import { beforeEach, describe, expect, test } from "bun:test";
import type { WorkspaceIpcClient } from "../../src/renderer/ipc/workspace-client.js";
import { createWorkspaceController } from "../../src/renderer/features/workspace/workspace-controller.js";
import { workspaceStore } from "../../src/renderer/state/workspace-store.js";

function createClient(overrides: Partial<WorkspaceIpcClient>): WorkspaceIpcClient {
  return {
    loadWorkspace: async () => ({
      success: true,
      data: {
        projectGroups: [],
        projects: [],
        threadsByProject: {},
        activeThreadId: null,
      },
    }),
    createProject: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    unlockProject: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    lockProject: async () => ({ success: true, data: undefined }),
    lockAllProjects: async () => ({ success: true, data: undefined }),
    deleteProject: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    updateProject: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    createThread: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    updateThread: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    moveProjectToGroup: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    reorderProject: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    reorderThread: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    openThread: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    sendMessage: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    getWindowFrame: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    setWindowFrame: async () => ({ success: false, error: { code: "UNUSED", message: "unused", recoverable: true } }),
    minimizeWindow: () => {},
    maximizeWindow: () => {},
    closeWindow: () => {},
    ...overrides,
  };
}

describe("workspace controller unlock flow", () => {
  beforeEach(() => {
    workspaceStore.reset();
  });

  test("keeps recoverable unlock errors out of the global workspace error state", async () => {
    const controller = createWorkspaceController(
      createClient({
        unlockProject: async () => ({
          success: false,
          error: {
            code: "INVALID_PASSWORD",
            message: "Incorrect password.",
            recoverable: true,
          },
        }),
      })
    );

    const error = await controller.unlockProject("p1", "bad-password");

    expect(error?.code).toBe("INVALID_PASSWORD");
    expect(workspaceStore.getState().error).toBeNull();
    expect(workspaceStore.getState().isLoading).toBe(false);
  });
});
