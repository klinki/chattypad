# Bug Status

## Current State

fixed

## Confirmation Date

2026-04-02

## Resolution Summary

The Windows launcher icon and live window title-bar icon were fixed by:

- Generating a proper multi-frame Windows ICO with a readable 16px bubble icon.
- Applying the icon to the launcher and installer during the Electrobun build.
- Setting the native Windows window icon directly on the HWND at startup for `npm run start`.

## Notes

Confirmed by the user on Windows.
