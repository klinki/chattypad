import type { IpcError } from "../../shared/contracts/workspace.js";

export interface WorkspaceShellStateInput {
  isLoading: boolean;
  error: IpcError | null;
  hasSnapshot: boolean;
}

export type WorkspaceShellRenderMode =
  | "loading"
  | "full-error"
  | "shell-with-main-error"
  | "shell";

export function getWorkspaceShellRenderMode({
  isLoading,
  error,
  hasSnapshot,
}: WorkspaceShellStateInput): WorkspaceShellRenderMode {
  if (isLoading) {
    return "loading";
  }

  if (!error) {
    return "shell";
  }

  return hasSnapshot ? "shell-with-main-error" : "full-error";
}
