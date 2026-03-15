# UI and UX Bugs

## 1. Frameless Window Resizing and Native OS Chrome Glitches (Windows)
**Description:** 
When using a custom React header to replace the default OS window chrome, the window loses native interactions such as edge-resizing and Aero Snapping. However, attempting to restore these native interactions introduces visual glitches (like a 1-2px solid white top border drawn by the Windows Desktop Window Manager).

**Approaches Taken to Fix:**
1. **`titleBarStyle: "hidden"`**: Successfully removed all ugly native OS chrome, but completely stripped `WS_THICKFRAME`, breaking all edge resizing and window snapping.
2. **`titleBarStyle: "hiddenInset"` + `styleMask: { Resizable: true }`**: Restored resizing and snapping hit-boxes, but DWM forced a white border to render at the top of the window.
3. **`transparent: true`**: We attempted to enable transparency to force Windows into a layered window compositing mode. This was intended to drop the solid borders while retaining the invisible resize handles. 
4. **Altering `Titled: false/true`**: Toggling specific `styleMask` flags in conjunction with the above settings resulted in inconsistent behavior (either the border returned, or resizing broke again).

**Current Status:**
We reverted back to the combination of `hiddenInset` with `transparent: true`. It provides a workable middle-ground, but the ideal "fully resizable + perfectly frameless without artifacts" state remains elusive. This is likely a deeper limitation/bug in how the Electrobun framework handles Windows native `HWND` styles and DWM rendering.

---

## 2. Blurry Text / DPI Scaling Issues (Windows)
**Description:**
The text in the UI does not look crystal clear and appears slightly washed out or blurry. This is commonly associated with CSS antialiasing overrides or the underlying webview failing to properly respect the monitor's high-DPI scaling factor.

**Approaches Taken to Fix:**
1. **CSS Text Rendering Overrides**: We removed `-webkit-font-smoothing: antialiased;` and `-moz-osx-font-smoothing: grayscale;` from `src/renderer/index.html` and set them to `auto`. 
   * *Reasoning*: On Windows Chromium environments, forcing `antialiased` disables the native ClearType (subpixel) rendering pipeline, causing fonts to look thin and out of focus on standard DPI displays.

**Current Status:**
While the CSS fix removes the grayscale override, the blurriness may persist if Electrobun's underlying webview (CEF/WebKit) is not launching with the correct DPI awareness flags on Windows. Further investigation is needed into Electrobun's native backend configuration (e.g., DPI manifests or runtime launch arguments) to fully resolve crisp rendering on all monitor scales.