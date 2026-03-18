/**
 * IPC contracts for the workspace feature.
 * Matches the Workspace IPC Contract specification in
 * specs/001-desktop-chat-app/contracts/workspace-ipc-contract.md
 */

export interface ProjectGroupSummary {
  id: string;
  name: string;
  sortOrder: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  sortOrder: number;
  groupId: string | null;
  isCollapsed: boolean;
  isEncrypted: boolean;
  isLocked: boolean;
}

export interface ThreadSummary {
  id: string;
  projectId: string;
  title: string;
  sortOrder: number;
  lastMessageAt: string | null;
}

export interface MessageView {
  id: string;
  threadId: string;
  role: string;
  content: string;
  createdAt: string;
  sequenceNumber: number;
}

export interface WorkspaceSnapshot {
  projectGroups: ProjectGroupSummary[];
  projects: ProjectSummary[];
  threadsByProject: Record<string, ThreadSummary[]>;
  activeThreadId: string | null;
}

export interface ActiveThreadDetail {
  thread: ThreadSummary;
  messages: MessageView[];
}

export interface WindowFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowFrameUpdateRequest extends WindowFrame {}

export interface ProjectCreateRequest {
  name: string;
  isEncrypted?: boolean;
  password?: string;
}

export interface ProjectUnlockRequest {
  projectId: string;
  password: string;
}

export interface ProjectLockRequest {
  projectId: string;
}

export interface ProjectUpdateRequest {
  projectId: string;
  name?: string;
  isCollapsed?: boolean;
}

export interface ProjectGroupCreateRequest {
  name: string;
}

export interface ProjectGroupDeleteRequest {
  groupId: string;
}

export interface ProjectGroupUpdateRequest {
  groupId: string;
  name: string;
}

export interface ProjectMoveToGroupRequest {
  projectId: string;
  groupId: string | null;
}

export interface ReorderRequest {
  itemId: string;
  targetSortOrder: number;
}

export interface ThreadUpdateRequest {
  threadId: string;
  title: string;
}

export interface ProjectDeleteRequest {
  projectId: string;
}

export interface ThreadCreateRequest {
  projectId: string;
}

export interface IpcError {
  code: string;
  message: string;
  recoverable: boolean;
}

export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: IpcError };

/** IPC channel names */
export const IPC_CHANNELS = {
  WORKSPACE_LOAD: "workspace:load",
  PROJECT_CREATE: "project:create",
  PROJECT_DELETE: "project:delete",
  PROJECT_UPDATE: "project:update",
  PROJECT_GROUP_CREATE: "project-group:create",
  PROJECT_GROUP_DELETE: "project-group:delete",
  PROJECT_GROUP_UPDATE: "project-group:update",
  PROJECT_MOVE_TO_GROUP: "project:move-to-group",
  PROJECT_REORDER: "project:reorder",
  THREAD_CREATE: "thread:create",
  THREAD_UPDATE: "thread:update",
  THREAD_REORDER: "thread:reorder",
  THREAD_OPEN: "thread:open",
  MESSAGE_SEND: "message:send",
  PROJECT_UNLOCK: "project:unlock",
  PROJECT_LOCK: "project:lock",
  PROJECT_LOCK_ALL: "project:lock-all",
  WINDOW_GET_FRAME: "window:get-frame",
  WINDOW_SET_FRAME: "window:set-frame",
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAXIMIZE: "window:maximize",
  WINDOW_CLOSE: "window:close",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
