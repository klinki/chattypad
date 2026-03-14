# Tasks: Desktop Chat Workspace

**Input**: Design documents from `/specs/001-desktop-chat-app/`
**Prerequisites**: [plan.md](E:\projects\own\chattypad\specs\001-desktop-chat-app\plan.md), [spec.md](E:\projects\own\chattypad\specs\001-desktop-chat-app\spec.md), [research.md](E:\projects\own\chattypad\specs\001-desktop-chat-app\research.md), [data-model.md](E:\projects\own\chattypad\specs\001-desktop-chat-app\data-model.md), [workspace-ipc-contract.md](E:\projects\own\chattypad\specs\001-desktop-chat-app\contracts\workspace-ipc-contract.md)

**Tests**: Include Bun unit and integration tests for persistence, ordering, validation, and manual quickstart verification for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Desktop application source uses `src/main/`, `src/renderer/`, and `src/shared/`
- Tests use `tests/unit/` and `tests/integration/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the TypeScript Electrobun project structure and developer tooling.

- [ ] T001 Create the desktop application directory structure in `src/main/`, `src/renderer/`, `src/shared/`, `tests/unit/`, and `tests/integration/`
- [ ] T002 Initialize Bun and Electrobun project configuration in `package.json`, `bunfig.toml`, and `tsconfig.json`
- [ ] T003 [P] Add TypeScript-aware lint and format configuration in `.gitignore` and `package.json`
- [ ] T004 [P] Create application entry points in `src/main/app/main.ts` and `src/renderer/main.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared models, local database, IPC scaffolding, and seed data required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create shared workspace contracts and domain types in `src/shared/contracts/workspace.ts` and `src/shared/models/workspace.ts`
- [ ] T006 [P] Implement SQLite connection and schema bootstrap in `src/main/database/sqlite.ts` and `src/main/database/schema.ts`
- [ ] T007 [P] Implement project, thread, and message repositories in `src/main/database/workspace-repository.ts`
- [ ] T008 [P] Add seed workspace data for manual validation in `src/main/database/seed.ts`
- [ ] T009 Implement workspace service orchestration for loading threads and messages in `src/main/app/workspace-service.ts`
- [ ] T010 Implement IPC registration and structured error mapping in `src/main/ipc/workspace-ipc.ts`
- [ ] T011 [P] Add foundational persistence and validation tests in `tests/unit/workspace-repository.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Browse Projects and Threads (Priority: P1) 🎯 MVP

**Goal**: Let the user browse projects and chat threads in the sidebar and open a selected thread in the main workspace.

**Independent Test**: Launch the app with seeded data, confirm the sidebar shows projects grouped with their threads, click different threads, and confirm the active thread changes and loads in the main view.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add integration coverage for workspace load and thread selection in `tests/integration/workspace-navigation.test.ts`

### Implementation for User Story 1

- [ ] T013 [P] [US1] Implement renderer workspace state for sidebar data and active thread selection in `src/renderer/state/workspace-store.ts`
- [ ] T014 [P] [US1] Build the project/thread sidebar UI in `src/renderer/components/sidebar.tsx`
- [ ] T015 [P] [US1] Build the main workspace shell and empty-state view in `src/renderer/components/workspace-shell.tsx`
- [ ] T016 [US1] Connect `workspace:load` and `thread:open` flows to the renderer state in `src/renderer/features/workspace/workspace-controller.ts`
- [ ] T017 [US1] Compose the initial desktop workspace screen in `src/renderer/features/workspace/workspace-screen.tsx`
- [ ] T018 [US1] Validate User Story 1 using the sidebar flow in `E:\projects\own\chattypad\specs\001-desktop-chat-app\quickstart.md`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Read Conversation History (Priority: P2)

**Goal**: Show the selected thread's full message history in chronological order and keep long conversations readable.

**Independent Test**: Open a thread with historical messages, verify chronological ordering, and scroll through a longer thread without losing access to earlier or later messages.

### Tests for User Story 2

- [ ] T019 [P] [US2] Add service and renderer integration coverage for chronological message loading in `tests/integration/thread-history.test.ts`

### Implementation for User Story 2

- [ ] T020 [P] [US2] Add ordered message query and thread detail mapping in `src/main/database/workspace-repository.ts`
- [ ] T021 [P] [US2] Implement conversation history list rendering in `src/renderer/components/message-history.tsx`
- [ ] T022 [P] [US2] Add active thread header and status presentation in `src/renderer/components/thread-header.tsx`
- [ ] T023 [US2] Connect thread detail data to the main conversation pane in `src/renderer/features/workspace/workspace-screen.tsx`
- [ ] T024 [US2] Handle missing threads and unreadable data states in `src/main/app/workspace-service.ts` and `src/renderer/components/workspace-shell.tsx`
- [ ] T025 [US2] Validate User Story 2 using the history flow in `E:\projects\own\chattypad\specs\001-desktop-chat-app\quickstart.md`

**Checkpoint**: At this point, User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Send a New Message (Priority: P3)

**Goal**: Allow the user to compose and send a new plain-text message in the active thread and persist it across restarts.

**Independent Test**: Open an existing thread, send a message, confirm it appears immediately, restart the app, confirm it remains in the thread, and confirm empty submissions are rejected.

### Tests for User Story 3

- [ ] T026 [P] [US3] Add message creation and validation coverage in `tests/unit/message-service.test.ts`
- [ ] T027 [P] [US3] Add integration coverage for message sending and persistence across reload in `tests/integration/message-send.test.ts`

### Implementation for User Story 3

- [ ] T028 [P] [US3] Implement message creation, validation, and thread timestamp updates in `src/main/app/message-service.ts`
- [ ] T029 [P] [US3] Implement `message:send` IPC handling in `src/main/ipc/workspace-ipc.ts`
- [ ] T030 [P] [US3] Build the compose box and send action UI in `src/renderer/components/message-composer.tsx`
- [ ] T031 [US3] Connect message submission and refresh behavior in `src/renderer/features/workspace/workspace-controller.ts`
- [ ] T032 [US3] Persist and surface send validation errors in `src/renderer/state/workspace-store.ts` and `src/renderer/components/message-composer.tsx`
- [ ] T033 [US3] Validate User Story 3 using the message send flow in `E:\projects\own\chattypad\specs\001-desktop-chat-app\quickstart.md`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize reliability, documentation alignment, and cross-story quality.

- [ ] T034 [P] Improve startup and thread-switch performance for the target dataset in `src/main/app/workspace-service.ts` and `src/renderer/state/workspace-store.ts`
- [ ] T035 [P] Add corrupted-database recovery handling and user-safe messaging in `src/main/database/sqlite.ts` and `src/renderer/components/workspace-shell.tsx`
- [ ] T036 Run the full quickstart validation and record any implementation notes in `E:\projects\own\chattypad\specs\001-desktop-chat-app\quickstart.md`
- [ ] T037 Update delivery guidance and agent context if implementation paths changed in `AGENTS.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies and can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion.
- **User Story 2 (Phase 4)**: Depends on Foundational completion and can reuse the thread opening flow delivered in US1 while remaining independently testable.
- **User Story 3 (Phase 5)**: Depends on Foundational completion and the active thread view from US1 and US2.
- **Polish (Phase 6)**: Depends on completion of the stories being shipped.

### User Story Dependencies

- **US1**: First MVP slice and the required base for user-visible navigation.
- **US2**: Builds on thread opening but remains independently testable once a thread can be selected.
- **US3**: Builds on the active thread view and persistence stack delivered earlier.

### Within Each User Story

- Automated tests should be added before or alongside implementation for the targeted behavior.
- State and model plumbing should land before final UI wiring.
- Each story ends with an explicit validation task against `quickstart.md`.

### Parallel Opportunities

- `T003` and `T004` can run in parallel after `T002`.
- `T006`, `T007`, `T008`, and `T011` can run in parallel once the shared contracts exist.
- In US1, `T013`, `T014`, and `T015` can run in parallel.
- In US2, `T020`, `T021`, and `T022` can run in parallel.
- In US3, `T026`, `T027`, `T028`, `T029`, and `T030` can run in parallel.

---

## Parallel Example: User Story 1

```text
T013 [US1] Implement renderer workspace state in src/renderer/state/workspace-store.ts
T014 [US1] Build the project/thread sidebar UI in src/renderer/components/sidebar.tsx
T015 [US1] Build the main workspace shell and empty-state view in src/renderer/components/workspace-shell.tsx
```

## Parallel Example: User Story 2

```text
T020 [US2] Add ordered message query and thread detail mapping in src/main/database/workspace-repository.ts
T021 [US2] Implement conversation history list rendering in src/renderer/components/message-history.tsx
T022 [US2] Add active thread header and status presentation in src/renderer/components/thread-header.tsx
```

## Parallel Example: User Story 3

```text
T026 [US3] Add message creation and validation coverage in tests/unit/message-service.test.ts
T028 [US3] Implement message creation, validation, and thread timestamp updates in src/main/app/message-service.ts
T030 [US3] Build the compose box and send action UI in src/renderer/components/message-composer.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate the sidebar navigation flow in `quickstart.md` before expanding scope.

### Incremental Delivery

1. Deliver Setup and Foundational work to establish the runnable shell and local persistence.
2. Ship US1 as the first usable increment.
3. Add US2 for complete conversation reading.
4. Add US3 for message composition and durable updates.
5. Finish with polish tasks only after the targeted stories pass their validation steps.

### Parallel Team Strategy

1. One developer completes project setup while another prepares entry points and local tooling.
2. After foundation is ready, UI and persistence tasks inside each story can be split by file ownership.
3. Validation tasks stay at the end of each story to confirm the slice is independently shippable.

---

## Notes

- All tasks follow the required checklist format with task IDs, optional parallel markers, story labels where required, and exact file paths.
- User story phases are ordered by priority and preserve independent validation.
- Suggested MVP scope is Phase 3 only after Setup and Foundational are complete.
