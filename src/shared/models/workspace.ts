/**
 * Domain model types for the ChattyPad workspace.
 * These represent the persisted entities in the SQLite database.
 */

export type MessageRole = "user" | "assistant" | "system";

export const MESSAGE_ROLES: ReadonlySet<MessageRole> = new Set(["user", "assistant", "system"]);

export interface ProjectGroup {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  sortOrder: number;
  groupId: string | null;
  isCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatThread {
  id: string;
  projectId: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
}

export interface Message {
  id: string;
  threadId: string;
  role: MessageRole;
  content: string;
  sequenceNumber: number;
  createdAt: string;
}
