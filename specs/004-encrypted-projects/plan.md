# Implementation Plan: Encrypted Projects

**Branch**: `004-encrypted-projects` | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-encrypted-projects/spec.md`

## Summary
The "Encrypted Projects" feature adds a layer of security to ChattyPad by allowing users to create password-protected projects. Sensitive content (thread titles and message contents) is encrypted using AES-GCM with keys derived from the user's password using PBKDF2. This ensures that even if the database file is compromised, the content remains unreadable without the correct password.

## Technical Context

**Language/Version**: TypeScript / Bun 1.x
**Primary Dependencies**: Bun native `crypto` (Web Crypto API), React, SQLite (`bun:sqlite`), Electrobun
**Storage**: SQLite (`chattypad.db`)
**Testing**: Bun test runner (`bun test`)
**Target Platform**: Desktop (Windows/macOS/Linux via Electrobun)
**Project Type**: Desktop Application
**Performance Goals**: Decryption < 500ms, UI updates < 100ms
**Constraints**: Zero-persistence of plain-text passwords, in-memory decryption only.
**Scale/Scope**: Local-only encryption, individual project locks.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Specification-First Delivery**: `spec.md` exists and is reviewed.
- [x] **II. Independent, Testable User Value**: User stories are prioritized (P1, P2) and independently testable.
- [x] **III. Explicit Assumptions and Traceability**: Research decisions and data model map back to requirements.
- [x] **IV. Simplicity with Justified Complexity**: Bun's native crypto is used to minimize external dependencies.
- [x] **V. Documentation and Agent Context Sync**: `research.md`, `data-model.md`, and `quickstart.md` generated.

## Project Structure

### Documentation (this feature)

```text
specs/004-encrypted-projects/
├── plan.md              # This file
├── research.md          # Encryption and timeout strategy
├── data-model.md        # Database schema and security constraints
├── quickstart.md        # Integration scenarios and verification
├── contracts/           # IPC updates for lock/unlock
└── tasks.md             # Implementation tasks (Phase 2)
```

### Source Code (repository root)

```text
src/
├── main/
│   ├── app/
│   │   └── main.ts              # IPC registration for lock/unlock
│   ├── database/
│   │   ├── schema.ts            # Migration for projects table
│   │   └── workspace-repository.ts # Encrypted data access logic
├── renderer/
│   ├── components/
│   │   ├── sidebar.tsx          # Lock icons and encrypted project UI
│   │   └── lock-screen.tsx      # Password entry UI for projects
│   ├── features/
│   │   └── workspace/
│   │       ├── workspace-controller.ts # IPC calls for lock/unlock
│   │       └── workspace-screen.tsx # Timeout logic and activity tracking
├── shared/
│   ├── contracts/
│   │   └── workspace.ts         # IPC types for encrypted projects
│   ├── crypto/
│   │   └── crypto-service.ts    # Key derivation and encryption logic (Shared for main/renderer)
│   └── models/
│       └── workspace.ts         # Data models for encrypted projects
```

**Structure Decision**: Option 1: Single project (DEFAULT).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | N/A        | N/A                                 |
