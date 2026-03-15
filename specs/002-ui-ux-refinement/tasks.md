# Tasks: UI and UX Refinements

**Input**: Design documents from `/specs/002-ui-ux-refinement/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are generated for core logic and IPC wiring as per project standards, but UI-specific testing (visuals/hover) is covered by the Independent Test criteria.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared dependencies

- [ ] T001 Install `@dnd-kit/core` and `@dnd-kit/sortable` dependencies using `bun add`
- [ ] T002 [P] Update `src/shared/contracts/workspace.ts` with new IPC channel constants and updated snapshot interfaces
- [ ] T003 [P] Update `src/shared/contracts/electrobun-rpc.ts` to include new RPC request and message schemas

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema updates and core IPC handlers that block all user stories

- [ ] T004 Update `src/main/database/schema.ts` to add `project_groups` table and new columns (`is_collapsed`, `group_id`) to `projects` table
- [ ] T005 [P] Update `src/main/database/workspace-repository.ts` with methods for `ProjectGroups` CRUD and `is_collapsed` updates
- [ ] T006 [P] Update `src/main/ipc/workspace-ipc.ts` to register handlers for new IPC channels defined in contracts
- [ ] T007 Update `src/renderer/state/workspace-store.ts` (or equivalent) to support `projectGroups` and new project fields

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Custom Window Management (Priority: P1) 🎯 MVP

**Goal**: Implement a custom draggable window header with minimize, maximize, and close controls.

**Independent Test**: Verify that launching the app shows no native title bar and that the custom header is draggable and functional.

### Implementation for User Story 1

- [ ] T008 Update `src/main/app/main.ts` to set `titleBarStyle: "hidden"` in `BrowserWindow` options
- [ ] T009 [P] [US1] Create `Header` component with draggable region and window controls in `src/renderer/components/header.tsx`
- [ ] T010 [US1] Implement window management IPC listeners in `src/main/app/main.ts` (minimize, maximize, close)
- [ ] T011 [US1] Integrate `Header` into the main layout in `src/renderer/features/workspace/workspace-screen.tsx`
- [ ] T012 [US1] [P] Apply `-webkit-app-region: drag` and `no-drag` styles in `src/renderer/index.html` or CSS

**Checkpoint**: User Story 1 functional and testable independently.

---

## Phase 4: User Story 2 - Frictionless Creation & Inline Editing (Priority: P2)

**Goal**: Enable inline editing and auto-focus when creating projects or threads.

**Independent Test**: Click '+' to create a project; verify it enters edit mode immediately with text selected and saves on Enter.

### Implementation for User Story 2

- [ ] T013 [US2] Rename `ProjectGroup` component to `ProjectItem` in `src/renderer/components/sidebar.tsx` for clarity
- [ ] T014 [US2] Implement `isEditing` state and inline text input in `ProjectItem` component
- [ ] T015 [US2] Add `useEffect` logic to `ProjectItem` for auto-focusing and selecting input text in edit mode
- [ ] T016 [US2] Update `onCreateProject` in `src/renderer/features/workspace/workspace-controller.ts` to trigger edit mode for new items
- [ ] T017 [US2] [P] Implement similar inline editing logic for Threads in `src/renderer/components/sidebar.tsx`

**Checkpoint**: User Story 2 functional and testable independently.

---

## Phase 5: User Story 3 - Sidebar Organization (Priority: P3)

**Goal**: Implement collapsing, reordering (Drag & Drop), and project grouping.

**Independent Test**: Collapse a project, reorder a thread, and move a project to a group; verify persistence.

### Implementation for User Story 3

- [ ] T018 [US3] Implement collapse/expand toggle and state persistence in `ProjectItem` and `workspace-store`
- [ ] T019 [US3] Create `ProjectGroup` component for rendering grouped projects in `src/renderer/components/sidebar.tsx`
- [ ] T020 [US3] Integrate `DndContext` and `SortableContext` from `@dnd-kit` into `Sidebar` component
- [ ] T021 [US3] Implement `handleDragEnd` in `workspace-controller.ts` with boundary validation (prevent invalid drops) to trigger `project:reorder` and `thread:reorder` IPC calls
- [ ] T022 [US3] Create custom `ContextMenu` component with support for dynamic nested submenus in `src/renderer/components/context-menu.tsx`
- [ ] T023 [US3] Wire up context menu to `ProjectItem` and `ThreadItem` with "Rename", "Delete", and "Move to Group" actions

**Checkpoint**: User Story 3 functional and testable independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Refinement and validation of all UI/UX enhancements.

- [ ] T024 [P] Add hover effects and transitions to all sidebar items in `src/renderer/components/sidebar.tsx`
- [ ] T025 [P] Implement nested submenu for "Move to Group" in the custom context menu
- [ ] T026 Update `src/main/database/seed.ts` to include sample project groups and collapsed states
- [ ] T027 Run `quickstart.md` validation to confirm all measurable outcomes (SC-001 to SC-004) are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Prerequisites for all technical work.
- **Foundational (Phase 2)**: Schema and IPC must be ready before UI can bind to them.
- **User Stories (Phases 3-5)**: 
  - US1 (Header) is visual and can be done early.
  - US2 (Inline Edit) and US3 (Dnd/Grouping) depend on the foundation but are mostly independent of each other.

### User Story Dependencies

- **US1**: Independent.
- **US2**: Independent.
- **US3**: Depends on US2's component structure (`ProjectItem` refactor).

### Parallel Opportunities

- T002 and T003 (Contracts)
- T005 and T006 (Repo and IPC handlers)
- T009 and T010 (Header UI vs Main listener)
- T024 and T025 (Polish tasks)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational schema updates.
2. Implement User Story 1 (Custom Header).
3. **STOP and VALIDATE**: Verify window management and dragging.

### Incremental Delivery

1. Deliver US1 (Window Header).
2. Deliver US2 (Inline Creation) -> Immediate productivity boost.
3. Deliver US3 (Organization) -> Scalability for many projects.

---

## Notes

- All tasks use [P] for parallelizable work where no file lock or logic dependency exists.
- Story labels [US1, US2, US3] ensure traceability to the specification.
- Each user story phase ends with a functional checkpoint.
