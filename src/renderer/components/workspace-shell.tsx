/**
 * Workspace shell: the top-level layout container.
 * FR-012: Shows an empty state when no thread is selected.
 * FR-013: Shows a recoverable error state if workspace data is unavailable.
 */
import React from "react";
import type { IpcError } from "../../shared/contracts/workspace.js";
import { getWorkspaceShellRenderMode } from "./workspace-shell-state.js";

interface WorkspaceShellProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  isLoading: boolean;
  error: IpcError | null;
  hasSnapshot: boolean;
}

export function WorkspaceShell({
  sidebar,
  main,
  isLoading,
  error,
  hasSnapshot,
}: WorkspaceShellProps): React.ReactElement {
  const renderMode = getWorkspaceShellRenderMode({ isLoading, error, hasSnapshot });

  if (renderMode === "loading") {
    return (
      <div style={containerStyle}>
        <LoadingState />
      </div>
    );
  }

  if (renderMode === "full-error" && error) {
    return (
      <div style={containerStyle}>
        <ErrorState error={error} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      {sidebar}
      <main
        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {renderMode === "shell-with-main-error" && error ? <ErrorState error={error} /> : main}
      </main>
    </div>
  );
}

export function EmptyState(): React.ReactElement {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 32 }}>💬</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-main)" }}>
        No active thread
      </div>
      <div style={{ fontSize: 14, maxWidth: 280, textAlign: "center" }}>
        Choose a project and open a chat thread from the left panel to view its
        conversation.
      </div>
    </div>
  );
}

export function WorkspaceEmptyState(): React.ReactElement {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 32 }}>🗂️</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-main)", textAlign: "center", maxWidth: 400 }}>
        To start working, let's create a first project and thread
      </div>
      <div style={{ fontSize: 14, maxWidth: 320, textAlign: "center" }}>
        No projects found. Use the sidebar to add your first workspace project.
      </div>
    </div>
  );
}

function LoadingState(): React.ReactElement {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: 15,
      }}
    >
      Loading workspace…
    </div>
  );
}

function ErrorState({ error }: { error: IpcError }): React.ReactElement {
  const isCorruptDatabase = error.code === "DB_CORRUPT";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#f38ba8",
        gap: 12,
        padding: 40,
      }}
    >
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-main)" }}>
        {isCorruptDatabase
          ? "Saved Data Needs Recovery"
          : error.recoverable
            ? "Workspace Unavailable"
            : "Fatal Error"}
      </div>
      <div style={{ fontSize: 14, maxWidth: 320, textAlign: "center", color: "var(--text-muted)", lineHeight: 1.5 }}>
        {error.message}
      </div>
      {isCorruptDatabase && (
        <div
          style={{
            fontSize: 13,
            maxWidth: 400,
            textAlign: "center",
            color: "var(--text-muted)",
            lineHeight: 1.5,
            padding: "16px",
            background: "rgba(255, 255, 255, 0.04)",
            borderRadius: 8,
            border: "1px solid var(--border-subtle)",
            marginTop: 8,
          }}
        >
          Close ChattyPad, back up <code>chattypad.db</code> if needed, then
          remove it so the application can rebuild a clean local workspace
          database.
        </div>
      )}
      <div style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.5, marginTop: 12 }}>
        Error Code: {error.code}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  height: "100%",
  width: "100%",
  alignItems: "center",
  justifyContent: "center",
};
