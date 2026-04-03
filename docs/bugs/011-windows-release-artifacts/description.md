# Windows Release Artifacts Upload Fails

## Current Status

Patched; awaiting CI confirmation.

## Reported Symptoms

- The `build-windows-release` job fails in the `Upload release artifacts` step.
- GitHub Actions reports that `C:\...\artifacts` does not exist.

## Expected Behavior

- The Windows release job should build the stable Electrobun package.
- The job should upload the packaged `stable-win-x64-*` artifacts to the GitHub release.

## Actual Behavior

- The workflow originally built with `bun run build`.
- The upload step looked for `artifacts/` at the repo root.
- CI failed before any release assets were uploaded because the directory was missing.

## Reproduction

- Trigger the `release-please` workflow on `main` and wait for the `build-windows-release` job.
- The failure appeared during artifact discovery in the upload step.

## Affected Area

- `.github/workflows/release-please.yml`

## Constraints

- Preserve the existing `stable-win-x64-*` release asset naming.
- Keep the workflow aligned with Electrobun's release output layout.

## Open Questions

- Should the release job call `bun run build:stable` or invoke `electrobun build --env=stable` directly?
- Is any additional setup needed to make Electrobun emit the `artifacts/` directory in CI?
