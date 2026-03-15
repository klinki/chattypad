import type {
  ActiveThreadDetail,
  IpcResult,
  ProjectCreateRequest,
  ProjectDeleteRequest,
  ProjectUpdateRequest,
  ProjectGroupCreateRequest,
  ProjectGroupDeleteRequest,
  ProjectGroupUpdateRequest,
  ProjectMoveToGroupRequest,
  ReorderRequest,
  ThreadCreateRequest,
  ThreadUpdateRequest,
  WorkspaceSnapshot,
} from "./workspace.js";
import { IPC_CHANNELS } from "./workspace.js";

export interface ThreadOpenRequest {
  threadId: string;
}

type EmptyRpcSection = Record<never, never>;

export interface MessageSendRequest {
  threadId: string;
  content: string;
  role: string;
}

export interface WorkspaceElectrobunRpcSchema {
  bun: {
    requests: {
      [IPC_CHANNELS.WORKSPACE_LOAD]: {
        params: undefined;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.PROJECT_CREATE]: {
        params: ProjectCreateRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.PROJECT_UPDATE]: {
        params: ProjectUpdateRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.PROJECT_DELETE]: {
        params: ProjectDeleteRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.PROJECT_GROUP_CREATE]: {
        params: ProjectGroupCreateRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.PROJECT_GROUP_UPDATE]: {
        params: ProjectGroupUpdateRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.PROJECT_GROUP_DELETE]: {
        params: ProjectGroupDeleteRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.PROJECT_MOVE_TO_GROUP]: {
        params: ProjectMoveToGroupRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.PROJECT_REORDER]: {
        params: ReorderRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.THREAD_CREATE]: {
        params: ThreadCreateRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.THREAD_UPDATE]: {
        params: ThreadUpdateRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.THREAD_REORDER]: {
        params: ReorderRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.THREAD_OPEN]: {
        params: ThreadOpenRequest;
        response: IpcResult<ActiveThreadDetail>;
      };
      [IPC_CHANNELS.MESSAGE_SEND]: {
        params: MessageSendRequest;
        response: IpcResult<ActiveThreadDetail>;
      };
    };
    messages: {
      [IPC_CHANNELS.WINDOW_MINIMIZE]: undefined;
      [IPC_CHANNELS.WINDOW_MAXIMIZE]: undefined;
      [IPC_CHANNELS.WINDOW_CLOSE]: undefined;
    };
  };
  webview: {
    requests: EmptyRpcSection;
    messages: EmptyRpcSection;
  };
}
