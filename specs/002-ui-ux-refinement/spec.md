# Feature Specification: UI and UX Refinements

**Feature Branch**: `002-ui-ux-refinement`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "There are several UI enhancements I'd like to make: 1) Window header is ugly with ugly minimize, maximize and close buttons. I would prefer if it was possible to hide the default header and show some header drawn by our application 2) When user clicks + button to create a new thread, add the thread and make thread name editable with focus on it so user can immediately type and edit the name and confirm with enter 3) The same applies to project - instead of showing popup window, create temporary project name like 'Project 01', 'Project 02', ... etc. with all text selected and focus on it so user can start typing and override the name right away. Again, enter will confirm the name 4) Make projects collapsible 5) Add hover effect over project and note 6) Add right click menu for project and note - Add rename and delete action 7) Make threads and projects reorderable by drag and drop 8) Add project groups and allow moving projects to groups - this will be another right click option - it will show expandible context menu with names of groups where to move"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Custom Window Management (Priority: P1)

As a user, I want a modern-looking window header that integrates with the application's aesthetic so that the interface feels professional and unified.

**Why this priority**: Fundamental branding and visual identity. Impacts every interaction with the application window.

**Independent Test**: Can be tested by launching the app and verifying the default OS title bar is hidden and replaced by a custom-styled header with functional minimize, maximize, and close buttons.

**Acceptance Scenarios**:

1. **Given** the application is launched, **When** I look at the top of the window, **Then** I see a custom-styled header instead of the default operating system title bar.
2. **Given** the custom header is visible, **When** I click the minimize/maximize/close buttons, **Then** the window performs the corresponding OS action.

---

### User Story 2 - Frictionless Thread and Project Creation (Priority: P2)

As a user, I want to create threads and projects without being interrupted by modal dialogs so that I can maintain my creative flow.

**Why this priority**: Direct impact on core user productivity and "speed of thought" task management.

**Independent Test**: Can be fully tested by clicking the '+' button and immediately typing a name to create a thread or project without any popup windows.

**Acceptance Scenarios**:

1. **Given** I am in the sidebar, **When** I click the '+' button for a new thread, **Then** a new thread appears with the name field focused and editable.
2. **Given** a new project is created, **When** the default name (e.g., 'Project 01') appears, **Then** the text is fully selected so I can overwrite it immediately by typing.
3. **Given** I am editing a thread or project name, **When** I press Enter, **Then** the name is saved and the edit mode is exited.

---

### User Story 3 - Sidebar Organization and Management (Priority: P3)

As a user, I want to organize my workspace using collapsing, reordering, and grouping so that I can manage a large number of items effectively.

**Why this priority**: Essential for power users and long-term usability as the workspace grows.

**Independent Test**: Can be tested by collapsing projects, dragging items to new positions, verifying hover feedback, and moving projects into groups via the right-click context menu.

**Acceptance Scenarios**:

1. **Given** I have multiple projects, **When** I click the collapse toggle on a project, **Then** its contents (threads) are hidden from view.
2. **Given** I hover over a project or thread, **When** the mouse is over the item, **Then** the item highlights to provide visual feedback.
3. **Given** I right-click a project or thread, **When** the context menu appears, **Then** I see options to Rename, Delete, and (for projects) Move to Group.
4. **Given** I drag a thread or project, **When** I drop it in a new location, **Then** the order of items in the sidebar is updated.

---

### Edge Cases

- **Duplicate Names**: What happens when a user types a name that already exists during inline editing? (Assumption: Allow duplicates or append a number).
- **Empty Names**: How does the system handle an empty name on Enter? (Assumption: Revert to previous name or delete the temporary item).
- **Drag & Drop Boundaries**: How does the system handle dropping a project into itself or into an invalid group?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST hide the native OS window frame and title bar.
- **FR-002**: The application MUST provide a draggable custom header area with functional minimize, maximize, and close buttons.
- **FR-003**: Clicking the 'Add' (+) button for Threads or Projects MUST create a new entry in "Edit Mode" within the sidebar list.
- **FR-004**: "Edit Mode" MUST automatically focus the text input and select all text for new Projects.
- **FR-005**: New Projects MUST be assigned a default incrementing name (e.g., "Project 01", "Project 02").
- **FR-006**: Pressing 'Enter' while in Edit Mode MUST commit the name change and exit Edit Mode.
- **FR-007**: Projects MUST support a collapsed/expanded state that persists across sessions.
- **FR-008**: Sidebar items (Projects and Threads) MUST display a visual highlight on hover.
- **FR-009**: Right-clicking a sidebar item MUST trigger a context menu with "Rename" and "Delete" actions.
- **FR-010**: Sidebar items MUST be reorderable via drag-and-drop within their respective containers only.
- **FR-011**: The system MUST support "Project Groups" (created via a sidebar context menu) and allow moving projects into these groups via a nested context menu.

### Key Entities

- **Thread**: A conversation or task stream.
- **Project**: A container for threads and notes. Can be collapsed.
- **Project Group**: A higher-level container for organizing Projects.
- **Window Header**: A UI component that replaces the OS-level title bar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create and name a new project in under 3 seconds (as measured by time from '+' click to 'Enter' press).
- **SC-002**: Sidebar reordering via drag-and-drop reflects the new order in the UI in under 200ms.
- **SC-003**: Zero popup windows/modals are required for basic item creation and renaming.
- **SC-004**: 100% of projects can be collapsed to reduce vertical sidebar usage.
