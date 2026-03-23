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

  test("preserves the newly created thread as active when a later snapshot defaults elsewhere", async () => {
    workspaceStore.setSnapshot({
      projectGroups: [],
      projects: [],
      threadsByProject: {
        p1: [{ id: "old-thread", projectId: "p1", title: "Old", sortOrder: 0, lastMessageAt: null }],
      },
      activeThreadId: "old-thread",
    });

    const controller = createWorkspaceController(
      createClient({
        createThread: async () => ({
          success: true,
          data: {
            projectGroups: [],
            projects: [],
            threadsByProject: {
              p1: [
                { id: "old-thread", projectId: "p1", title: "Old", sortOrder: 0, lastMessageAt: null },
                { id: "new-thread", projectId: "p1", title: "New", sortOrder: 1, lastMessageAt: null },
              ],
            },
            activeThreadId: "new-thread",
          },
        }),
        updateProject: async () => ({
          success: true,
          data: {
            projectGroups: [],
            projects: [],
            threadsByProject: {
              p1: [
                { id: "old-thread", projectId: "p1", title: "Old", sortOrder: 0, lastMessageAt: null },
                { id: "new-thread", projectId: "p1", title: "New", sortOrder: 1, lastMessageAt: null },
              ],
            },
            activeThreadId: "old-thread",
          },
        }),
        openThread: async (threadId) => ({
          success: true,
          data: {
            thread: {
              id: threadId,
              projectId: "p1",
              title: threadId === "new-thread" ? "New" : "Old",
              sortOrder: threadId === "new-thread" ? 1 : 0,
              lastMessageAt: null,
            },
            messages: [],
          },
        }),
      })
    );

    const createdThreadId = await controller.createThread("p1");
    const updateResult = await controller.updateProject("p1", undefined, true);
    const state = workspaceStore.getState();

    expect(createdThreadId).toBe("new-thread");
    expect(updateResult).toBe(true);
    expect(state.snapshot?.activeThreadId).toBe("new-thread");
    expect(state.activeThread?.thread.id).toBe("new-thread");
  });
});
