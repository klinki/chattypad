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
  onSelectThread: (threadId: string) => void;
}

export function Sidebar({
  projects,
  threadsByProject,
  activeThreadId,
  onSelectThread,
}: SidebarProps): React.ReactElement {
  return (
    <nav
      style={{
        width: 240,
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
          padding: "16px 12px 8px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#6c7086",
          textTransform: "uppercase",
        }}
      >
        Workspace
      </div>

      {projects.length === 0 ? (
        <div style={{ padding: "12px 16px", color: "#6c7086", fontSize: 13 }}>
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
              onSelectThread={onSelectThread}
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
  onSelectThread: (threadId: string) => void;
}

function ProjectGroup({
  project,
  threads,
  activeThreadId,
  onSelectThread,
}: ProjectGroupProps): React.ReactElement {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "#a6adc8",
          userSelect: "none",
        }}
      >
        {project.name}
      </div>
      {threads.length === 0 ? (
        <div
          style={{
            padding: "4px 24px",
            fontSize: 12,
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
                padding: "5px 12px 5px 24px",
                fontSize: 13,
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
