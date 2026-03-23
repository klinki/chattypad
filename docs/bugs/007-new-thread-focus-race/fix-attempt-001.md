# Fix Attempt 001

## Goal
- Keep new-thread focus stable even when other snapshot-returning sidebar actions overlap.

## Proposed Change
- Preserve the renderer’s latest intended thread selection when applying a snapshot, as long as that thread still exists in the snapshot.
- Let create-thread responses explicitly seed that intended thread before the snapshot is applied.
- Update active-thread highlighting to prefer the snapshot’s selected thread id.

## Risks
- If the resolver is too aggressive, it could preserve a stale thread id after deletion or unrelated navigation.
- The fix must still allow an explicit later user thread click to take precedence.

## Files And Components
- `src/renderer/features/workspace/workspace-controller.ts`
- `src/renderer/features/workspace/workspace-screen.tsx`
- `tests/unit/workspace-controller.test.ts`

## Verification Plan
- Add a controller regression test covering overlapping snapshot responses and intended-thread preservation.
- Run `npm run lint`.

## Implementation Summary
- Updated the renderer controller to resolve snapshot focus from the latest intended thread id when that thread still exists, instead of blindly trusting every returned snapshot’s `activeThreadId`.
- Updated create-thread handling to trust the server-returned `activeThreadId` directly instead of inferring the new thread id by diffing the thread list.
- Updated sidebar active-thread highlighting to prefer `snapshot.activeThreadId` so the newly selected thread is reflected immediately.
- Added a controller regression test covering overlapping snapshot responses that would previously redirect focus away from the created thread.

## Test Results
- `bun test tests/unit/workspace-controller.test.ts` ✅
- `npm run lint` ✅

## Outcome
- Fixed. User confirmed in the desktop app on 2026-03-23 that newly created threads now stay focused correctly.

## Remaining Gaps
- None recorded.
