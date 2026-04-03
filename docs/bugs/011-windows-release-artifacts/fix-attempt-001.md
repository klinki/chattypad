# Fix Attempt 001

## Status

Implemented locally; awaiting CI confirmation.

## Goal

Make the Windows release workflow produce the stable Electrobun artifact bundle before attempting to upload release assets.

## Relation To Previous Attempts

- This is the first attempt for this bug.
- It follows the earlier installer distribution fix, which established that the release assets should come from Electrobun's stable artifact output.

## Proposed Change

- Update `.github/workflows/release-please.yml` so the Windows release job runs `bun run build:stable`.
- Keep the upload step pointed at `artifacts/` and the `stable-win-x64-*` glob.

## Risks

- The stable build may take longer than the default build, which could slightly increase CI runtime.
- If Electrobun changes its release output layout, the upload glob could still need adjustment.

## Expected Verification

- The workflow should reach the upload step with a populated `artifacts/` directory.
- The release job should find at least one `stable-win-x64-*` artifact and upload it successfully.

## Files And Components

- `.github/workflows/release-please.yml`
- `package.json`

## Implementation Summary

- Updated `.github/workflows/release-please.yml` so the Windows release job now runs `bun run build:stable` instead of the default build.
- Kept the upload step targeting `artifacts/` and the `stable-win-x64-*` artifacts.

## Test And Verification Results

- `bun run build:stable` completed successfully locally.
- Confirmed that `artifacts/` contains `stable-win-x64-chattypad-Setup.zip`, `stable-win-x64-chattypad.tar.zst`, and `stable-win-x64-update.json`.
- The workflow file now points at the stable build command and the existing upload glob.

## Outcome

- The workflow fix is implemented locally and should no longer fail because of a missing `artifacts/` directory.

## Remaining Gaps

- CI still needs to run once to confirm the release job now uploads the artifacts successfully.
