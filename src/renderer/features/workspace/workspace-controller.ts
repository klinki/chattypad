/**
 * Workspace controller: connects IPC calls to the workspace store.
 * Orchestrates workspace:load, thread:open, and message:send flows.
 */
import { workspaceStore } from "../../state/workspace-store.js";
import type { WorkspaceIpcClient } from "../../ipc/workspace-client.js";

export function createWorkspaceController(client: WorkspaceIpcClient) {
  let latestOpenRequestId = 0;
  let latestSendRequestId = 0;
  let intendedThreadId: string | null = null;

  async function openThread(threadId: string): Promise<void> {
    const requestId = ++latestOpenRequestId;
    intendedThreadId = threadId;
    workspaceStore.setLoading(true);
    const result = await client.openThread(threadId);

    if (requestId !== latestOpenRequestId || intendedThreadId !== threadId) {
      return;
    }

    if (result.success) {
      workspaceStore.setActiveThread(result.data);
    } else {
      workspaceStore.setError(result.error);
    }
  }

  async function loadWorkspace(): Promise<void> {
    workspaceStore.setLoading(true);
    const result = await client.loadWorkspace();
    if (result.success) {
      workspaceStore.setSnapshot(result.data);

      if (result.data.activeThreadId) {
        await openThread(result.data.activeThreadId);
      }
    } else {
      workspaceStore.setError(result.error);
    }
  }

  async function sendMessage(threadId: string, content: string): Promise<void> {
    const requestId = ++latestSendRequestId;
    const targetThreadId = threadId;
    workspaceStore.setSendError(null);
    const result = await client.sendMessage(threadId, content, "user");

    if (requestId !== latestSendRequestId || intendedThreadId !== targetThreadId) {
      return;
    }

    if (result.success) {
      workspaceStore.appendMessage(result.data);
    } else {
      workspaceStore.setSendError(result.error);
    }
  }

  return {
    loadWorkspace,
    openThread,
    sendMessage,
  };
}

export type WorkspaceController = ReturnType<typeof createWorkspaceController>;
