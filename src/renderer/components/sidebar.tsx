/**
 * Sidebar component: renders the project/thread navigation panel.
 * FR-002, FR-003, FR-005: Shows projects with threads grouped underneath; highlights active thread.
 */
import React from "react";
import type {
  ProjectSummary,
  ThreadSummary,
} from "../../shared/contracts/workspace.js";

interface SidebarProps {
  projects: ProjectSummary[];
  threadsByProject: Record<string, ThreadSummary[]>;
  activeThreadId: string | null;
  isBusy: boolean;
  onSelectThread: (threadId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (project: ProjectSummary) => void;
}

export function Sidebar({
  projects,
  threadsByProject,
  activeThreadId,
  isBusy,
  onSelectThread,
  onCreateProject,
  onDeleteProject,
}: SidebarProps): React.ReactElement {
  return (
    <nav
      style={{
        width: 280,
        minWidth: 180,
        background: "#181825",
        borderRight: "1px solid #313244",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        flexShrink: 0,
      }}
      aria-label="Projects and threads"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 12px 8px",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#6c7086",
            textTransform: "uppercase",
          }}
        >
          Workspace
        </div>
        <button
          type="button"
          onClick={onCreateProject}
          disabled={isBusy}
          style={actionButtonStyle}
        >
          New project
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={{ padding: "12px 16px", color: "#6c7086", fontSize: 14 }}>
          No projects yet.
        </div>
      ) : (
        projects.map((project) => {
          const threads = threadsByProject[project.id] ?? [];
          return (
            <ProjectGroup
              key={project.id}
              project={project}
              threads={threads}
              activeThreadId={activeThreadId}
              isBusy={isBusy}
              onSelectThread={onSelectThread}
              onDeleteProject={onDeleteProject}
            />
          );
        })
      )}
    </nav>
  );
}

interface ProjectGroupProps {
  project: ProjectSummary;
  threads: ThreadSummary[];
  activeThreadId: string | null;
  isBusy: boolean;
  onSelectThread: (threadId: string) => void;
  onDeleteProject: (project: ProjectSummary) => void;
}

function ProjectGroup({
  project,
  threads,
  activeThreadId,
  isBusy,
  onSelectThread,
  onDeleteProject,
}: ProjectGroupProps): React.ReactElement {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "6px 12px",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#a6adc8",
            userSelect: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
          title={project.name}
        >
          {project.name}
        </div>
        <button
          type="button"
          onClick={() => onDeleteProject(project)}
          disabled={isBusy}
          aria-label={`Delete ${project.name}`}
          title={`Delete ${project.name}`}
          style={iconButtonStyle}
        >
          Delete
        </button>
      </div>
      {threads.length === 0 ? (
        <div
          style={{
            padding: "6px 24px",
            fontSize: 13,
            color: "#585b70",
            fontStyle: "italic",
          }}
        >
          No threads
        </div>
      ) : (
        threads.map((thread) => {
          const isActive = thread.id === activeThreadId;
          return (
            <button
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              aria-current={isActive ? "page" : undefined}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "7px 12px 7px 24px",
                fontSize: 14,
                color: isActive ? "#cdd6f4" : "#a6adc8",
                background: isActive ? "#313244" : "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: 4,
                marginBottom: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {thread.title}
            </button>
          );
        })
      )}
    </div>
  );
}

const actionButtonStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #45475a",
  background: "#313244",
  color: "#cdd6f4",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const iconButtonStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 8,
  border: "1px solid #45475a",
  background: "transparent",
  color: "#f38ba8",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
};
