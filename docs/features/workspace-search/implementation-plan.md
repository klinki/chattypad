# Workspace Search Implementation Plan

## Summary
- **Feature slug**: `workspace-search`
- **Artifact type**: `implementation-plan.md`
- **Target path**: `C:\ai-workspace\chattypad\docs\features\workspace-search\implementation-plan.md`
- Add a workspace-wide search overlay for thread titles and message text, accessible from the workspace screen via header action and `Ctrl/Cmd+K`.
- Search covers all unencrypted content plus currently unlocked encrypted projects; locked encrypted projects are excluded from results.
- Selecting a thread result opens that thread. Selecting a message result opens the thread, scrolls to the matched message, and highlights it.

## Public API / Interface Changes
- Add a new IPC channel `workspace:search`.
- Add `WorkspaceSearchRequest` with `query: string` and optional `limit`.
- Add `WorkspaceSearchResult` with enough data to render and navigate a result:
  `kind` (`thread` | `message`), `projectId`, `projectName`, `threadId`, `threadTitle`, optional `messageId`, `snippet`, and relevant timestamps for stable sorting.
- Extend the renderer client/controller/store with search state:
  overlay open/closed, query, loading/error, results, selected result id, and a one-shot `revealedMessageId` used by `MessageHistory` for scroll/highlight behavior.

## Implementation Changes
- **Database and search backend**
  - Create an SQLite FTS5 virtual table for persistent search over unencrypted thread titles and message content only.
  - Backfill the FTS table during schema/init so existing databases become searchable without manual migration steps.
  - Keep the FTS table synchronized on thread create/update, message send, and project/thread deletion.
  - Do not store plaintext search data for encrypted projects. For unlocked encrypted projects, perform an in-process decrypted scan at query time and merge those matches with FTS results.
- **Search service behavior**
  - Add a dedicated main-process search service used by the new IPC handler.
  - Treat queries shorter than 2 trimmed characters as empty and return no results.
  - Use case-insensitive term matching. No regex, fuzzy matching, or advanced operators in v1.
  - Return at most 25 results, ordered by: thread-title prefix match, thread-title substring match, message-content match; break ties by most recent activity/message timestamp.
  - Build snippets from the first match occurrence and keep them single-line and compact for overlay display.
- **Renderer UX**
  - Add a global search overlay mounted from the workspace screen, not the sidebar.
  - Opening search focuses the input immediately; `Escape` closes the overlay; selecting a result closes it after navigation succeeds.
  - Add a search trigger in the header and the `Ctrl/Cmd+K` shortcut while the workspace screen is active.
  - Reuse the existing `openThread` flow, then reveal a matched message by id in `MessageHistory` with scroll-into-view and temporary highlight styling.
  - If a result’s target message no longer exists, fall back to opening the thread without highlight rather than failing the navigation.
- **Encrypted-project rules**
  - Locked encrypted projects contribute no results and no metadata-only matches.
  - Once unlocked, their titles and messages become searchable only for the current session through decrypted in-memory scanning.

## Test Plan
- Add unit tests for search result generation, ordering, short-query behavior, snippet creation, locked encrypted exclusion, and unlocked encrypted inclusion.
- Add IPC/service tests for `workspace:search`, including FTS-backed matches and decrypted-scan matches.
- Add controller/store tests for opening the overlay, executing search, selecting a result, and preserving correct thread/message reveal state.
- Add renderer tests for `MessageHistory` reveal behavior: scroll to matched message and clear temporary highlight.
- Add integration coverage for:
  unencrypted thread-title search,
  unencrypted message-content search,
  locked encrypted project excluded,
  unlocked encrypted project included,
  selecting a message result opens the correct thread and reveals the correct message.

## Assumptions
- v1 search is available only on the workspace screen and does not apply to settings or other future screens.
- Search is intentionally simple in v1: substring/term search only, no saved searches, filters, or grouping by project.
- The current dataset size is small enough that decrypted on-demand scanning of unlocked encrypted projects is acceptable for v1, while unencrypted content uses FTS5 for responsiveness.
