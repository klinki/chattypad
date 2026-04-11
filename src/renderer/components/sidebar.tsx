import React, { useState, useEffect, useRef } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ContextMenu } from "./context-menu.js";
import { isProjectTreeCollapsed, isProjectTreeLocked } from "./sidebar-tree-state.js";
import type {
  ProjectSummary,
  ThreadSummary,
  ProjectGroupSummary,
} from "../../shared/contracts/workspace.js";

interface SidebarProps {
  projectGroups?: ProjectGroupSummary[];
  projects: ProjectSummary[];
  threadsByProject: Record<string, ThreadSummary[]>;
  activeThreadId: string | null;
  isBusy: boolean;
  editingItemId: string | null;
  onSetEditingItemId: (id: string | null) => void;
  onSelectThread: (threadId: string) => void;
  onCreateProject: () => void;
  onCreateEncryptedProject: () => void;
  onUpdateProject: (id: string, name?: string, isCollapsed?: boolean) => void;
  onCommitProjectName: (
    project: ProjectSummary,
    name: string,
    source: "enter" | "blur"
  ) => Promise<boolean>;
  onCreateThread: (project: ProjectSummary) => void;
  onUnlockProject?: (project: ProjectSummary) => void;
  onCommitThreadTitle: (
    thread: ThreadSummary,
    title: string,
    source: "enter" | "blur"
  ) => Promise<boolean>;
  onDeleteProject: (project: ProjectSummary) => void;
  onMoveProjectToGroup?: (projectId: string, groupId: string | null) => void;
  onReorderProject?: (projectId: string, targetSortOrder: number) => void;
  onReorderThread?: (threadId: string, targetSortOrder: number) => void;
  onLockAllProjects?: () => void;
  onOpenSettings?: () => void;
}

export function Sidebar(props: SidebarProps): React.ReactElement {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: any[] } | null>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeStr = String(active.id);
    const overStr = String(over.id);

    if (activeStr.startsWith("thread-") && overStr.startsWith("thread-")) {
      let targetOrder = 0;
      for (const projectId of Object.keys(props.threadsByProject)) {
        const threads = props.threadsByProject[projectId] ?? [];
        const overIndex = threads.findIndex(t => t.id === overStr.replace("thread-", ""));
        if (overIndex !== -1) {
          targetOrder = threads[overIndex]?.sortOrder ?? overIndex;
          break;
        }
      }
      props.onReorderThread?.(activeStr.replace("thread-", ""), targetOrder);
    } else if (activeStr.startsWith("proj-") && overStr.startsWith("proj-")) {
      const overProj = props.projects.find(p => p.id === overStr.replace("proj-", ""));
      if (overProj) {
        props.onReorderProject?.(activeStr.replace("proj-", ""), overProj.sortOrder);
      }
    }
  }

  const groupedProjects: Record<string, ProjectSummary[]> = { "none": [] };
  props.projectGroups?.forEach(g => { groupedProjects[g.id] = []; });
  
  props.projects.forEach(p => {
    if (p.groupId && groupedProjects[p.groupId]) {
      groupedProjects[p.groupId]!.push(p);
    } else {
      groupedProjects["none"]!.push(p);
    }
  });

  function openCreateProjectMenu(x?: number, y?: number): void {
    const rect = createButtonRef.current?.getBoundingClientRect();
    setContextMenu({
      x: x ?? rect?.left ?? 16,
      y: y ?? (rect?.bottom ?? 16) + 4,
      items: [
        { label: "Create new project", onClick: props.onCreateProject },
        { label: "Create new encrypted project", onClick: props.onCreateEncryptedProject },
      ],
    });
  }

  return (
    <nav
      className="sidebar-container"
      style={{
        width: 280,
        minWidth: 180,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-subtle)",
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
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          Workspace
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            className="top-action-btn"
            onClick={props.onOpenSettings}
            disabled={props.isBusy}
            title="Open settings"
          >
            Settings
          </button>
          <button
            type="button"
            className="top-action-btn"
            onClick={props.onLockAllProjects}
            disabled={props.isBusy}
            title="Lock all encrypted projects"
            style={{ fontSize: 14 }}
          >
            🔒
          </button>
          <button
            type="button"
            className="top-action-btn"
            ref={createButtonRef}
            onContextMenu={(event) => {
              event.preventDefault();
              if (!props.isBusy) {
                openCreateProjectMenu(event.clientX, event.clientY);
              }
            }}
            onClick={() => {
              if (!props.isBusy) {
                props.onCreateProject();
              }
            }}
            disabled={props.isBusy}
            style={{ fontSize: 18, padding: "2px 8px" }}
          >
            +
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {props.projects.length === 0 ? (
          <div style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 14 }}>
            No projects yet.
          </div>
        ) : (
          <SortableContext items={props.projects.map(p => `proj-${p.id}`)} strategy={verticalListSortingStrategy}>
            {groupedProjects["none"]?.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                props={props}
                setContextMenu={setContextMenu}
              />
            ))}
          </SortableContext>
        )}
      </DndContext>
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </nav>
  );
}

function ProjectItem({ project, props, setContextMenu }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `proj-${project.id}` });
  const isTreeLocked = isProjectTreeLocked(project);
  const isTreeCollapsed = isProjectTreeCollapsed(project);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 2,
  };

  const [tempProjectName, setTempProjectName] = useState(project.name);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const isEditingProject = props.editingItemId === project.id;
  const threads = props.threadsByProject[project.id] ?? [];

  useEffect(() => {
    if (isEditingProject && projectInputRef.current) {
      setTempProjectName(project.name);
      projectInputRef.current.focus();
      projectInputRef.current.select();
    }
  }, [isEditingProject, project.name]);

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Rename", onClick: () => props.onSetEditingItemId(project.id) },
        {
          label: "Move to Group",
          submenu: [
            { label: "None", onClick: () => props.onMoveProjectToGroup?.(project.id, null) },
            ...(props.projectGroups || []).map((g: any) => ({
              label: g.name,
              onClick: () => props.onMoveProjectToGroup?.(project.id, g.id),
            })),
          ],
        },
        { label: "Delete", danger: true, onClick: () => props.onDeleteProject(project) },
      ],
    });
  };

  async function commitProjectName(source: "enter" | "blur"): Promise<void> {
    const trimmedName = tempProjectName.trim();
    if (trimmedName === "") {
      props.onSetEditingItemId(null);
      setTempProjectName(project.name);
      return;
    }

    await props.onCommitProjectName(project, trimmedName, source);
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className="sidebar-item-container project-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          padding: "4px 8px",
          cursor: "default",
          minHeight: 28,
        }}
        {...listeners}
        onContextMenu={onContextMenu}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isTreeLocked) {
              return;
            }
            props.onUpdateProject(project.id, undefined, !project.isCollapsed);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={isTreeLocked}
          title={isTreeLocked ? "Unlock project to expand threads" : undefined}
          className="btn-subtle"
          style={{
            cursor: isTreeLocked ? "not-allowed" : "pointer",
            fontSize: 9,
            width: 20,
            height: 20,
            transform: isTreeCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
          aria-label={isTreeCollapsed ? "Expand" : "Collapse"}
        >
          ▼
        </button>
        {isEditingProject ? (
          <input
            ref={projectInputRef}
            value={tempProjectName}
            onChange={(e) => setTempProjectName(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void commitProjectName("enter");
              } else if (e.key === "Escape") {
                props.onSetEditingItemId(null);
                setTempProjectName(project.name);
              }
            }}
            onBlur={() => {
              void commitProjectName("blur");
            }}
            style={inlineInputStyle}
          />
        ) : (
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-main)",
              userSelect: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              marginLeft: 4,
              opacity: 0.9,
            }}
            title={project.name}
            onDoubleClick={() => props.onSetEditingItemId(project.id)}
          >
            {project.name}
          </div>
        )}
        
        {project.isEncrypted && (
          project.isLocked ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                props.onUnlockProject?.(project);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={props.isBusy}
              title="Unlock project"
              aria-label={`Unlock ${project.name}`}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: 12,
                color: "var(--text-error)",
                opacity: props.isBusy ? 0.5 : 0.8,
                cursor: props.isBusy ? "not-allowed" : "pointer",
              }}
            >
              🔒
            </button>
          ) : (
            <div
              title="Project is encrypted"
              style={{ fontSize: 12, color: "var(--text-muted)", opacity: 0.8 }}
            >
              🔓
            </div>
          )
        )}

        {!isEditingProject && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => props.onCreateThread(project)}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={props.isBusy}
              aria-label={`Create thread in ${project.name}`}
              title={`Create thread in ${project.name}`}
              className="btn-subtle"
              style={{ fontSize: 16 }}
            >
              +
            </button>
          </div>
        )}
      </div>

      <div 
        className={`project-threads-container ${isTreeCollapsed ? 'collapsed' : ''}`}
        style={{ maxHeight: isTreeCollapsed ? 0 : 1000 }}
      >
        {threads.length === 0 ? (
          <div
            style={{
              padding: "4px 32px",
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            No threads
          </div>
        ) : (
          <SortableContext items={threads.map((t: any) => `thread-${t.id}`)} strategy={verticalListSortingStrategy}>
            {threads.map((thread: any) => {
              const isActive = thread.id === props.activeThreadId;
              const isEditingThread = props.editingItemId === thread.id;
              
              return (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={isActive}
                  isEditing={isEditingThread}
                  onSelectThread={props.onSelectThread}
                  onSetEditingItemId={props.onSetEditingItemId}
                  onCommitThreadTitle={props.onCommitThreadTitle}
                  setContextMenu={setContextMenu}
                />
              );
            })}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

function ThreadItem({ thread, isActive, isEditing, onSelectThread, onSetEditingItemId, onCommitThreadTitle, setContextMenu }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `thread-${thread.id}` });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [tempTitle, setTempTitle] = useState(thread.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      setTempTitle(thread.title);
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, thread.title]);

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Rename", onClick: () => onSetEditingItemId(thread.id) },
      ],
    });
  };

  async function commitThreadTitle(source: "enter" | "blur"): Promise<void> {
    const trimmedTitle = tempTitle.trim();
    if (trimmedTitle === "") {
      onSetEditingItemId(null);
      setTempTitle(thread.title);
      return;
    }

    await onCommitThreadTitle(thread, trimmedTitle, source);
  }

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={{ ...style, padding: "7px 12px 7px 24px", marginBottom: 1 }} {...attributes} {...listeners}>
        <input
          ref={inputRef}
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void commitThreadTitle("enter");
            } else if (e.key === "Escape") {
              onSetEditingItemId(null);
              setTempTitle(thread.title);
            }
          }}
          onBlur={() => {
            void commitThreadTitle("blur");
          }}
          style={inlineInputStyle}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onContextMenu={onContextMenu} className="sidebar-item-container">
      <button
        onClick={() => onSelectThread(thread.id)}
        onDoubleClick={() => onSetEditingItemId(thread.id)}
        aria-current={isActive ? "page" : undefined}
        className={`thread-item ${isActive ? 'active' : ''}`}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "5px 8px 5px 32px",
          fontSize: 12,
          color: isActive ? "var(--text-main)" : "var(--text-muted)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          borderRadius: 6,
          marginBottom: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          outline: "none",
        }}
      >
        {thread.title}
      </button>
    </div>
  );
}

const inlineInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "2px 4px",
  borderRadius: 4,
  border: "1px solid var(--accent-blue)",
  background: "rgba(255, 255, 255, 0.04)",
  color: "var(--text-main)",
  fontSize: 13,
  outline: "none",
};

const actionButtonStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-hover)",
  color: "var(--text-main)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const iconButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid var(--border-subtle)",
  background: "transparent",
  color: "var(--accent-blue)",
  fontSize: 18,
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
  lineHeight: 1,
};
