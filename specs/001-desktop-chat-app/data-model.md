# Data Model: Desktop Chat Workspace

## Overview

The feature stores a local workspace hierarchy of projects, chat threads, and messages. The model must preserve ordering, thread membership, and durable local state across restarts.

## Entities

### Project

**Purpose**: Groups related chat threads in the left navigation panel.

**Fields**:
- `id`: Stable unique identifier.
- `name`: Display name shown in the sidebar.
- `sortOrder`: Numeric position for stable sidebar ordering.
- `createdAt`: Timestamp of creation.
- `updatedAt`: Timestamp of the last metadata change.

**Validation Rules**:
- `name` is required.
- `name` must be non-empty after trimming.
- `sortOrder` must be a non-negative integer.

**Relationships**:
- One project has many chat threads.

### ChatThread

**Purpose**: Represents one selectable conversation within a project.

**Fields**:
- `id`: Stable unique identifier.
- `projectId`: Identifier of the parent project.
- `title`: Thread label shown in the sidebar.
- `sortOrder`: Numeric position within the parent project.
- `createdAt`: Timestamp of creation.
- `updatedAt`: Timestamp of the last message or metadata change.
- `lastMessageAt`: Timestamp of the most recent message, if any.

**Validation Rules**:
- `projectId` is required and must reference an existing project.
- `title` is required.
- `title` must be non-empty after trimming.
- `sortOrder` must be a non-negative integer.
- `lastMessageAt` may be empty only when the thread has no messages.

**Relationships**:
- Many chat threads belong to one project.
- One chat thread has many messages.

### Message

**Purpose**: Stores one plain-text chat entry within a thread.

**Fields**:
- `id`: Stable unique identifier.
- `threadId`: Identifier of the parent chat thread.
- `role`: Message author role used for display styling and labeling.
- `content`: Plain-text message body.
- `sequenceNumber`: Monotonic order value within the thread.
- `createdAt`: Timestamp of message creation.

**Validation Rules**:
- `threadId` is required and must reference an existing chat thread.
- `role` is required and must match an allowed local role set.
- `content` is required.
- `content` must contain at least one non-whitespace character.
- `sequenceNumber` must be greater than zero and unique within a thread.

**Relationships**:
- Many messages belong to one chat thread.

## Derived Views

### Sidebar Project View

Combines projects with their ordered child threads for the left navigation panel.

### Active Thread View

Combines selected thread metadata with its ordered messages for the main conversation pane.

## State Transitions

### Thread Selection

1. No active thread or an existing active thread is present.
2. User selects a different thread from the sidebar.
3. Active thread identifier changes.
4. The application loads ordered messages for the selected thread.
5. The renderer updates the main conversation area and active-thread indicator.

### Message Send

1. A thread is active and the compose box contains text.
2. User submits the message.
3. Input is trimmed and validated.
4. A new message record is created with the next sequence number.
5. The parent thread's `updatedAt` and `lastMessageAt` are updated.
6. The active thread view refreshes and displays the newly stored message.

### Empty State

1. Application starts and finds no projects or threads.
2. The sidebar shows no selectable thread items.
3. The main view displays an explanatory empty state instead of a conversation.
