# chattypad Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-14

## Active Technologies

- TypeScript (strict mode) on Bun runtime + Electrobun, Bun standard runtime libraries, SQLite client library for local persistence (001-desktop-chat-app)

## Project Structure

```text
src/
├── main/
│   ├── app/          # Main-process services (workspace-service, message-service, main entry)
│   ├── database/     # SQLite schema, repositories, seed data
│   └── ipc/          # IPC handler registration (workspace-ipc)
├── renderer/
│   ├── components/   # Sidebar, MessageHistory, MessageComposer, ThreadHeader, WorkspaceShell
│   ├── features/     # workspace/ (WorkspaceScreen, workspace-controller)
│   ├── ipc/          # Renderer-side IPC client (workspace-client)
│   └── state/        # workspace-store (event-emitter state)
└── shared/
    ├── contracts/    # IPC data shapes (WorkspaceSnapshot, ActiveThreadDetail, IpcResult)
    └── models/       # Domain entities (Project, ChatThread, Message)

tests/
├── integration/      # workspace-navigation, thread-history, message-send
└── unit/             # workspace-repository, message-service
```

## Commands

npm test; npm run lint

## Code Style

TypeScript (strict mode) on Bun runtime: Follow standard conventions

## Key Implementation Decisions (001-desktop-chat-app)

- **Database**: `bun:sqlite` (built-in, zero-dependency). WAL mode + foreign keys enabled. Schema in `src/main/database/schema.ts`.
- **IPC**: `src/main/ipc/workspace-ipc.ts` now exports plain test handlers plus the Electrobun request-handler map consumed by `defineElectrobunRPC("bun", ...)` in `src/main/app/main.ts`.
- **Renderer IPC client**: `src/renderer/ipc/workspace-client.ts` bootstraps `Electroview` from `electrobun/view` and falls back to `IPC_BRIDGE_UNAVAILABLE` when not running inside an Electrobun webview.
- **Renderer build output**: `npm run build` now copies `src/renderer/index.html` into `dist/renderer/index.html`, and `npm start` builds the renderer before launching the main process so the desktop shell can load the expected HTML file.
- **Seed data**: `src/main/database/seed.ts` is idempotent (skips if projects exist); it seeds 3 projects, 7 threads, an empty thread, and an extended message history for manual validation.
- **Error handling**: All IPC results use `IpcResult<T>` discriminated union (`{ success: true, data }` | `{ success: false, error }`). All errors carry `code`, `message`, `recoverable`.
- **Renderer state**: `workspace-store.ts` uses a lightweight event-emitter pattern — no external state library needed.

## Recent Changes

- 001-desktop-chat-app: Added TypeScript (strict mode) on Bun runtime + Electrobun, Bun standard runtime libraries, SQLite client library for local persistence
- 001-desktop-chat-app: Implemented the desktop workspace feature structure, SQLite persistence, IPC plumbing, renderer state/components, and Bun test coverage scaffolding
- 001-desktop-chat-app: Validation completed with `npm run lint`; `npm test` and manual Electrobun quickstart flows still require a Bun-capable desktop environment
- 001-desktop-chat-app: Replaced Electrobun comments/stubs with real BrowserWindow/RPC wiring, ensured renderer builds copy `index.html`, and kept message-send DB failures inside the IPC error contract

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
