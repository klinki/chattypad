# Tasks: Initial User Experience Onboarding

**Input**: Design documents from `/specs/003-blank-state-onboarding/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Manual verification tasks are included as per the specification's independent test criteria.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Verify development environment and dependencies in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [US2] Remove `seedDevelopmentData(db)` call from `src/main/app/main.ts` to ensure a clean slate
- [x] T003 [US2] Remove unused `seedDevelopmentData` import and related logging in `src/main/app/main.ts`

**Checkpoint**: Foundation ready - application starts in a truly blank state.

---

## Phase 3: User Story 2 - Clean Slate Development (Priority: P2)

**Goal**: Ensure the application starts with no seeded data for a clean onboarding experience.

**Independent Test**: Delete `chattypad.db` and launch the application; verify that the sidebar is empty and no projects/threads exist.

### Implementation for User Story 2

- [x] T004 [US2] Manually delete `chattypad.db` in repository root and launch app to verify no data is seeded
- [x] T005 [P] [US2] Add a note to `src/main/database/seed.ts` clarifying it is now for manual/dev use only

**Checkpoint**: User Story 2 is complete. The application is a clean slate.

---

## Phase 4: User Story 1 - Initial Launch Experience (Priority: P1) 🎯 MVP

**Goal**: Display a clear onboarding message when the application is in a blank state.

**Independent Test**: Launch the application with an empty database and verify the presence of the message: "To start working, let's create a first project and thread".

### Implementation for User Story 1

- [x] T006 [P] [US1] Update `WorkspaceEmptyState` component in `src/renderer/components/workspace-shell.tsx` with the onboarding message text and icon
- [x] T007 [US1] Update state detection logic in `src/renderer/features/workspace/workspace-screen.tsx` to ensure `WorkspaceEmptyState` is shown when projects and threads are empty
- [x] T008 [US1] Verify onboarding message displays correctly on an empty database in `src/renderer/features/workspace/workspace-screen.tsx`
- [x] T009 [US1] Verify onboarding message is replaced by the workspace view immediately after creating the first project
- [x] T010 [US1] Verify onboarding message reappears after deleting the last remaining project

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation updates.

- [x] T011 [P] Update `specs/003-blank-state-onboarding/quickstart.md` with final verification steps
- [x] T012 Run full validation against `specs/003-blank-state-onboarding/spec.md` success criteria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 2 (P2)**: Implementation of US2 (removing seeding) is a prerequisite for correctly testing US1 (onboarding message).
- **User Story 1 (P1)**: Depends on the clean slate provided by US2.

---

## Parallel Example: User Story 1

```bash
# Update the UI components in parallel:
Task: "Update WorkspaceEmptyState component in src/renderer/components/workspace-shell.tsx"
Task: "Add a note to src/main/database/seed.ts clarifying it is now for manual/dev use only"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 2: Foundational (Remove seeding).
2. Complete Phase 3: User Story 2 (Verify clean slate).
3. Complete Phase 4: User Story 1 (Implement onboarding message).
4. **STOP and VALIDATE**: Test the full onboarding flow from fresh install to first project creation.

### Incremental Delivery

1. Remove seeding → Application is clean but empty.
2. Add onboarding message → Application is clean and helpful.
3. Each step is independently verifiable.
