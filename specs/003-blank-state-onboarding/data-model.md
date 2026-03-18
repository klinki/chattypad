# Data Model: Initial User Experience Onboarding

## Blank State Definition

The "Blank State" is a transient system state determined by the absence of user data.

### Detection Logic (FR-001)

A "Blank State" is `true` if and only if:
- `COUNT(projects) == 0` AND
- `COUNT(threads) == 0`

### Implementation Strategy

The existing `WorkspaceSnapshot` (shared via IPC) contains a list of `projects`. Since threads belong to projects in this application, `projects.length === 0` is effectively equivalent to the blank state, assuming orphans are not allowed or common.

However, to strictly satisfy **FR-001**, the check should encompass both entities.

### State Transitions (FR-004)

1. **Initialization**: On application launch, if the database is newly initialized (empty), the state is `Blank`.
2. **Transition to Data State**: As soon as a user performs an action that results in a record being created in either `projects` or `threads`, the state immediately transitions to `Data Present`.
3. **Transition to Blank State**: If a user deletes all projects and threads, the system reverts to the `Blank` state.

## Impacted Entities

No structural changes to the database schema are required. The "Blank State" is a derived property of the existing `Project` and `ChatThread` entities.
