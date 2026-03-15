# Research: UI and UX Refinements

This research document outlines the technical decisions and best practices for implementing the UI/UX enhancements in ChattyPad.

## Decision 1: Custom Window Header in Electrobun

**Decision**: Use `titleBarStyle: "hidden"` in `BrowserWindow` options and implement a React-based header.

**Rationale**:
- Native headers are "ugly" as per requirements and don't match the Catppuccin-like theme (inferred from colors like `#181825`).
- Electrobun supports hiding the title bar, which allows the renderer to use the full window area.

**Implementation Details**:
- **Main Process**: Update `BrowserWindow` initialization in `src/main/app/main.ts`.
- **Renderer Process**: Use `-webkit-app-region: drag` for the header container.
- **Controls**: Implement custom Minimize, Maximize, and Close buttons. These will communicate with the main process via IPC to trigger window management methods.

---

## Decision 2: Inline Creation and Editing Pattern

**Decision**: Use a "Local State First" approach for inline editing with a dedicated `EditMode` state in sidebar items.

**Rationale**:
- Eliminates modal dialogs, preserving user flow.
- Follows the pattern of modern productivity tools like VS Code or Notion.

**Implementation Details**:
- **State**: `isEditing: boolean` and `tempValue: string` for each project/thread item.
- **Auto-focus**: Use `useRef` and `useEffect` to focus the input and select text immediately upon entering edit mode.
- **Persistence**: Commit changes to the SQLite database via existing `workspace:updateProject` or similar IPC calls.

---

## Decision 3: Sidebar Organization and Persistence

**Decision**: Extend the SQLite schema to include `is_collapsed` and `group_id` for projects, and create a `project_groups` table.

**Rationale**:
- Requirements explicitly state that collapsing and grouping must "persist across sessions".
- Schema changes are necessary to support hierarchical organization.

**Implementation Details**:
- **Schema**:
  - `ALTER TABLE projects ADD COLUMN is_collapsed INTEGER DEFAULT 0;`
  - `ALTER TABLE projects ADD COLUMN group_id TEXT REFERENCES project_groups(id) ON DELETE SET NULL;`
  - `CREATE TABLE project_groups (id TEXT PRIMARY KEY, name TEXT, sort_order INTEGER);`

---

## Decision 4: Drag & Drop Reordering

**Decision**: Use `@dnd-kit/core` and `@dnd-kit/sortable`.

**Rationale**:
- Lightweight, modular, and works well with React.
- Provides accessible and smooth reordering primitives.
- Existing `sort_order` in the database supports this feature without structural changes.

---

## Decision 5: Custom React Context Menus

**Decision**: Implement a custom React-based context menu system.

**Rationale**:
- Electrobun's native context menu support is limited or undocumented in the current scope.
- Custom menus allow for better styling and nested "Move to Group" submenus required by the spec.
