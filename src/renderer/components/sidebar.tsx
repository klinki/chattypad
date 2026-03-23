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
  onUpdateProject: (id: string, name?: string, isCollapsed?: boolean) => void;
  onCreateThread: (project: ProjectSummary) => void;
  onUpdateThread: (id: string, title: string) => void;
  onDeleteProject: (project: ProjectSummary) => void;
  onMoveProjectToGroup?: (projectId: string, groupId: string | null) => void;
  onReorderProject?: (projectId: string, targetSortOrder: number) => void;
  onReorderThread?: (threadId: string, targetSortOrder: number) => void;
  onLockAllProjects?: () => void;
}

export function Sidebar(props: SidebarProps): React.ReactElement {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: any[] } | null>(null);
  
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={props.onLockAllProjects}
            disabled={props.isBusy}
            title="Lock all encrypted projects"
            style={{ ...actionButtonStyle, padding: "4px 8px", fontSize: 14 }}
          >
            🔒
          </button>
          <button
            type="button"
            onClick={props.onCreateProject}
            disabled={props.isBusy}
            style={actionButtonStyle}
          >
            +
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {props.projects.length === 0 ? (
          <div style={{ padding: "12px 16px", color: "#6c7086", fontSize: 14 }}>
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
    marginBottom: 8,
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

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          padding: "6px 12px",
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
          style={{
            background: "transparent",
            border: "none",
            color: "#6c7086",
            cursor: isTreeLocked ? "not-allowed" : "pointer",
            opacity: isTreeLocked ? 0.55 : 1,
            fontSize: 10,
            padding: "2px 4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: isTreeCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
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
                if (tempProjectName.trim()) {
                  props.onUpdateProject(project.id, tempProjectName);
                }
                props.onSetEditingItemId(null);
              } else if (e.key === "Escape") {
                props.onSetEditingItemId(null);
                setTempProjectName(project.name);
              }
            }}
            onBlur={() => {
              if (tempProjectName.trim() && tempProjectName !== project.name) {
                props.onUpdateProject(project.id, tempProjectName);
              }
              props.onSetEditingItemId(null);
            }}
            style={inlineInputStyle}
          />
        ) : (
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
            onDoubleClick={() => props.onSetEditingItemId(project.id)}
          >
            {project.name}
          </div>
        )}
        
        {project.isEncrypted && (
          <div
            title={project.isLocked ? "Project is locked" : "Project is encrypted"}
            style={{ fontSize: 12, color: project.isLocked ? "#f38ba8" : "#a6adc8", opacity: 0.8 }}
          >
            {project.isLocked ? "🔒" : "🔓"}
          </div>
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
              style={iconButtonStyle}
            >
              +
            </button>
          </div>
        )}
      </div>
      {!isTreeCollapsed && (
        threads.length === 0 ? (
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
                  onUpdateThread={props.onUpdateThread}
                  setContextMenu={setContextMenu}
                />
              );
            })}
          </SortableContext>
        )
      )}
    </div>
  );
}

function ThreadItem({ thread, isActive, isEditing, onSelectThread, onSetEditingItemId, onUpdateThread, setContextMenu }: any) {
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
              if (tempTitle.trim()) {
                onUpdateThread(thread.id, tempTitle);
              }
              onSetEditingItemId(null);
            } else if (e.key === "Escape") {
              onSetEditingItemId(null);
              setTempTitle(thread.title);
            }
          }}
          onBlur={() => {
            if (tempTitle.trim() && tempTitle !== thread.title) {
              onUpdateThread(thread.id, tempTitle);
            }
            onSetEditingItemId(null);
          }}
          style={inlineInputStyle}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onContextMenu={onContextMenu}>
      <button
        onClick={() => onSelectThread(thread.id)}
        onDoubleClick={() => onSetEditingItemId(thread.id)}
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
    </div>
  );
}

const inlineInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "2px 4px",
  borderRadius: 4,
  border: "1px solid #89b4fa",
  background: "#1e1e2e",
  color: "#cdd6f4",
  fontSize: 13,
  outline: "none",
};

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
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid #45475a",
  background: "transparent",
  color: "#89b4fa",
  fontSize: 18,
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
  lineHeight: 1,
};
