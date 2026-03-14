# Quickstart: Desktop Chat Workspace

## Goal

Validate the desktop chat workspace feature against the specification using the planned TypeScript, Electrobun, and SQLite stack.

## Prerequisites

- Bun installed in the local development environment.
- Electrobun project scaffolding initialized in the repository.
- A local SQLite database available through the application's configured data path.

## Implementation Checklist

1. ✅ Create the main-process application shell, renderer workspace view, and shared models under the planned `src/` structure.
2. ✅ Add local persistence for projects, threads, and messages using one SQLite database file.
3. ✅ Implement the workspace load, thread open, and message send contracts.
4. ✅ Add Bun tests for persistence rules, ordering, and message validation.
5. ✅ Seed local data for manual validation of sidebar navigation and conversation history.

## Automated Validation Targets

Run with: `bun test` (or `npm test`) on a machine where the Bun runtime is installed.

Target coverage:
- Persistence of projects, threads, and messages
- Chronological message ordering inside a thread (sequenceNumber ASC)
- Rejection of empty or whitespace-only messages (code: CONTENT_EMPTY)
- Correct lookup failure for missing thread identifiers (code: THREAD_NOT_FOUND / THREAD_OPEN_FAILED)
- Empty workspace returns empty collections and null activeThreadId (FR-012)
- Structured error shape (code, message, recoverable) on all failures (FR-013)

## Manual Validation Flows

> **Note**: The manual flows below require a running desktop environment with Electrobun's native
> WebView runtime. The Electrobun IPC bridge (`electrobun/bun` and `electrobun/renderer` modules)
> must be installed and wired before the UI renders. In this environment, Electrobun cannot be
> launched as a GUI desktop application. The steps below document what a developer should follow
> for full end-to-end desktop verification.

### User Story 1: Browse Projects and Threads

1. Launch the desktop application with seeded projects and threads.
2. Confirm the left sidebar shows projects with their related threads grouped correctly.
3. Select multiple threads and confirm the active thread indicator updates each time.

**Automated coverage**: `tests/integration/workspace-navigation.test.ts` — workspace:load, thread:open, empty state, ordering.

### User Story 2: Read Conversation History

1. Open a thread containing historical messages.
2. Confirm messages appear in chronological order.
3. Scroll through a long thread and confirm older and newer messages remain accessible.

**Automated coverage**: `tests/integration/thread-history.test.ts` — 10-message thread, sequence order, field shapes.

### User Story 3: Send a New Message

1. Open an existing thread.
2. Enter a plain-text message and send it.
3. Confirm the new message appears immediately in the active thread.
4. Close and reopen the application.
5. Confirm the message still exists in the same thread.
6. Attempt to send an empty or whitespace-only message and confirm the application rejects it safely.

**Automated coverage**: `tests/unit/message-service.test.ts`, `tests/integration/message-send.test.ts` — create, trim, sequence, reject, persist.

## Implementation Notes

- The renderer entry point is `src/renderer/main.ts`, and the HTML shell remains `src/renderer/index.html`.
- `npm run build` now bundles `src/renderer/main.ts` into `dist/renderer/` and copies `src/renderer/index.html` to `dist/renderer/index.html`, which is the file the Electrobun window loads.
- Seed data now covers 3 projects, 7 threads, an empty thread state, and an extended thread history for scroll validation.
- The main-process bootstrap seeds the SQLite database on first launch, wires Electrobun RPC request handlers, and opens a real `BrowserWindow` against the built renderer HTML.
- The renderer store now keeps sidebar thread metadata synchronized when the active thread changes or a new message is sent.
- Corrupted database errors are mapped to a recoverable `DB_CORRUPT` state with user-safe guidance.
- Message-send database failures are caught and returned through the IPC error contract instead of surfacing as uncaught exceptions.

## Validation Record

- Automated type-check: completed successfully via `npm run lint`.
- `npm test`: completed successfully in this environment.
- `npm run build`: completed successfully in this environment and produced the renderer assets under `dist/renderer/`.
- Manual quickstart flows for User Stories 1-3 and the actual Electrobun window launch were not executed in this environment and still need to be run on a Bun + Electrobun workstation.

