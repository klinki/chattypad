# Bug Status

## Current State
- fixed

## Confirmation Date
- 2026-03-23

## Resolution Summary
- Investigation started on 2026-03-23.
- User confirmed on 2026-03-23 that newly created threads now remain focused correctly.

## Notes
- The final fix preserves the renderer’s intended thread across overlapping snapshot responses and trusts the server-returned `activeThreadId` for thread creation.
