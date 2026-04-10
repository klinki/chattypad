/**
 * Renderer workspace state store.
 * Manages sidebar data, active thread selection, and message composition state.
 * Uses a simple event-emitter pattern for change notification (no external deps).
 */
import type {
  WorkspaceSnapshot,
  ActiveThreadDetail,
  IpcError,
  WorkspaceSearchResult,
} from "../../shared/contracts/workspace.js";

export interface WorkspaceState {
  snapshot: WorkspaceSnapshot | null;
  activeThread: ActiveThreadDetail | null;
  isLoading: boolean;
  error: IpcError | null;
  composeText: string;
  sendError: IpcError | null;
  unlockedKeys: Record<string, CryptoKey>;
  isSearchOpen: boolean;
  searchQuery: string;
  searchResults: WorkspaceSearchResult[];
  isSearchLoading: boolean;
  searchError: IpcError | null;
  selectedSearchResultId: string | null;
  revealedMessageId: string | null;
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
  isSearchOpen: false,
  searchQuery: "",
  searchResults: [],
  isSearchLoading: false,
  searchError: null,
  selectedSearchResultId: null,
  revealedMessageId: null,
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
  const threadExists = projectThreads.some((thread) => thread.id === detail.thread.id);
  const updatedThreads = threadExists
    ? projectThreads.map((thread) =>
        thread.id === detail.thread.id ? { ...thread, ...detail.thread } : thread
      )
    : [...projectThreads, detail.thread];

  return {
    ...state.snapshot,
    activeThreadId: detail.thread.id,
    threadsByProject: {
      ...state.snapshot.threadsByProject,
      [detail.thread.projectId]: updatedThreads,
    },
  };
}

function updateProjectLockState(projectId: string, isLocked: boolean): WorkspaceSnapshot | null {
  if (!state.snapshot) {
    return null;
  }

  return {
    ...state.snapshot,
    projects: state.snapshot.projects.map((project) =>
      project.id === projectId ? { ...project, isLocked } : project
    ),
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

  setActiveThread(
    detail: ActiveThreadDetail,
    options?: { revealedMessageId?: string | null }
  ): void {
    setState({
      activeThread: detail,
      snapshot: updateActiveThreadSummary(detail) ?? state.snapshot,
      sendError: null,
      error: null,
      isLoading: false,
      revealedMessageId: options?.revealedMessageId ?? null,
    });
  },

  setError(error: IpcError): void {
    setState({ error, isLoading: false });
  },

  clearError(): void {
    setState({ error: null });
  },

  setSendError(sendError: IpcError | null): void {
    setState({ sendError });
  },

  setComposeText(composeText: string): void {
    setState({ composeText });
  },

  openSearch(): void {
    setState({ isSearchOpen: true });
  },

  closeSearch(): void {
    setState({
      isSearchOpen: false,
      searchQuery: "",
      searchResults: [],
      isSearchLoading: false,
      searchError: null,
      selectedSearchResultId: null,
    });
  },

  setSearchQuery(searchQuery: string): void {
    setState({ searchQuery });
  },

  setSearchLoading(isSearchLoading: boolean): void {
    setState({ isSearchLoading });
  },

  setSearchError(searchError: IpcError | null): void {
    setState({ searchError, isSearchLoading: false });
  },

  setSearchResults(searchResults: WorkspaceSearchResult[]): void {
    setState({
      searchResults,
      isSearchLoading: false,
      searchError: null,
      selectedSearchResultId: searchResults[0]?.id ?? null,
    });
  },

  setSelectedSearchResultId(selectedSearchResultId: string | null): void {
    setState({ selectedSearchResultId });
  },

  setRevealedMessageId(revealedMessageId: string | null): void {
    setState({ revealedMessageId });
  },

  appendMessage(detail: ActiveThreadDetail): void {
    setState({
      activeThread: detail,
      snapshot: updateActiveThreadSummary(detail) ?? state.snapshot,
      composeText: "",
      sendError: null,
      revealedMessageId: null,
    });
  },

  setUnlockedKey(projectId: string, key: CryptoKey): void {
    setState({
      snapshot: updateProjectLockState(projectId, false) ?? state.snapshot,
      unlockedKeys: { ...state.unlockedKeys, [projectId]: key },
    });
  },

  lockProject(projectId: string): void {
    const { [projectId]: _, ...remainingKeys } = state.unlockedKeys;
    setState({
      snapshot: updateProjectLockState(projectId, true) ?? state.snapshot,
      unlockedKeys: remainingKeys,
      // If the active thread is in this project, clear it
      activeThread: state.activeThread?.thread.projectId === projectId ? null : state.activeThread,
    });
  },

  lockAllProjects(): void {
    setState({
      snapshot: state.snapshot
        ? {
            ...state.snapshot,
            projects: state.snapshot.projects.map((project) =>
              project.isEncrypted ? { ...project, isLocked: true } : project
            ),
          }
        : null,
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
