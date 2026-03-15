# IPC Contract: UI and UX Refinements

This document defines the new and updated IPC channels for the UI/UX enhancements.

## New IPC Channels

| Channel | Method | Description |
|---------|--------|-------------|
| `project-group:create` | Request | Creates a new project group. |
| `project-group:delete` | Request | Deletes a project group. |
| `project-group:update` | Request | Renames a project group. |
| `project:move-to-group` | Request | Moves a project into a group. |
| `project:reorder` | Request | Updates the `sort_order` of a project. |
| `thread:reorder` | Request | Updates the `sort_order` of a thread. |
| `project:update` | Request | Renames a project or updates its `is_collapsed` state. |
| `thread:update` | Request | Renames a thread. |
| `window:minimize` | Message | Minimizes the application window. |
| `window:maximize` | Message | Maximizes or restores the application window. |
| `window:close` | Message | Closes the application window. |

## Data Structures

### Project Group
```typescript
interface ProjectGroupSummary {
  id: string;
  name: string;
  sortOrder: number;
}
```

### Updated Workspace Snapshot
```typescript
interface WorkspaceSnapshot {
  projectGroups: ProjectGroupSummary[];
  projects: ProjectSummary[]; // Projects will now have groupId and isCollapsed
  threadsByProject: Record<string, ThreadSummary[]>;
  activeThreadId: string | null;
}
```

### Reorder Request
```typescript
interface ReorderRequest {
  itemId: string;
  targetSortOrder: number;
}
```
