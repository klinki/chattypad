# Quickstart: Desktop Chat Workspace

## Goal

Validate the desktop chat workspace feature against the specification using the planned TypeScript, Electrobun, and SQLite stack.

## Prerequisites

- Bun installed in the local development environment.
- Electrobun project scaffolding initialized in the repository.
- A local SQLite database available through the application's configured data path.

## Implementation Checklist

1. Create the main-process application shell, renderer workspace view, and shared models under the planned `src/` structure.
2. Add local persistence for projects, threads, and messages using one SQLite database file.
3. Implement the workspace load, thread open, and message send contracts.
4. Add Bun tests for persistence rules, ordering, and message validation.
5. Seed local data for manual validation of sidebar navigation and conversation history.

## Manual Validation Flows

### User Story 1: Browse Projects and Threads

1. Launch the desktop application with seeded projects and threads.
2. Confirm the left sidebar shows projects with their related threads grouped correctly.
3. Select multiple threads and confirm the active thread indicator updates each time.

### User Story 2: Read Conversation History

1. Open a thread containing historical messages.
2. Confirm messages appear in chronological order.
3. Scroll through a long thread and confirm older and newer messages remain accessible.

### User Story 3: Send a New Message

1. Open an existing thread.
2. Enter a plain-text message and send it.
3. Confirm the new message appears immediately in the active thread.
4. Close and reopen the application.
5. Confirm the message still exists in the same thread.
6. Attempt to send an empty or whitespace-only message and confirm the application rejects it safely.

## Automated Validation Targets

- Persistence of projects, threads, and messages across restarts.
- Chronological message ordering inside a thread.
- Rejection of empty or whitespace-only messages.
- Correct lookup failure behavior for missing thread identifiers.
