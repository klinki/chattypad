/**
 * Main workspace screen: composes all workspace UI components.
 * Connects the store, controller, sidebar, thread view, and message composer.
 */
import React, { useEffect, useState, useCallback } from "react";
import { workspaceStore } from "../../state/workspace-store.js";
import { createWorkspaceController } from "./workspace-controller.js";
import { workspaceIpcClient } from "../../ipc/workspace-client.js";
import { settingsIpcClient } from "../../ipc/settings.js";
import { Sidebar } from "../../components/sidebar.js";
import type { ProjectSummary, ThreadSummary } from "../../../shared/contracts/workspace.js";
import {
  WorkspaceShell,
  EmptyState,
  WorkspaceEmptyState,
} from "../../components/workspace-shell.js";
import { ThreadHeader } from "../../components/thread-header.js";
import { MessageHistory } from "../../components/message-history.js";
import { Header } from "../../components/header.js";
import { MessageComposer } from "../../components/message-composer.js";
import { LockScreen } from "../../components/lock-screen.js";
import { SettingsDialog } from "../../components/settings-dialog.js";
import { WindowResizeHandles } from "../../components/window-resize-handles.js";
import type { WorkspaceState } from "../../state/workspace-store.js";

const controller = createWorkspaceController(workspaceIpcClient);

declare global {
  interface Window {
    __CHATTYPAD_WINDOW_MODE__?: "native" | "frameless";
  }
}

function getDefaultWindowMode(): "native" | "frameless" {
  if (typeof navigator === "undefined") {
    return "frameless";
  }

  return navigator.platform.toLowerCase().startsWith("win") ? "native" : "frameless";
}

function getWindowMode(): "native" | "frameless" {
  if (typeof window === "undefined") {
    return "frameless";
  }

  return window.__CHATTYPAD_WINDOW_MODE__ ?? getDefaultWindowMode();
}

type ProjectDialogState =
  | { mode: "closed" }
  | { mode: "create-encrypted" }
  | { mode: "delete"; project: ProjectSummary };

type UnlockDialogState =
  | { mode: "closed" }
  | { mode: "open"; project: ProjectSummary };

export function WorkspaceScreen(): React.ReactElement {
  const [state, setState] = useState<WorkspaceState>(workspaceStore.getState());
  const [windowMode, setWindowMode] = useState<"native" | "frameless">(getWindowMode());
  const [projectDialog, setProjectDialog] = useState<ProjectDialogState>({
    mode: "closed",
  });
  const [projectName, setProjectName] = useState("");
  const [password, setPassword] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSettingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [workflowProjectId, setWorkflowProjectId] = useState<string | null>(null);
  const [workflowThreadId, setWorkflowThreadId] = useState<string | null>(null);
  const [composerFocusKey, setComposerFocusKey] = useState(0);
  const [unlockDialog, setUnlockDialog] = useState<UnlockDialogState>({ mode: "closed" });
  const [unlockError, setUnlockError] = useState<{ projectId: string; message: string } | null>(null);

  useEffect(() => {
    const unsub = workspaceStore.subscribe(setState);
    controller.loadWorkspace();
    void settingsIpcClient.getSettings();
    return unsub;
  }, []);

  useEffect(() => {
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    let timeoutId: Timer;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const hasUnlockedProjects = Object.keys(workspaceStore.getState().unlockedKeys).length > 0;
        if (hasUnlockedProjects) {
          console.log("[inactivity] 5 minutes passed, locking all projects");
          controller.lockAllProjects();
        }
      }, INACTIVITY_TIMEOUT);
    };

    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncWindowMode = (event?: Event) => {
      const nextMode =
        event instanceof CustomEvent && (event.detail === "native" || event.detail === "frameless")
          ? event.detail
          : getWindowMode();
      setWindowMode(nextMode);
    };

    window.addEventListener("chattypad-window-mode", syncWindowMode);
    syncWindowMode();

    return () => {
      window.removeEventListener("chattypad-window-mode", syncWindowMode);
    };
  }, []);

  const handleSelectThread = useCallback((threadId: string) => {
    controller.openThread(threadId);
  }, []);

  const handleSend = useCallback(() => {
    const activeId = state.activeThread?.thread.id;
    if (!activeId) {
      return;
    }
    controller.sendMessage(activeId, state.composeText);
  }, [state.activeThread, state.composeText]);

  const handleSetEditingItemId = useCallback((id: string | null) => {
    if (id === null) {
      if (editingItemId === workflowProjectId) {
        setWorkflowProjectId(null);
      }
      if (editingItemId === workflowThreadId) {
        setWorkflowThreadId(null);
      }
    }

    setEditingItemId(id);
  }, [editingItemId, workflowProjectId, workflowThreadId]);

  const handleCreateProject = useCallback(async () => {
    const newProjectId = await controller.createProject("New Project", false, undefined, {
      activeThreadId: null,
      openActiveThread: false,
    });
    if (newProjectId) {
      setWorkflowProjectId(newProjectId);
      setWorkflowThreadId(null);
      setEditingItemId(newProjectId);
    }
  }, []);

  const handleCreateEncryptedProject = useCallback(() => {
    setTimeout(() => {
      setProjectDialog({ mode: "create-encrypted" });
      setProjectName("");
      setPassword("");
    }, 0);
  }, []);

  const handleUpdateProject = useCallback((id: string, name?: string, isCollapsed?: boolean) => {
    controller.updateProject(id, name, isCollapsed);
  }, []);

  const handleCommitProjectName = useCallback(async (
    project: ProjectSummary,
    name: string,
    source: "enter" | "blur"
  ): Promise<boolean> => {
    const needsUpdate = name !== project.name;
    if (needsUpdate) {
      const didUpdate = await controller.updateProject(
        project.id,
        name,
        undefined,
        workflowProjectId === project.id
          ? {
              activeThreadId: null,
              openActiveThread: false,
            }
          : undefined
      );
      if (!didUpdate) {
        return false;
      }
    }

    if (workflowProjectId === project.id) {
      if (source === "blur" && !needsUpdate) {
        return true;
      }

      setWorkflowProjectId(null);
      if (source === "enter") {
        const newThreadId = await controller.createThread(project.id, {
          openActiveThread: false,
        });
        if (newThreadId) {
          setWorkflowThreadId(newThreadId);
          setEditingItemId(newThreadId);
        } else {
          setEditingItemId(null);
        }
      } else {
        setEditingItemId(null);
      }
      return true;
    }

    setEditingItemId(null);
    return true;
  }, [workflowProjectId]);

  const handleCommitThreadTitle = useCallback(async (
    thread: ThreadSummary,
    title: string,
    source: "enter" | "blur"
  ): Promise<boolean> => {
    const needsUpdate = title !== thread.title;
    if (needsUpdate) {
      const didUpdate = await controller.updateThread(
        thread.id,
        title,
        workflowThreadId === thread.id
          ? {
              openActiveThread: false,
            }
          : undefined
      );
      if (!didUpdate) {
        return false;
      }
    }

    if (workflowThreadId === thread.id) {
      if (source === "blur" && !needsUpdate) {
        return true;
      }

      setWorkflowThreadId(null);
      setEditingItemId(null);
      if (source === "enter") {
        await controller.openThread(thread.id);
        setComposerFocusKey((value) => value + 1);
      }
      return true;
    }

    setEditingItemId(null);
    return true;
  }, [workflowThreadId]);

  const handleMoveProjectToGroup = useCallback((projectId: string, groupId: string | null) => {
    controller.moveProjectToGroup(projectId, groupId);
  }, []);

  const handleReorderProject = useCallback((projectId: string, targetSortOrder: number) => {
    controller.reorderProject(projectId, targetSortOrder);
  }, []);

  const handleReorderThread = useCallback((threadId: string, targetSortOrder: number) => {
    controller.reorderThread(threadId, targetSortOrder);
  }, []);

  const handleDeleteProject = useCallback((project: ProjectSummary) => {
    setProjectDialog({ mode: "delete", project });
  }, []);

  const handleCreateThread = useCallback(async (project: ProjectSummary) => {
    const newId = await controller.createThread(project.id, {
      openActiveThread: false,
    });
    if (newId) {
      setWorkflowProjectId(null);
      setWorkflowThreadId(newId);
      setEditingItemId(newId);
    }
  }, []);

  const handleUnlockProject = useCallback(async (projectId: string, password: string): Promise<boolean> => {
    const error = await controller.unlockProject(projectId, password);
    if (error) {
      setUnlockError({ projectId, message: error.message });
      return false;
    }

    setUnlockError(null);
    setUnlockDialog({ mode: "closed" });
    return true;
  }, []);

  const openUnlockDialog = useCallback((project: ProjectSummary) => {
    setUnlockError(null);
    setUnlockDialog({ mode: "open", project });
  }, []);

  const closeUnlockDialog = useCallback(() => {
    if (!state.isLoading) {
      setUnlockDialog({ mode: "closed" });
      setUnlockError(null);
    }
  }, [state.isLoading]);

  const closeProjectDialog = useCallback(() => {
    if (!state.isLoading) {
      setProjectDialog({ mode: "closed" });
    }
  }, [state.isLoading]);

  const confirmCreateProject = useCallback(async () => {
    const newProjectId = await controller.createProject(projectName, true, password, {
      activeThreadId: null,
      openActiveThread: false,
    });
    if (newProjectId) {
      setProjectDialog({ mode: "closed" });
      setProjectName("");
      setPassword("");
      setWorkflowProjectId(null);

      const newThreadId = await controller.createThread(newProjectId, {
        openActiveThread: false,
      });
      if (newThreadId) {
        setWorkflowThreadId(newThreadId);
        setEditingItemId(newThreadId);
      }
    }
  }, [projectName, password]);

  const confirmDeleteProject = useCallback(async () => {
    if (projectDialog.mode !== "delete") {
      return;
    }

    const didDelete = await controller.deleteProject(projectDialog.project.id);
    if (didDelete) {
      setProjectDialog({ mode: "closed" });
    }
  }, [projectDialog]);

  const handleLockAllProjects = useCallback(() => {
    controller.lockAllProjects();
  }, []);

  const sidebar = (
    <Sidebar
      projectGroups={state.snapshot?.projectGroups ?? []}
      projects={state.snapshot?.projects ?? []}
      threadsByProject={state.snapshot?.threadsByProject ?? {}}
      activeThreadId={state.snapshot?.activeThreadId ?? state.activeThread?.thread.id ?? null}
      isBusy={state.isLoading}
      editingItemId={editingItemId}
      onSetEditingItemId={handleSetEditingItemId}
      onSelectThread={handleSelectThread}
      onCreateProject={handleCreateProject}
      onCreateEncryptedProject={handleCreateEncryptedProject}
      onUpdateProject={handleUpdateProject}
      onCommitProjectName={handleCommitProjectName}
      onCreateThread={handleCreateThread}
      onUnlockProject={openUnlockDialog}
      onCommitThreadTitle={handleCommitThreadTitle}
      onDeleteProject={handleDeleteProject}
      onMoveProjectToGroup={handleMoveProjectToGroup}
      onReorderProject={handleReorderProject}
      onReorderThread={handleReorderThread}
      onLockAllProjects={handleLockAllProjects}
      onOpenSettings={() => setSettingsDialogOpen(true)}
    />
  );

  const hasProjects = (state.snapshot?.projects?.length ?? 0) > 0;

  const activeProject = state.snapshot?.projects.find(
    (p) =>
      p.id === state.activeThread?.thread.projectId ||
      (state.snapshot?.activeThreadId &&
        state.snapshot.threadsByProject[p.id]?.some((t) => t.id === state.snapshot?.activeThreadId))
  );

  const isLocked = activeProject ? (activeProject.isEncrypted && !state.unlockedKeys[activeProject.id]) : false;

  const mainContent = state.activeThread ? (
    isLocked && activeProject ? (
      <LockScreen
        projectName={activeProject.name}
        isBusy={state.isLoading}
        errorMessage={unlockError?.projectId === activeProject.id ? unlockError.message : null}
        onUnlock={(password) => {
          void handleUnlockProject(activeProject.id, password);
        }}
      />
    ) : (
      <>
        <ThreadHeader thread={state.activeThread.thread} />
        <MessageHistory messages={state.activeThread.messages} />
        <MessageComposer
          value={state.composeText}
          onChange={(text) => workspaceStore.setComposeText(text)}
          onSend={handleSend}
          sendError={state.sendError}
          focusRequestKey={composerFocusKey}
          disabled={state.isLoading}
        />
      </>
    )
  ) : !hasProjects && !state.isLoading && !state.error ? (
    <WorkspaceEmptyState />
  ) : (
    <EmptyState />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {windowMode === "frameless" ? <WindowResizeHandles /> : null}
      <Header mode={windowMode === "native" ? "inline" : "frameless"} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <WorkspaceShell
          sidebar={sidebar}
          main={
            <>
              {mainContent}
              <ProjectDialog
                dialog={projectDialog}
                projectName={projectName}
                isBusy={state.isLoading}
                password={password}
                onProjectNameChange={setProjectName}
                onPasswordChange={setPassword}
                onClose={closeProjectDialog}
                onConfirmCreate={confirmCreateProject}
                onConfirmDelete={confirmDeleteProject}
              />
              <UnlockProjectDialog
                dialog={unlockDialog}
                isBusy={state.isLoading}
                errorMessage={
                  unlockDialog.mode === "open" && unlockError?.projectId === unlockDialog.project.id
                    ? unlockError.message
                    : null
                }
                onClose={closeUnlockDialog}
                onUnlock={(password) => {
                  if (unlockDialog.mode === "open") {
                    void handleUnlockProject(unlockDialog.project.id, password);
                  }
                }}
              />
              <SettingsDialog
                isOpen={isSettingsDialogOpen}
                onClose={() => {
                  if (!state.isLoading) {
                    setSettingsDialogOpen(false);
                  }
                }}
              />
            </>
          }
          isLoading={state.isLoading && state.snapshot === null}
          error={state.error}
          hasSnapshot={state.snapshot !== null}
        />
      </div>
    </div>
  );
}

interface ProjectDialogProps {
  dialog: ProjectDialogState;
  projectName: string;
  isBusy: boolean;
  password?: string;
  onProjectNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onConfirmCreate: () => void;
  onConfirmDelete: () => void;
}

interface UnlockProjectDialogProps {
  dialog: UnlockDialogState;
  isBusy: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onUnlock: (password: string) => void;
}

function ProjectDialog({
  dialog,
  projectName,
  isBusy,
  password,
  onProjectNameChange,
  onPasswordChange,
  onClose,
  onConfirmCreate,
  onConfirmDelete,
}: ProjectDialogProps): React.ReactElement | null {
  const isOpen = dialog.mode !== "closed";
  const isCreate = dialog.mode === "create-encrypted";
  const title = isCreate ? "Create encrypted project" : "Delete project";
  const confirmLabel = isCreate ? "Create project" : "Delete project";
  const canSubmit = isCreate
    ? !isBusy && projectName.trim() !== "" && (password?.length ?? 0) > 0
    : !isBusy;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Enter" && canSubmit) {
        event.preventDefault();
        if (isCreate) {
          onConfirmCreate();
        } else {
          onConfirmDelete();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canSubmit, isCreate, isOpen, onClose, onConfirmCreate, onConfirmDelete]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-dialog-title"
      style={dialogOverlayStyle}
      onClick={onClose}
    >
      <div style={dialogCardStyle} onClick={(event) => event.stopPropagation()}>
        <h2 id="project-dialog-title" style={dialogTitleStyle}>
          {title}
        </h2>
        {isCreate ? (
          <>
            <input
              type="text"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              style={dialogInputStyle}
              autoFocus
              disabled={isBusy}
            />
            <input
              type="password"
              placeholder="Encryption password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              style={dialogInputStyle}
              disabled={isBusy}
            />
            <p style={{ ...dialogCopyStyle, color: "#f38ba8", fontSize: 12, fontWeight: 600 }}>
              ⚠️ DATA IS IRRECOVERABLE: If you lose this password, your notes cannot be decrypted.
            </p>
          </>
        ) : (
          <p style={dialogCopyStyle}>
            Delete <strong>{dialog.project.name}</strong>? All threads and messages in this project
            will be removed.
          </p>
        )}
        <div style={dialogActionsStyle}>
          <button type="button" onClick={onClose} disabled={isBusy} style={dialogSecondaryButtonStyle}>
            Cancel
          </button>
          <button
            type="button"
            onClick={isCreate ? onConfirmCreate : onConfirmDelete}
            disabled={!canSubmit}
            style={isCreate ? dialogPrimaryButtonStyle : dialogDangerButtonStyle}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnlockProjectDialog({
  dialog,
  isBusy,
  errorMessage,
  onClose,
  onUnlock,
}: UnlockProjectDialogProps): React.ReactElement | null {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (dialog.mode === "open") {
      setPassword("");
    }
  }, [dialog]);

  if (dialog.mode === "closed") {
    return null;
  }

  const canSubmit = !isBusy && password.trim() !== "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-project-dialog-title"
      style={dialogOverlayStyle}
      onClick={onClose}
    >
      <div style={dialogCardStyle} onClick={(event) => event.stopPropagation()}>
        <h2 id="unlock-project-dialog-title" style={dialogTitleStyle}>
          Unlock project
        </h2>
        <p style={dialogCopyStyle}>
          Enter the password for <strong>{dialog.project.name}</strong> to unlock its contents.
        </p>
        <input
          type="password"
          placeholder="Encryption password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={dialogInputStyle}
          autoFocus
          disabled={isBusy}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSubmit) {
              onUnlock(password);
            }
          }}
        />
        {errorMessage ? (
          <p style={{ ...dialogCopyStyle, color: "#f38ba8", marginTop: 12 }}>{errorMessage}</p>
        ) : null}
        <div style={dialogActionsStyle}>
          <button type="button" onClick={onClose} disabled={isBusy} style={dialogSecondaryButtonStyle}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onUnlock(password)}
            disabled={!canSubmit}
            style={dialogPrimaryButtonStyle}
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

const dialogOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(17, 17, 27, 0.78)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 1100,
};

const dialogCardStyle: React.CSSProperties = {
  width: "min(420px, 100%)",
  borderRadius: 16,
  border: "1px solid #313244",
  background: "#181825",
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
  padding: 20,
};

const dialogTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
  color: "#cdd6f4",
};

const dialogCopyStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 14,
  lineHeight: 1.5,
  color: "#a6adc8",
};

const dialogInputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 14,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #45475a",
  background: "#11111b",
  color: "#cdd6f4",
  fontSize: 15,
  outline: "none",
};

const dialogActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 18,
};

const dialogButtonBaseStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid transparent",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const dialogSecondaryButtonStyle: React.CSSProperties = {
  ...dialogButtonBaseStyle,
  borderColor: "#45475a",
  background: "transparent",
  color: "#cdd6f4",
};

const dialogPrimaryButtonStyle: React.CSSProperties = {
  ...dialogButtonBaseStyle,
  background: "#89b4fa",
  color: "#11111b",
};

const dialogDangerButtonStyle: React.CSSProperties = {
  ...dialogButtonBaseStyle,
  background: "#f38ba8",
  color: "#11111b",
};
