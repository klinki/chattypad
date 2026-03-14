# Workspace IPC Contract

## Purpose

Define the main renderer-to-main process contracts required to load the workspace, activate a thread, and send a message for the desktop chat workspace feature.

## Shared Data Shapes

### ProjectSummary

- `id`: string
- `name`: string
- `sortOrder`: number

### ThreadSummary

- `id`: string
- `projectId`: string
- `title`: string
- `sortOrder`: number
- `lastMessageAt`: string | null

### MessageView

- `id`: string
- `threadId`: string
- `role`: string
- `content`: string
- `createdAt`: string
- `sequenceNumber`: number

### WorkspaceSnapshot

- `projects`: `ProjectSummary[]`
- `threadsByProject`: `Record<string, ThreadSummary[]>`
- `activeThreadId`: `string | null`

### ActiveThreadDetail

- `thread`: `ThreadSummary`
- `messages`: `MessageView[]`

## Channels

### `workspace:load`

**Request**:
- No payload.

**Response**:
- `WorkspaceSnapshot`

**Behavior**:
- Returns all projects and thread summaries required to populate the sidebar.
- If no data exists, returns empty collections and `activeThreadId: null`.

### `thread:open`

**Request**:
- `threadId: string`

**Response**:
- `ActiveThreadDetail`

**Behavior**:
- Returns thread metadata and ordered messages for the selected thread.
- Rejects the request if the thread does not exist.

### `message:send`

**Request**:
- `threadId: string`
- `content: string`
- `role: string`

**Response**:
- `ActiveThreadDetail`

**Behavior**:
- Trims and validates the content.
- Persists a new message for the thread.
- Returns the refreshed active thread detail including the new message.
- Rejects the request if the thread does not exist or the content is empty after trimming.

## Error Contract

All failed requests must return a structured error with:
- `code`: stable machine-readable identifier
- `message`: user-safe description
- `recoverable`: boolean

## Manual Verification Mapping

- `workspace:load` supports User Story 1.
- `thread:open` supports User Stories 1 and 2.
- `message:send` supports User Story 3.
