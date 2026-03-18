# Data Model: Encrypted Projects

## Overview
This feature introduces a specialized "Encrypted" project type. The data model is designed to ensure that sensitive content (thread titles and message contents) is stored in an encrypted format in the SQLite database and only decrypted in-memory after valid user authentication.

## Entities

### 1. Project (Updated)
The `projects` table will be extended to include encryption-related metadata.

| Field | Type | Description |
|---|---|---|
| `is_encrypted` | INTEGER | Flag (0 or 1) indicating if the project is encrypted. |
| `password_hash` | TEXT | Salted hash of the project's password (for verification only). |
| `encryption_salt` | TEXT | Unique salt used for deriving the encryption key for this project. |

### 2. Encrypted Content
For encrypted projects, the following fields in related tables will store encrypted blobs (Base64-encoded).

#### `chat_threads` Table
| Field | Original Type | Encrypted Value |
|---|---|---|
| `title` | TEXT | AES-GCM encrypted thread title. |

#### `messages` Table
| Field | Original Type | Encrypted Value |
|---|---|---|
| `content` | TEXT | AES-GCM encrypted message content. |

## UI Representation (`ProjectSummary`)
The shared `ProjectSummary` IPC type will include a transient `isLocked` flag to inform the renderer about the project's current state.

```typescript
export interface ProjectSummary {
  id: string;
  name: string;
  sortOrder: number;
  groupId: string | null;
  isCollapsed: boolean;
  isEncrypted: boolean; // Persisted
  isLocked: boolean;    // Transient (based on session)
}
```

## Security Constraints
- **Zero-Persistence of Passwords**: The plain-text password MUST NEVER be stored on disk.
- **In-Memory Decryption**: Decrypted content is only held in-memory and MUST be cleared upon locking or application close.
- **Encryption Key Derivation**: Keys are derived from the password and project-specific salt using PBKDF2.
