# Bug Description

## Title
Windows setup installer distribution ships an invalid standalone EXE

## Status
- open

## Reported Symptoms

- The downloaded Windows setup installer is only about 400 kB.
- Running `chattypad-Setup.exe` from `C:\Downloads` fails immediately.
- The error shown is `InvalidInstaller` with the message `Not a valid self-extracting installer`.

## Expected Behavior

- The release should provide a Windows installer package that can be run directly on a Windows machine.
- The shipped asset should install ChattyPad without requiring manual file assembly.

## Actual Behavior

- The standalone `chattypad-Setup.exe` is not usable by itself.
- The executable appears to be only the small self-extractor wrapper rather than the full distributable bundle.

## Reproduction Details

1. Download the Windows installer from the current release distribution.
2. Save it to a local folder such as `C:\Downloads`.
3. Run `.\chattypad-Setup.exe`.
4. Observe the `InvalidInstaller` failure.

## Affected Area

- Windows release packaging
- GitHub Actions release upload
- Electrobun distribution artifact selection

## Constraints

- The fix should preserve the Windows release flow.
- The release asset should remain a simple user-facing download.
- The workflow must continue to produce a release on `main`.

## Open Questions

- Should the release upload only the installer zip, or also include the companion `.tar.zst` and `update.json` artifacts?
- Is the current release workflow uploading the wrong file, or is the installer bundle itself incomplete?
