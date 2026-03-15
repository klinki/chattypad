# Data Model: UI and UX Refinements

This document defines the key entities and state transitions for the UI/UX enhancements.

## Project Groups

Represents a logical grouping of projects in the sidebar.

- **id**: `string` (UUID) - Primary Key
- **name**: `string` - The group's display name
- **sortOrder**: `number` - For drag-and-drop reordering
- **createdAt**: `ISO8601 string`
- **updatedAt**: `ISO8601 string`

**Relationships**:
- A `ProjectGroup` has many `Projects`.

---

## Project (Extended)

Updated fields to support organization features.

- **id**: `string` (UUID) - Primary Key
- **name**: `string`
- **sortOrder**: `number`
- **groupId**: `string | null` (Foreign Key to `project_groups.id`)
- **isCollapsed**: `boolean` - Persists the expanded/collapsed state of the project's thread list
- **createdAt**: `ISO8601 string`
- **updatedAt**: `ISO8601 string`

---

## Chat Thread (Extended)

- **id**: `string` (UUID) - Primary Key
- **projectId**: `string` (Foreign Key to `projects.id`)
- **title**: `string`
- **sortOrder**: `number` - For reordering threads within a project
- **createdAt**: `ISO8601 string`
- **updatedAt**: `ISO8601 string`
- **lastMessageAt**: `ISO8601 string | null`

---

## UI State (Volatile)

Represented in React components or a dedicated UI store (e.g., Zustand).

### Editing State
- **editingId**: `string | null` - The ID of the item currently being renamed (Project or Thread).
- **tempName**: `string` - The value of the input during editing.

### Drag & Drop State
- **activeDragId**: `string | null` - The ID of the item currently being dragged.
- **overDragId**: `string | null` - The ID of the item currently being hovered over during a drag operation.
