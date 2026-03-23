/**
 * Workspace controller: connects IPC calls to the workspace store.
 * Orchestrates workspace:load, thread:open, and message:send flows.
 */
import { workspaceStore } from "../../state/workspace-store.js";
import type { WorkspaceIpcClient } from "../../ipc/workspace-client.js";
import type { IpcError } from "../../../shared/contracts/workspace.js";

export function createWorkspaceController(client: WorkspaceIpcClient) {
  let latestOpenRequestId = 0;
  let latestSendRequestId = 0;
  let intendedThreadId: string | null = null;

  function snapshotHasThread(
    snapshot: Parameters<typeof workspaceStore.setSnapshot>[0],
    threadId: string | null
  ): threadId is string {
    if (!threadId) {
      return false;
    }

    return Object.values(snapshot.threadsByProject).some((threads) =>
      threads.some((thread) => thread.id === threadId)
    );
  }

  function resolveActiveThreadId(
    snapshot: Parameters<typeof workspaceStore.setSnapshot>[0]
  ): string | null {
    if (snapshotHasThread(snapshot, intendedThreadId)) {
      return intendedThreadId;
    }

    if (snapshotHasThread(snapshot, snapshot.activeThreadId)) {
      return snapshot.activeThreadId;
    }

    return null;
  }

  async function applySnapshot(snapshot: Parameters<typeof workspaceStore.setSnapshot>[0]): Promise<void> {
    const activeThreadId = resolveActiveThreadId(snapshot);
    intendedThreadId = activeThreadId;
    workspaceStore.setSnapshot({
      ...snapshot,
      activeThreadId,
    });

    if (activeThreadId) {
      await openThread(activeThreadId);
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

  async function createProject(name: string, isEncrypted?: boolean, password?: string): Promise<string | null> {
    const currentProjects = new Set(workspaceStore.getState().snapshot?.projects.map(p => p.id) ?? []);
    workspaceStore.setLoading(true);
    const result = await client.createProject(name, isEncrypted, password);
    if (result.success) {
      const newProject = result.data.projects.find(p => !currentProjects.has(p.id));
      
      // If encrypted, derive key in renderer too so subsequent actions (like auto-thread creation) work
      if (isEncrypted && password && newProject?.encryptionSalt) {
        try {
          const { CryptoService } = await import("../../../shared/crypto/crypto-service.js");
          const salt = CryptoService.base64ToUint8Array(newProject.encryptionSalt);
          const key = await CryptoService.deriveKey(password, salt);
          workspaceStore.setUnlockedKey(newProject.id, key);
        } catch (err) {
          console.error("[controller] Failed to derive key for new project:", err);
        }
      }

      await applySnapshot(result.data);
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
    workspaceStore.setLoading(true);
    const result = await client.createThread(projectId);
    if (result.success) {
      intendedThreadId = result.data.activeThreadId;
      await applySnapshot(result.data);
      return result.data.activeThreadId;
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

  async function unlockProject(projectId: string, password: string): Promise<IpcError | null> {
    const startTime = performance.now();
    workspaceStore.clearError();
    workspaceStore.setLoading(true);
    const result = await client.unlockProject(projectId, password);
    if (result.success) {
      const state = workspaceStore.getState();
      const project = state.snapshot?.projects.find(p => p.id === projectId);
      
      if (project?.encryptionSalt) {
        try {
          const { CryptoService } = await import("../../../shared/crypto/crypto-service.js");
          const salt = CryptoService.base64ToUint8Array(project.encryptionSalt);
          const key = await CryptoService.deriveKey(password, salt);
          workspaceStore.setUnlockedKey(projectId, key);
        } catch (err) {
          console.error("[controller] Failed to derive key after unlock:", err);
        }
      }

      const workspaceResult = await client.loadWorkspace();
      if (workspaceResult.success) {
        await applySnapshot(workspaceResult.data);
      } else {
        workspaceStore.setError(workspaceResult.error);
        return workspaceResult.error;
      }

      const endTime = performance.now();
      console.log(`[performance] Project unlock took ${(endTime - startTime).toFixed(2)}ms`);
      return null;
    }

    if (result.error.recoverable) {
      workspaceStore.setLoading(false);
      return result.error;
    }

    workspaceStore.setError(result.error);
    return result.error;
  }

  async function lockProject(projectId: string): Promise<void> {
    await client.lockProject(projectId);
    workspaceStore.lockProject(projectId);
  }

  async function lockAllProjects(): Promise<void> {
    await client.lockAllProjects();
    workspaceStore.lockAllProjects();
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
    unlockProject,
    lockProject,
    lockAllProjects,
    sendMessage,
  };
}

export type WorkspaceController = ReturnType<typeof createWorkspaceController>;
