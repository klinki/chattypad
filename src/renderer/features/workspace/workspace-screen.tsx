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
import { MessageComposer } from "../../components/message-composer.js";
import type { WorkspaceState } from "../../state/workspace-store.js";

const controller = createWorkspaceController(workspaceIpcClient);

type ProjectDialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "delete"; project: ProjectSummary };

export function WorkspaceScreen(): React.ReactElement {
  const [state, setState] = useState<WorkspaceState>(workspaceStore.getState());
  const [projectDialog, setProjectDialog] = useState<ProjectDialogState>({
    mode: "closed",
  });
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    const unsub = workspaceStore.subscribe(setState);
    controller.loadWorkspace();
    return unsub;
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

  const handleCreateProject = useCallback(() => {
    setProjectName("");
    setProjectDialog({ mode: "create" });
  }, []);

  const handleDeleteProject = useCallback((project: ProjectSummary) => {
    setProjectDialog({ mode: "delete", project });
  }, []);

  const handleCreateThread = useCallback((project: ProjectSummary) => {
    controller.createThread(project.id);
  }, []);

  const closeProjectDialog = useCallback(() => {
    if (!state.isLoading) {
      setProjectDialog({ mode: "closed" });
    }
  }, [state.isLoading]);

  const confirmCreateProject = useCallback(async () => {
    const didCreate = await controller.createProject(projectName);
    if (didCreate) {
      setProjectDialog({ mode: "closed" });
      setProjectName("");
    }
  }, [projectName]);

  const confirmDeleteProject = useCallback(async () => {
    if (projectDialog.mode !== "delete") {
      return;
    }

    const didDelete = await controller.deleteProject(projectDialog.project.id);
    if (didDelete) {
      setProjectDialog({ mode: "closed" });
    }
  }, [projectDialog]);

  const sidebar = (
    <Sidebar
      projects={state.snapshot?.projects ?? []}
      threadsByProject={state.snapshot?.threadsByProject ?? {}}
      activeThreadId={state.activeThread?.thread.id ?? null}
      isBusy={state.isLoading}
      onSelectThread={handleSelectThread}
      onCreateProject={handleCreateProject}
      onCreateThread={handleCreateThread}
      onDeleteProject={handleDeleteProject}
    />
  );

  const hasProjects = (state.snapshot?.projects.length ?? 0) > 0;

  const mainContent = state.activeThread ? (
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
  ) : !hasProjects && !state.isLoading && !state.error ? (
    <WorkspaceEmptyState />
  ) : (
    <EmptyState />
  );

  return (
    <WorkspaceShell
      sidebar={sidebar}
      main={
        <>
          {mainContent}
          <ProjectDialog
            dialog={projectDialog}
            projectName={projectName}
            isBusy={state.isLoading}
            onProjectNameChange={setProjectName}
            onClose={closeProjectDialog}
            onConfirmCreate={confirmCreateProject}
            onConfirmDelete={confirmDeleteProject}
          />
        </>
      }
      isLoading={state.isLoading && state.snapshot === null}
      error={state.error}
    />
  );
}

interface ProjectDialogProps {
  dialog: ProjectDialogState;
  projectName: string;
  isBusy: boolean;
  onProjectNameChange: (value: string) => void;
  onClose: () => void;
  onConfirmCreate: () => void;
  onConfirmDelete: () => void;
}

function ProjectDialog({
  dialog,
  projectName,
  isBusy,
  onProjectNameChange,
  onClose,
  onConfirmCreate,
  onConfirmDelete,
}: ProjectDialogProps): React.ReactElement | null {
  if (dialog.mode === "closed") {
    return null;
  }

  const isCreate = dialog.mode === "create";
  const title = isCreate ? "Create project" : "Delete project";
  const confirmLabel = isCreate ? "Create project" : "Delete project";
  const canSubmit = isCreate ? projectName.trim().length > 0 && !isBusy : !isBusy;

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
            <p style={dialogCopyStyle}>
              Create a new workspace project. The project will appear in the sidebar immediately.
            </p>
            <input
              autoFocus
              value={projectName}
              onChange={(event) => onProjectNameChange(event.target.value)}
              placeholder="Project name"
              style={dialogInputStyle}
            />
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
