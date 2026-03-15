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

  async function applySnapshot(snapshot: Parameters<typeof workspaceStore.setSnapshot>[0]): Promise<void> {
    intendedThreadId = snapshot.activeThreadId;
    workspaceStore.setSnapshot(snapshot);

    if (snapshot.activeThreadId) {
      await openThread(snapshot.activeThreadId);
    }
  }

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
      await applySnapshot(result.data);
    } else {
      workspaceStore.setError(result.error);
    }
  }

  async function createProject(name: string): Promise<string | null> {
    const currentProjects = new Set(workspaceStore.getState().snapshot?.projects.map(p => p.id) ?? []);
    workspaceStore.setLoading(true);
    const result = await client.createProject(name);
    if (result.success) {
      await applySnapshot(result.data);
      const newProject = result.data.projects.find(p => !currentProjects.has(p.id));
      return newProject?.id ?? null;
    }

    workspaceStore.setError(result.error);
    return null;
  }

  async function deleteProject(projectId: string): Promise<boolean> {
    workspaceStore.setLoading(true);
    const result = await client.deleteProject(projectId);
    if (result.success) {
      await applySnapshot(result.data);
      return true;
    }

    workspaceStore.setError(result.error);
    return false;
  }

  async function createThread(projectId: string): Promise<string | null> {
    const currentThreads = new Set((workspaceStore.getState().snapshot?.threadsByProject[projectId] ?? []).map(t => t.id));
    workspaceStore.setLoading(true);
    const result = await client.createThread(projectId);
    if (result.success) {
      await applySnapshot(result.data);
      const newThread = (result.data.threadsByProject[projectId] ?? []).find(t => !currentThreads.has(t.id));
      return newThread?.id ?? null;
    }

    workspaceStore.setError(result.error);
    return null;
  }

  async function updateProject(projectId: string, name?: string, isCollapsed?: boolean): Promise<boolean> {
    workspaceStore.setLoading(true);
    const result = await client.updateProject(projectId, name, isCollapsed);
    if (result.success) {
      await applySnapshot(result.data);
      return true;
    }

    workspaceStore.setError(result.error);
    return false;
  }

  async function updateThread(threadId: string, title: string): Promise<boolean> {
    workspaceStore.setLoading(true);
    const result = await client.updateThread(threadId, title);
    if (result.success) {
      await applySnapshot(result.data);
      return true;
    }

    workspaceStore.setError(result.error);
    return false;
  }

  async function moveProjectToGroup(projectId: string, groupId: string | null): Promise<boolean> {
    workspaceStore.setLoading(true);
    const result = await client.moveProjectToGroup(projectId, groupId);
    if (result.success) {
      await applySnapshot(result.data);
      return true;
    }
    workspaceStore.setError(result.error);
    return false;
  }

  async function reorderProject(projectId: string, targetSortOrder: number): Promise<boolean> {
    workspaceStore.setLoading(true);
    const result = await client.reorderProject(projectId, targetSortOrder);
    if (result.success) {
      await applySnapshot(result.data);
      return true;
    }
    workspaceStore.setError(result.error);
    return false;
  }

  async function reorderThread(threadId: string, targetSortOrder: number): Promise<boolean> {
    workspaceStore.setLoading(true);
    const result = await client.reorderThread(threadId, targetSortOrder);
    if (result.success) {
      await applySnapshot(result.data);
      return true;
    }
    workspaceStore.setError(result.error);
    return false;
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
    createProject,
    deleteProject,
    updateProject,
    moveProjectToGroup,
    reorderProject,
    createThread,
    updateThread,
    reorderThread,
    openThread,
    sendMessage,
  };
}

export type WorkspaceController = ReturnType<typeof createWorkspaceController>;
