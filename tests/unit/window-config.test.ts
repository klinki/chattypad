import { describe, expect, test } from "bun:test";
import { resolveWindowConfig } from "../../src/main/app/window-config.js";

describe("resolveWindowConfig", () => {
  test("uses native Windows chrome by default", () => {
    const config = resolveWindowConfig("win32");

    expect(config.renderer).toBe("native");
    expect(config.titleBarStyle).toBe("default");
    expect(config.transparent).toBe(false);
    expect(config.styleMask.Borderless).toBe(false);
    expect(config.styleMask.Resizable).toBe(true);
    expect(config.useCustomHeader).toBe(false);
    expect(config.windowMode).toBe("native");
  });

  test("supports a Windows frameless experiment without transparency", () => {
    const config = resolveWindowConfig("win32", "frameless");

    expect(config.renderer).toBe("native");
    expect(config.titleBarStyle).toBe("hidden");
    expect(config.transparent).toBe(false);
    expect(config.styleMask.Borderless).toBe(true);
    expect(config.useCustomHeader).toBe(true);
    expect(config.windowMode).toBe("frameless");
  });

  test("keeps the custom frameless setup on non-Windows platforms", () => {
    const darwin = resolveWindowConfig("darwin");
    const linux = resolveWindowConfig("linux");

    expect(darwin.renderer).toBe("cef");
    expect(darwin.titleBarStyle).toBe("hiddenInset");
    expect(darwin.useCustomHeader).toBe(true);
    expect(darwin.windowMode).toBe("frameless");
    expect(linux.renderer).toBe("cef");
    expect(linux.titleBarStyle).toBe("hiddenInset");
    expect(linux.useCustomHeader).toBe(true);
    expect(linux.windowMode).toBe("frameless");
  });
});
