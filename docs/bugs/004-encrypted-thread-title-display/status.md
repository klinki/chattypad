# Status: Encrypted thread title displayed in sidebar

**Status**: Fixed
**Date**: 2026-03-19

## Summary
The sidebar was displaying raw encrypted Base64 strings instead of decrypted thread titles because the snapshot generation was synchronous and lacked decryption logic. This was also causing a frontend crash when the renderer received unresolved `Promise` objects.

## Resolution
- Refactored the entire backend snapshot generation to be asynchronous.
- Added in-memory decryption for thread titles in the sidebar.
- Fixed frontend `TypeError` by adding defensive guards and optional chaining.

## Verification
- [x] Verified thread titles in the sidebar are human-readable when the project is unlocked.
- [x] Verified the application no longer crashes when opening or creating threads.
