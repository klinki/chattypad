/**
 * Renderer workspace state store.
 * Manages sidebar data, active thread selection, and message composition state.
 * Uses a simple event-emitter pattern for change notification (no external deps).
 */
import type {
  WorkspaceSnapshot,
  ActiveThreadDetail,
  IpcError,
} from "../../shared/contracts/workspace.js";

export interface WorkspaceState {
  snapshot: WorkspaceSnapshot | null;
  activeThread: ActiveThreadDetail | null;
  isLoading: boolean;
  error: IpcError | null;
  composeText: string;
  sendError: IpcError | null;
  unlockedKeys: Record<string, CryptoKey>;
}

type Listener = (state: WorkspaceState) => void;

const initialState: WorkspaceState = {
  snapshot: null,
  activeThread: null,
  isLoading: false,
  error: null,
  composeText: "",
  sendError: null,
  unlockedKeys: {},
};

let state: WorkspaceState = { ...initialState };
const listeners = new Set<Listener>();

function setState(patch: Partial<WorkspaceState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) {
    listener(state);
  }
}

function updateActiveThreadSummary(detail: ActiveThreadDetail): WorkspaceSnapshot | null {
  if (!state.snapshot) {
    return null;
  }

  const projectThreads = state.snapshot.threadsByProject[detail.thread.projectId] ?? [];
  const updatedThreads = projectThreads.map((thread) =>
    thread.id === detail.thread.id
      ? { ...thread, lastMessageAt: detail.thread.lastMessageAt }
      : thread
  );

  return {
    ...state.snapshot,
    activeThreadId: detail.thread.id,
    threadsByProject: {
      ...state.snapshot.threadsByProject,
      [detail.thread.projectId]: updatedThreads,
    },
  };
}

export const workspaceStore = {
  getState(): WorkspaceState {
    return state;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setLoading(isLoading: boolean): void {
    setState({ isLoading });
  },

  setSnapshot(snapshot: WorkspaceSnapshot): void {
    setState({
      snapshot,
      activeThread: null,
      composeText: "",
      sendError: null,
      error: null,
      isLoading: false,
    });
  },

  setActiveThread(detail: ActiveThreadDetail): void {
    setState({
      activeThread: detail,
      snapshot: updateActiveThreadSummary(detail) ?? state.snapshot,
      sendError: null,
      error: null,
      isLoading: false,
    });
  },

  setError(error: IpcError): void {
    setState({ error, isLoading: false });
  },

  setSendError(sendError: IpcError | null): void {
    setState({ sendError });
  },

  setComposeText(composeText: string): void {
    setState({ composeText });
  },

  appendMessage(detail: ActiveThreadDetail): void {
    setState({
      activeThread: detail,
      snapshot: updateActiveThreadSummary(detail) ?? state.snapshot,
      composeText: "",
      sendError: null,
    });
  },

  setUnlockedKey(projectId: string, key: CryptoKey): void {
    setState({
      unlockedKeys: { ...state.unlockedKeys, [projectId]: key },
    });
  },

  lockProject(projectId: string): void {
    const { [projectId]: _, ...remainingKeys } = state.unlockedKeys;
    setState({
      unlockedKeys: remainingKeys,
      // If the active thread is in this project, clear it
      activeThread: state.activeThread?.thread.projectId === projectId ? null : state.activeThread,
    });
  },

  lockAllProjects(): void {
    setState({
      unlockedKeys: {},
      activeThread: null,
    });
  },

  reset(): void {
    state = { ...initialState };
    for (const listener of listeners) {
      listener(state);
    }
  },
};
