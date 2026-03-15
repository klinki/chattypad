/**
 * IPC contracts for the workspace feature.
 * Matches the Workspace IPC Contract specification in
 * specs/001-desktop-chat-app/contracts/workspace-ipc-contract.md
 */

export interface ProjectSummary {
  id: string;
  name: string;
  sortOrder: number;
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
  projects: ProjectSummary[];
  threadsByProject: Record<string, ThreadSummary[]>;
  activeThreadId: string | null;
}

export interface ActiveThreadDetail {
  thread: ThreadSummary;
  messages: MessageView[];
}

export interface ProjectCreateRequest {
  name: string;
}

export interface ProjectDeleteRequest {
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
  THREAD_OPEN: "thread:open",
  MESSAGE_SEND: "message:send",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
