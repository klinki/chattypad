import type {
  ActiveThreadDetail,
  IpcResult,
  ProjectCreateRequest,
  ProjectDeleteRequest,
  ThreadCreateRequest,
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
      [IPC_CHANNELS.PROJECT_DELETE]: {
        params: ProjectDeleteRequest;
        response: IpcResult<WorkspaceSnapshot>;
      };
      [IPC_CHANNELS.THREAD_CREATE]: {
        params: ThreadCreateRequest;
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
    messages: EmptyRpcSection;
  };
  webview: {
    requests: EmptyRpcSection;
    messages: EmptyRpcSection;
  };
}
