/**
 * Main workspace screen: composes all workspace UI components.
 * Connects the store, controller, sidebar, thread view, and message composer.
 */
import React, { useEffect, useState, useCallback } from "react";
import { workspaceStore } from "../../state/workspace-store.js";
import { createWorkspaceController } from "./workspace-controller.js";
import { workspaceIpcClient } from "../../ipc/workspace-client.js";
import { Sidebar } from "../../components/sidebar.js";
import type { ProjectSummary } from "../../../shared/contracts/workspace.js";
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
  | { mode: "create" }
  | { mode: "delete"; project: ProjectSummary };

export function WorkspaceScreen(): React.ReactElement {
  const [state, setState] = useState<WorkspaceState>(workspaceStore.getState());
  const [windowMode, setWindowMode] = useState<"native" | "frameless">(getWindowMode());
  const [projectDialog, setProjectDialog] = useState<ProjectDialogState>({
    mode: "closed",
  });
  const [projectName, setProjectName] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = workspaceStore.subscribe(setState);
    controller.loadWorkspace();
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

  const handleCreateProject = useCallback(async () => {
    setProjectDialog({ mode: "create" });
    setProjectName("");
    setIsEncrypted(false);
    setPassword("");
  }, []);

  const handleUpdateProject = useCallback((id: string, name?: string, isCollapsed?: boolean) => {
    controller.updateProject(id, name, isCollapsed);
  }, []);

  const handleUpdateThread = useCallback((id: string, title: string) => {
    controller.updateThread(id, title);
  }, []);

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
    const newId = await controller.createThread(project.id);
    if (newId) {
      setEditingItemId(newId);
    }
  }, []);

  const handleUnlockProject = useCallback((projectId: string, password: string) => {
    controller.unlockProject(projectId, password);
  }, []);

  const closeProjectDialog = useCallback(() => {
    if (!state.isLoading) {
      setProjectDialog({ mode: "closed" });
    }
  }, [state.isLoading]);

  const confirmCreateProject = useCallback(async () => {
    const didCreate = await controller.createProject(projectName, isEncrypted, password);
    if (didCreate) {
      setProjectDialog({ mode: "closed" });
      setProjectName("");
      setIsEncrypted(false);
      setPassword("");
    }
  }, [projectName, isEncrypted, password]);

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
      activeThreadId={state.activeThread?.thread.id ?? null}
      isBusy={state.isLoading}
      editingItemId={editingItemId}
      onSetEditingItemId={setEditingItemId}
      onSelectThread={handleSelectThread}
      onCreateProject={handleCreateProject}
      onUpdateProject={handleUpdateProject}
      onCreateThread={handleCreateThread}
      onUpdateThread={handleUpdateThread}
      onDeleteProject={handleDeleteProject}
      onMoveProjectToGroup={handleMoveProjectToGroup}
      onReorderProject={handleReorderProject}
      onReorderThread={handleReorderThread}
      onLockAllProjects={handleLockAllProjects}
    />
  );

  const hasProjects = (state.snapshot?.projects.length ?? 0) > 0;

  const activeProject = state.snapshot?.projects.find(
    (p) =>
      p.id === state.activeThread?.thread.projectId ||
      (state.snapshot?.activeThreadId &&
        state.snapshot.threadsByProject[p.id]?.some((t) => t.id === state.snapshot?.activeThreadId))
  );

  const isLocked = activeProject?.isEncrypted && !state.unlockedKeys[activeProject.id];

  const mainContent = state.activeThread ? (
    isLocked ? (
      <LockScreen
        projectName={activeProject?.name ?? "Project"}
        isBusy={state.isLoading}
        onUnlock={(password) => handleUnlockProject(activeProject!.id, password)}
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
                isEncrypted={isEncrypted}
                password={password}
                onProjectNameChange={setProjectName}
                onIsEncryptedChange={setIsEncrypted}
                onPasswordChange={setPassword}
                onClose={closeProjectDialog}
                onConfirmCreate={confirmCreateProject}
                onConfirmDelete={confirmDeleteProject}
              />
            </>
          }
          isLoading={state.isLoading && state.snapshot === null}
          error={state.error}
        />
      </div>
    </div>
  );
}

interface ProjectDialogProps {
  dialog: ProjectDialogState;
  projectName: string;
  isBusy: boolean;
  isEncrypted: boolean;
  password?: string;
  onProjectNameChange: (value: string) => void;
  onIsEncryptedChange: (value: boolean) => void;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onConfirmCreate: () => void;
  onConfirmDelete: () => void;
}

function ProjectDialog({
  dialog,
  projectName,
  isBusy,
  isEncrypted,
  password,
  onProjectNameChange,
  onIsEncryptedChange,
  onPasswordChange,
  onClose,
  onConfirmCreate,
  onConfirmDelete,
}: ProjectDialogProps): React.ReactElement | null {
  if (dialog.mode === "closed") {
    return null;
  }

  const isCreate = dialog.mode === "create";
  const title = isCreate ? "Create new project" : "Delete project";
  const confirmLabel = isCreate ? "Create project" : "Delete project";
  const canSubmit = !isBusy && projectName.trim() !== "" && (!isEncrypted || (password?.length ?? 0) > 0);

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
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: "#cdd6f4", fontSize: 14, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isEncrypted}
                onChange={(e) => onIsEncryptedChange(e.target.checked)}
                disabled={isBusy}
              />
              Encrypted Project
            </label>
            {isEncrypted && (
              <>
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
            )}
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

const dialogOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(17, 17, 27, 0.78)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
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
