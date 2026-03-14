/**
 * Workspace shell: the top-level layout container.
 * FR-012: Shows an empty state when no thread is selected.
 * FR-013: Shows a recoverable error state if workspace data is unavailable.
 */
import React from "react";
import type { IpcError } from "../../shared/contracts/workspace.js";

interface WorkspaceShellProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  isLoading: boolean;
  error: IpcError | null;
}

export function WorkspaceShell({
  sidebar,
  main,
  isLoading,
  error,
}: WorkspaceShellProps): React.ReactElement {
  if (isLoading) {
    return (
      <div style={containerStyle}>
        <LoadingState />
      </div>
    );
  }

  if (error) {
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
        {main}
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
        color: "#585b70",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 32 }}>💬</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#a6adc8" }}>
        No active thread
      </div>
      <div style={{ fontSize: 13, maxWidth: 280, textAlign: "center" }}>
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
        color: "#585b70",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 32 }}>🗂️</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#a6adc8" }}>
        No workspace data yet
      </div>
      <div style={{ fontSize: 13, maxWidth: 320, textAlign: "center" }}>
        The local workspace is empty. Start the app on a Bun + Electrobun
        workstation to generate or seed the SQLite data, then reopen the
        workspace.
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
        color: "#585b70",
        fontSize: 14,
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
        gap: 8,
      }}
    >
      <div style={{ fontSize: 24 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>
        {isCorruptDatabase
          ? "Saved Data Needs Recovery"
          : error.recoverable
            ? "Workspace Unavailable"
            : "Fatal Error"}
      </div>
      <div style={{ fontSize: 13, maxWidth: 300, textAlign: "center", color: "#a6adc8" }}>
        {error.message}
      </div>
      {isCorruptDatabase && (
        <div
          style={{
            fontSize: 12,
            maxWidth: 340,
            textAlign: "center",
            color: "#bac2de",
            lineHeight: 1.5,
          }}
        >
          Close ChattyPad, back up <code>chattypad.db</code> if needed, then
          remove it so the application can rebuild a clean local workspace
          database.
        </div>
      )}
      <div style={{ fontSize: 11, color: "#585b70" }}>code: {error.code}</div>
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
