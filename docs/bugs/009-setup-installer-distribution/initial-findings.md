# Initial Findings

## Confirmed Facts

- The local Electrobun build output for ChattyPad includes a tiny `build/stable-win-x64/chattypad-Setup.exe` wrapper and a large `chattypad-Setup.tar.zst` payload.
- Electrobun also writes the user-facing distributable zip into `artifacts/stable-win-x64-chattypad-Setup.zip`.
- The current ChattyPad release workflow uploads files from `build/` using a custom `Compress-Archive` step instead of uploading Electrobun's artifact bundle.
- The working `project-wm` repo uploads the release assets from its Electrobun `artifacts/` directory, including the packaged Windows zip.

## Likely Cause

- The release workflow is publishing the wrong Windows file set.
- The standalone `.exe` wrapper is not the distributable package users should run on its own.

## Unknowns

- Whether the release issue is only the wrong asset selection, or also stale artifact generation in the current build tree.
- Whether the release should upload only the zip or the full Electrobun artifact set.

## Reproduction Status

- Confirmed by local artifact inspection.
- The invalid installer behavior matches the user report when the standalone wrapper is executed outside its expected package context.

## Evidence Gathered

- `artifacts/stable-win-x64-chattypad-Setup.zip` exists locally and is the packaged release artifact.
- `build/stable-win-x64/chattypad-Setup.exe` is only about 424 kB, while the corresponding `.tar.zst` is about 32 MB.
- `project-wm` uses the Electrobun artifact folder for release uploads instead of repackaging the build tree manually.
