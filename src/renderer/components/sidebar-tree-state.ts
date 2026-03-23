import type { ProjectSummary } from "../../shared/contracts/workspace.js";

export function isProjectTreeLocked(project: Pick<ProjectSummary, "isEncrypted" | "isLocked">): boolean {
  return project.isEncrypted && project.isLocked;
}

export function isProjectTreeCollapsed(
  project: Pick<ProjectSummary, "isEncrypted" | "isLocked" | "isCollapsed">
): boolean {
  return isProjectTreeLocked(project) || project.isCollapsed;
}
