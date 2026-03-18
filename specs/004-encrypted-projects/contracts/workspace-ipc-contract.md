# IPC Contract: Encrypted Projects

## Overview
This contract defines the IPC updates needed to support encrypted projects in ChattyPad. These updates include new request types for creating, unlocking, and locking projects, as well as modifications to the existing `ProjectSummary` type.

## Modified Shared Types

### `ProjectSummary`
Added `isEncrypted` and `isLocked` flags.
```typescript
export interface ProjectSummary {
  id: string;
  name: string;
  sortOrder: number;
  groupId: string | null;
  isCollapsed: boolean;
  isEncrypted: boolean;
  isLocked: boolean;
}
```

### `ProjectCreateRequest`
Updated to include encryption options.
```typescript
export interface ProjectCreateRequest {
  name: string;
  isEncrypted?: boolean;
  password?: string; // Only provided if isEncrypted is true
}
```

## New Request Types

### `ProjectUnlockRequest`
Sent by the renderer to unlock an encrypted project.
```typescript
export interface ProjectUnlockRequest {
  projectId: string;
  password: string;
}
```

### `ProjectLockRequest`
Sent by the renderer to manually lock an encrypted project.
```typescript
export interface ProjectLockRequest {
  projectId: string;
}
```

## New IPC Channels

| Channel | Description | Payload Type | Response Type |
|---|---|---|---|
| `project:unlock` | Unlocks an encrypted project. | `ProjectUnlockRequest` | `IpcResult<void>` |
| `project:lock` | Locks an encrypted project. | `ProjectLockRequest` | `IpcResult<void>` |
| `project:lock-all` | Locks all currently open encrypted projects. | `void` | `IpcResult<void>` |

## Error Codes
- `INVALID_PASSWORD`: Incorrect password provided for an encrypted project.
- `PROJECT_NOT_ENCRYPTED`: Unlock request sent for a standard project.
- `ENCRYPTION_FAILED`: Technical error during encryption or decryption.
