# Tasks: Settings Dialog

**Input**: Design documents from `/specs/005-settings-dialog/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Basic unit tests for settings resolution and validation are included to ensure reliability across platforms.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create directory structure for settings in `src/main/app/`, `src/main/ipc/`, `src/renderer/ipc/`, and `src/renderer/components/`
- [X] T002 [P] Define `Settings` interface and `SettingsContract` in `src/shared/contracts/settings.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for settings management and IPC

- [X] T003 Create `SettingsManager` class skeleton with `getSettings` and `updateSettings` methods in `src/main/app/settings.ts`
- [X] T004 [P] Setup IPC contract registration for settings in `src/main/ipc/settings.ts`

**Checkpoint**: Foundation ready - settings logic and IPC structure are in place.

---

## Phase 3: User Story 1 - Configuration Lookup & Persistence (Priority: P1) 🎯 MVP

**Goal**: Load and save application settings from `settings.json` using a prioritized lookup strategy.

**Independent Test**: Verify settings are loaded from `CHATTYPAD_HOME` env var if present, falling back to local files in the specified priority order.

### Implementation for User Story 1

- [X] T005 [P] [US1] Implement prioritized path resolution logic for `settings.json` in `src/main/app/settings.ts`
- [X] T006 [US1] Implement `load()` and `save()` methods using `bun:fs` and JSON parsing in `src/main/app/settings.ts`
- [X] T007 [US1] Initialize and load settings during the main process startup in `src/main/app/main.ts`
- [X] T008 [P] [US1] Add unit tests for settings resolution logic in `tests/unit/settings-manager.test.ts`

**Checkpoint**: User Story 1 is functional - settings can be persisted and loaded reliably.

---

## Phase 4: User Story 2 - Database Directory Configuration (Priority: P2)

**Goal**: Configure the database storage directory with platform-specific defaults and path validation.

**Independent Test**: Confirm the database is initialized in the directory specified in settings, defaulting to `%AppData%/chattypad` on Windows.

### Implementation for User Story 2

- [X] T009 [P] [US2] Implement platform-specific default path resolution for `databaseDir` in `src/main/app/settings.ts`
- [X] T010 [US2] Add path validation and automatic directory creation for `databaseDir` in `src/main/app/settings.ts`
- [X] T011 [US2] Update SQLite database initialization to use the `databaseDir` from settings in `src/main/database/sqlite.ts`

**Checkpoint**: User Story 2 is functional - the application now respects the configured database path.

---

## Phase 5: User Story 3 - Settings UI (Dialog) (Priority: P3)

**Goal**: Provide a React-based UI for users to view and modify application settings.

**Independent Test**: Open the Settings Dialog from the UI, change the database path, save, and verify the change in `settings.json`.

### Implementation for User Story 3

- [X] T012 [P] [US3] Implement IPC handlers for `getSettings` and `updateSettings` in `src/main/ipc/settings.ts`
- [X] T013 [P] [US3] Implement the renderer-side IPC bridge for settings in `src/renderer/ipc/settings.ts`
- [X] T014 [US3] Create the `SettingsDialog` React component with "General" section and path input in `src/renderer/components/SettingsDialog.tsx`
- [X] T015 [US3] Add a settings trigger (e.g., gear icon) to the sidebar or main menu in `src/renderer/components/Sidebar.tsx`

**Checkpoint**: User Story 3 is functional - users can now manage settings through the application UI.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation and validation

- [X] T016 [P] Update `README.md` with instructions on using `CHATTYPAD_HOME` for custom configurations
- [ ] T017 Execute all validation scenarios defined in `specs/005-settings-dialog/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on T001 and T002.
- **User Stories (Phase 3-5)**: All depend on Phase 2. US2 depends on US1 for persistence. US3 depends on US1/US2 for actual data to display.
- **Polish (Phase 6)**: Depends on completion of all user stories.

### Parallel Opportunities

- T002, T004, T005, T008, T009, T012, T013, T016 can all run in parallel as they involve different files and layers.
- Once the `SettingsManager` skeleton (T003) is ready, US1 logic (T005, T006) and US3 IPC/UI (T012, T013, T014) can proceed largely in parallel.

---

## Parallel Example: User Story 3

```bash
# Implement IPC layers for US3 in parallel:
Task: "Implement IPC handlers for getSettings and updateSettings in src/main/ipc/settings.ts"
Task: "Implement the renderer-side IPC bridge for settings in src/renderer/ipc/settings.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Setup and Foundational phases.
2. Implement US1 for basic loading/saving.
3. Implement US2 to make the database path configurable.
4. **VALIDATE**: Manually edit `settings.json` and verify the database location changes on restart.

### Incremental UI Delivery

1. Implement US3 to add the Settings Dialog.
2. **VALIDATE**: Use the UI to change the database path and verify the `settings.json` update.
