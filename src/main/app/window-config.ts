export type WindowMode = "native" | "frameless";

export interface WindowStyleMask {
  Borderless: boolean;
  Resizable: boolean;
  Titled: boolean;
  Closable: boolean;
  Miniaturizable: boolean;
}

export interface WindowConfig {
  renderer: "native" | "cef";
  titleBarStyle: "default" | "hidden" | "hiddenInset";
  transparent: boolean;
  styleMask: WindowStyleMask;
  useCustomHeader: boolean;
  windowMode: WindowMode;
}

const framelessStyleMask: WindowStyleMask = {
  Borderless: true,
  Resizable: true,
  Titled: true,
  Closable: true,
  Miniaturizable: true,
};

const nativeChromeStyleMask: WindowStyleMask = {
  Borderless: false,
  Resizable: true,
  Titled: true,
  Closable: true,
  Miniaturizable: true,
};

export function resolveWindowConfig(
  platform: NodeJS.Platform,
  requestedMode?: WindowMode
): WindowConfig {
  const windowsMode: WindowMode = requestedMode ?? "native";

  if (platform === "win32" && windowsMode === "native") {
    return {
      renderer: "native",
      titleBarStyle: "default",
      transparent: false,
      styleMask: { ...nativeChromeStyleMask },
      useCustomHeader: false,
      windowMode: "native",
    };
  }

  if (platform === "win32" && windowsMode === "frameless") {
    return {
      renderer: "native",
      titleBarStyle: "hidden",
      transparent: false,
      styleMask: { ...framelessStyleMask },
      useCustomHeader: true,
      windowMode: "frameless",
    };
  }

  return {
    // Keep the current frameless path outside Windows, where it has been more stable.
    renderer: "cef",
    titleBarStyle: "hiddenInset",
    transparent: true,
    styleMask: { ...framelessStyleMask },
    useCustomHeader: true,
    windowMode: "frameless",
  };
}
