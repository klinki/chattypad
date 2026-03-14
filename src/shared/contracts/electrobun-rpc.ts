import type {
  ActiveThreadDetail,
  IpcResult,
  WorkspaceSnapshot,
} from "./workspace.js";
import { IPC_CHANNELS } from "./workspace.js";

export interface ThreadOpenRequest {
  threadId: string;
}

export interface MessageSendRequest {
  threadId: string;
  content: string;
  role: string;
}

type EmptyRpcSection = Record<never, never>;

export interface WorkspaceElectrobunRpcSchema {
  bun: {
    requests: {
      [IPC_CHANNELS.WORKSPACE_LOAD]: {
        params: undefined;
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
