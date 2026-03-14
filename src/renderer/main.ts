/**
 * Renderer process entry point.
 * This file is bundled by Bun and loaded in the Electrobun WebView.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { WorkspaceScreen } from "./features/workspace/workspace-screen.js";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

root.render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(WorkspaceScreen)
  )
);
