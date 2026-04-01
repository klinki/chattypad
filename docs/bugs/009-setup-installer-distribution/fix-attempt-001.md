# Fix Attempt 001

## Goal

Replace the current Windows release upload path with the Electrobun-generated distributable artifacts so users receive a working installer package.

## Proposed Change

- Update `.github/workflows/release-please.yml` to upload files from `artifacts/` instead of repackaging the `build/` directory.
- Prefer the packaged `stable-win-x64-chattypad-Setup.zip` output that Electrobun already creates.
- Upload the companion `stable-win-x64-update.json` and `.tar.zst` artifacts if they are present, matching the working release pattern from `project-wm`.

## Risks

- The release asset names may differ slightly if Electrobun changes its naming convention.
- Uploading the wrong artifact subset could leave release consumers without update metadata.

## Files And Components

- `.github/workflows/release-please.yml`
- Electrobun Windows release artifact output under `artifacts/`

## Verification Plan

- Inspect the workflow after the patch to ensure it uploads from `artifacts/`.
- Run local build verification if feasible and confirm the packaged zip exists.
- Keep the workflow focused on the packaged installer assets rather than the raw self-extractor exe.

## Implementation Summary

- Updated `.github/workflows/release-please.yml` so the Windows release job builds the app and uploads the Electrobun-generated artifacts from `artifacts/`.
- The workflow now targets the packaged `stable-win-x64-*` outputs, which include the distributable zip instead of the raw self-extractor wrapper.
- The release upload now follows the same shape as the working `project-wm` release pipeline.

## Test Results

- Confirmed locally that `artifacts/` contains `stable-win-x64-chattypad-Setup.zip`, `stable-win-x64-chattypad.tar.zst`, and `stable-win-x64-update.json`.
- `npm run lint` passed after the workflow change.

## Outcome

- The release workflow now points at the packaged installer bundle rather than the bare `chattypad-Setup.exe` wrapper.

## Remaining Gaps

- The fix still needs user confirmation in a real release download flow.
- The repo still has unrelated uncommitted worktree changes that were intentionally left untouched.
