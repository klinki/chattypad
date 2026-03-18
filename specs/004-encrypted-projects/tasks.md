---

description: "Task list for Encrypted Projects feature implementation"
---

# Tasks: Encrypted Projects

**Input**: Design documents from `/specs/004-encrypted-projects/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are requested for the foundational crypto logic to ensure security integrity.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify environment readiness for cryptographic operations

- [x] T001 Verify Bun native Web Crypto API support in a temporary test script

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and data schema for encryption support

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Update `ProjectSummary` and `ProjectCreateRequest` interfaces in `src/shared/contracts/workspace.ts`
- [x] T003 Update database schema in `src/main/database/schema.ts` to add `is_encrypted`, `password_hash`, and `encryption_salt` columns to `projects`
- [x] T004 Implement `CryptoService` for PBKDF2 key derivation and AES-GCM encryption in `src/shared/crypto/crypto-service.ts`
- [x] T005 [P] Create unit tests for `CryptoService` in `tests/unit/crypto-service.test.ts`
- [x] T006 Update `IPC_CHANNELS` with `PROJECT_UNLOCK`, `PROJECT_LOCK`, and `PROJECT_LOCK_ALL` in `src/shared/contracts/workspace.ts`

**Checkpoint**: Foundation ready - encryption primitives and data schema are in place.

---

## Phase 3: User Story 1 - Create an Encrypted Project (Priority: P1) 🎯 MVP

**Goal**: Allow users to create specialized encrypted projects with password protection.

**Independent Test**: Use the "New Project" dialog to create an encrypted project and verify its metadata in the SQLite database.

### Implementation for User Story 1

- [x] T007 [US1] Update `ProjectDialog` UI in `src/renderer/features/workspace/workspace-screen.tsx` to include encryption toggle and password field
- [x] T008 [US1] Update `insertProject` and `ProjectCreateRequest` handling in `src/main/database/workspace-repository.ts` to store encryption metadata
- [x] T009 [US1] Implement `PROJECT_CREATE` logic in `src/main/ipc/workspace-ipc.ts` to hash the password and generate salts
- [x] T010 [US1] Update `src/renderer/features/workspace/workspace-controller.ts` to pass encryption parameters to the main process
- [x] T010a [US1] Independent Validation: Verify that a new encrypted project is created with a lock icon and `is_encrypted=1` in the database.

**Checkpoint**: User Story 1 complete - encrypted projects can be created and persisted.

---

## Phase 4: User Story 2 - Unlock and Access Encrypted Project (Priority: P1)

**Goal**: Prompt for a password and decrypt content for authenticated users.

**Independent Test**: Click a locked project in the sidebar, enter the correct password, and verify that encrypted threads/messages become visible.

### Implementation for User Story 2

- [x] T011 [US2] Implement `PROJECT_UNLOCK` IPC handler in `src/main/ipc/workspace-ipc.ts` for password verification
- [x] T012 [US2] Update `workspace-store.ts` to maintain a transient state of `unlockedKeys` (in-memory only)
- [x] T013 [US2] Create `LockScreen` component with password entry in `src/renderer/components/lock-screen.tsx`
- [x] T014 [US2] Update `WorkspaceScreen` in `src/renderer/features/workspace/workspace-screen.tsx` to conditionally render `LockScreen` for locked projects
- [x] T015 [US2] Update `workspace-repository.ts` to decrypt `chat_threads.title` and `messages.content` using the session key
- [x] T016 [US2] Add lock icon indicators to encrypted projects in `src/renderer/components/sidebar.tsx`
- [x] T016a [US2] Independent Validation: Verify that clicking a locked project shows the password prompt and entering the correct password decrypts and reveals the content.

**Checkpoint**: User Story 2 complete - encrypted projects can be unlocked and their content accessed.

---

## Phase 5: User Story 3 - Automatic Locking (Priority: P2)

**Goal**: Automatically re-secure projects on inactivity or application exit.

**Independent Test**: Unlock a project, wait 5 minutes, and verify that the `LockScreen` reappears.

### Implementation for User Story 3

- [x] T017 [US3] Implement `PROJECT_LOCK` and `PROJECT_LOCK_ALL` IPC handlers in `src/main/ipc/workspace-ipc.ts` to clear session keys
- [x] T018 [US3] Implement inactivity timer logic (5-minute reset on activity) in `src/renderer/features/workspace/workspace-screen.tsx`
- [x] T018a [US3] [P] Implement "Lock All" button in the Sidebar header to trigger `project:lock-all` IPC.
- [x] T019 [US3] Ensure all projects are initialized as locked on application startup in `src/main/app/main.ts`
- [x] T019a [US3] Independent Validation: Verify that an unlocked project automatically re-locks after 5 minutes of inactivity.

**Checkpoint**: User Story 3 complete - projects are automatically secured.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final security audits and UX refinements

- [x] T020 [P] Implement secure password clearing from memory after key derivation in `src/shared/crypto/crypto-service.ts`
- [x] T021 [P] Add "Data is irrecoverable" warning to the creation dialog in `src/renderer/features/workspace/workspace-screen.tsx`
- [x] T022 Run full `quickstart.md` validation scenarios and verify SQLite content is encrypted
- [x] T022a [P] Measure and verify that decryption takes less than 500ms as per SC-002 using performance markers in `workspace-controller.ts`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all implementation.
- **User Story 1 (Phase 3)**: Depends on Phase 2.
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs encrypted data to unlock).
- **User Story 3 (Phase 5)**: Depends on Phase 4 (needs unlock state to lock).
- **Polish (Final Phase)**: Depends on all user stories.

### Parallel Opportunities

- T005 (Tests) can be developed in parallel with T004 (Implementation).
- T016 (Sidebar icons) can be developed in parallel with the `LockScreen` (T013).
- T020 and T021 can be done in parallel during the polish phase.

---

## Parallel Example: User Story 2

```bash
# Developer A:
Task: "Create LockScreen component in src/renderer/components/lock-screen.tsx"

# Developer B:
Task: "Add lock icon indicators to encrypted projects in src/renderer/components/sidebar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Foundational crypto and schema.
2. Implement project creation with encryption.
3. Implement unlocking and in-memory decryption.
4. **STOP and VALIDATE**: Ensure data is encrypted in SQLite but viewable after entering the password.

### Incremental Delivery

1. Foundation -> Crypto ready.
2. US1 -> Encryption possible.
3. US2 -> Decryption possible (MVP achieved).
4. US3 -> Security automated.
5. Polish -> Hardened security.

---

## Notes

- [P] tasks involve different layers (main vs renderer) or independent files.
- [Story] labels ensure each task maps to a specific requirement in `spec.md`.
- PBKDF2 iterations should be high enough for security but low enough to meet the 500ms goal.
