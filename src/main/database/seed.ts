/**
 * Development seed data for manual workspace validation.
 * Provides pre-populated projects, threads, and messages for quickstart flows.
 * 
 * NOTE: This function is no longer called automatically during application bootstrap
 * to ensure a clean onboarding experience for new users. It should only be used
 * for manual development or testing purposes.
 */
import type { Database } from "bun:sqlite";
import { insertProject, insertThread, insertMessage, insertProjectGroup } from "./workspace-repository.js";
import type { Project, ChatThread, Message, ProjectGroup } from "../../shared/models/workspace.js";

function isoNow(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

export function seedDevelopmentData(db: Database): void {
  // Idempotent: only seed if no projects exist
  const existing = db.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM projects").get();
  if ((existing?.count ?? 0) > 0) return;

  const groups: ProjectGroup[] = [
    { id: "grp-001", name: "Client Work", sortOrder: 0, createdAt: isoNow(-86400000 * 8), updatedAt: isoNow(-86400000 * 8) },
    { id: "grp-002", name: "Internal", sortOrder: 1, createdAt: isoNow(-86400000 * 8), updatedAt: isoNow(-86400000 * 8) },
  ];

  const projects: Project[] = [
    { id: "proj-001", name: "Work Research", sortOrder: 0, groupId: "grp-001", isCollapsed: false, isEncrypted: false, passwordHash: null, encryptionSalt: null, createdAt: isoNow(-86400000 * 7), updatedAt: isoNow(-86400000 * 2) },
    { id: "proj-002", name: "Personal Notes", sortOrder: 1, groupId: null, isCollapsed: false, isEncrypted: false, passwordHash: null, encryptionSalt: null, createdAt: isoNow(-86400000 * 5), updatedAt: isoNow(-86400000 * 1) },
    { id: "proj-003", name: "Side Projects", sortOrder: 2, groupId: "grp-002", isCollapsed: true, isEncrypted: false, passwordHash: null, encryptionSalt: null, createdAt: isoNow(-86400000 * 3), updatedAt: isoNow(-3600000) },
  ];

  const threads: ChatThread[] = [
    { id: "thread-001", projectId: "proj-001", title: "AI model comparisons", sortOrder: 0, createdAt: isoNow(-86400000 * 6), updatedAt: isoNow(-86400000 * 2), lastMessageAt: isoNow(-86400000 * 2) },
    { id: "thread-002", projectId: "proj-001", title: "Database benchmarks", sortOrder: 1, createdAt: isoNow(-86400000 * 4), updatedAt: isoNow(-86400000 * 1), lastMessageAt: isoNow(-86400000 * 1) },
    { id: "thread-003", projectId: "proj-001", title: "Architecture decisions", sortOrder: 2, createdAt: isoNow(-86400000 * 2), updatedAt: isoNow(-3600000), lastMessageAt: isoNow(-3600000) },
    { id: "thread-004", projectId: "proj-002", title: "Weekly goals", sortOrder: 0, createdAt: isoNow(-86400000 * 4), updatedAt: isoNow(-86400000 * 3), lastMessageAt: isoNow(-86400000 * 3) },
    { id: "thread-005", projectId: "proj-002", title: "Book reading list", sortOrder: 1, createdAt: isoNow(-86400000 * 2), updatedAt: isoNow(-7200000), lastMessageAt: isoNow(-7200000) },
    { id: "thread-006", projectId: "proj-003", title: "ChattyPad feature ideas", sortOrder: 0, createdAt: isoNow(-86400000 * 1), updatedAt: isoNow(-1800000), lastMessageAt: isoNow(-1800000) },
    { id: "thread-007", projectId: "proj-003", title: "Tech debt tracker", sortOrder: 1, createdAt: isoNow(-86400000 * 1), updatedAt: isoNow(-900000), lastMessageAt: null },
  ];

  const messages: Message[] = [
    { id: "msg-001", threadId: "thread-001", role: "user", content: "Compare GPT-4o and Claude Sonnet for code generation tasks.", sequenceNumber: 1, createdAt: isoNow(-86400000 * 6) },
    { id: "msg-002", threadId: "thread-001", role: "assistant", content: "Both models are strong for code generation. GPT-4o tends to perform well on function completion tasks, while Claude Sonnet often produces cleaner long-form implementations.", sequenceNumber: 2, createdAt: isoNow(-86400000 * 6 + 5000) },
    { id: "msg-003", threadId: "thread-001", role: "user", content: "What about handling edge cases in TypeScript?", sequenceNumber: 3, createdAt: isoNow(-86400000 * 4) },
    { id: "msg-004", threadId: "thread-001", role: "assistant", content: "For TypeScript-specific edge cases, especially around strict null checks and discriminated unions, Claude Sonnet tends to produce more predictable results in my testing.", sequenceNumber: 4, createdAt: isoNow(-86400000 * 4 + 5000) },
    { id: "msg-005", threadId: "thread-002", role: "user", content: "Which SQLite driver works best with Bun?", sequenceNumber: 1, createdAt: isoNow(-86400000 * 4) },
    { id: "msg-006", threadId: "thread-002", role: "assistant", content: "Bun has a built-in SQLite driver (bun:sqlite) that is zero-dependency and fast. It's the recommended choice for Bun-based applications.", sequenceNumber: 2, createdAt: isoNow(-86400000 * 4 + 5000) },
    { id: "msg-007", threadId: "thread-003", role: "user", content: "Should we use Electron or Electrobun for the desktop shell?", sequenceNumber: 1, createdAt: isoNow(-86400000 * 2) },
    { id: "msg-008", threadId: "thread-003", role: "assistant", content: "Given we're using Bun as our runtime, Electrobun is the natural choice. It provides a WebKit-based webview and native Bun integration for IPC.", sequenceNumber: 2, createdAt: isoNow(-86400000 * 2 + 5000) },
    { id: "msg-009", threadId: "thread-004", role: "user", content: "Goals for this week: finish the desktop app foundation.", sequenceNumber: 1, createdAt: isoNow(-86400000 * 4) },
    { id: "msg-010", threadId: "thread-004", role: "user", content: "Progress update: schema and repository done.", sequenceNumber: 2, createdAt: isoNow(-86400000 * 3) },
    { id: "msg-011", threadId: "thread-005", role: "user", content: "Currently reading: Designing Data-Intensive Applications.", sequenceNumber: 1, createdAt: isoNow(-86400000 * 2) },
    { id: "msg-012", threadId: "thread-005", role: "assistant", content: "Great choice! Chapter 3 on storage engines is especially relevant if you're working with local databases like SQLite.", sequenceNumber: 2, createdAt: isoNow(-86400000 * 2 + 5000) },
    { id: "msg-013", threadId: "thread-006", role: "user", content: "Feature idea: project color coding in the sidebar.", sequenceNumber: 1, createdAt: isoNow(-86400000 * 1) },
    { id: "msg-014", threadId: "thread-006", role: "assistant", content: "Good idea. We could add a color field to the projects table and surface it as a left border accent in the sidebar component.", sequenceNumber: 2, createdAt: isoNow(-86400000 * 1 + 5000) },
  ];

  for (let sequence = 1; sequence <= 40; sequence += 1) {
    messages.push({
      id: `msg-long-${sequence}`,
      threadId: "thread-003",
      role: sequence % 2 === 0 ? "assistant" : "user",
      content: `Long history sample message ${sequence} for scroll validation.`,
      sequenceNumber: sequence + 2,
      createdAt: isoNow(-86_400_000 + sequence * 60_000),
    });
  }

  for (const group of groups) insertProjectGroup(db, group);
  for (const project of projects) insertProject(db, project);
  for (const thread of threads) insertThread(db, thread);
  for (const message of messages) insertMessage(db, message);

  console.log(`[seed] Seeded ${groups.length} groups, ${projects.length} projects, ${threads.length} threads, ${messages.length} messages.`);
}
