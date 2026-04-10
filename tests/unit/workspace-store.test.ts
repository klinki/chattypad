import { beforeEach, describe, expect, test } from "bun:test";
import { workspaceStore } from "../../src/renderer/state/workspace-store.js";

describe("workspaceStore", () => {
  beforeEach(() => {
    workspaceStore.reset();
  });

  test("setActiveThread syncs the decrypted thread title into the sidebar snapshot", () => {
    workspaceStore.setSnapshot({
      projectGroups: [],
      projects: [
        {
          id: "p1",
          name: "Secret",
          sortOrder: 0,
          groupId: null,
          isCollapsed: false,
          isEncrypted: true,
          isLocked: false,
          encryptionSalt: null,
        },
      ],
      threadsByProject: {
        p1: [
          {
            id: "t1",
            projectId: "p1",
            title: "[Encrypted Content]",
            sortOrder: 0,
            lastMessageAt: null,
          },
        ],
      },
      activeThreadId: "t1",
    });

    workspaceStore.setActiveThread({
      thread: {
        id: "t1",
        projectId: "p1",
        title: "Recovered note title",
        sortOrder: 0,
        lastMessageAt: "2026-03-23T10:00:00.000Z",
      },
      messages: [],
    });

    const state = workspaceStore.getState();
    expect(state.snapshot?.threadsByProject["p1"]?.[0]?.title).toBe("Recovered note title");
    expect(state.snapshot?.threadsByProject["p1"]?.[0]?.lastMessageAt).toBe(
      "2026-03-23T10:00:00.000Z"
    );
  });

  test("setActiveThread can carry a one-shot revealed message id", () => {
    workspaceStore.setSnapshot({
      projectGroups: [],
      projects: [],
      threadsByProject: {},
      activeThreadId: null,
    });

    workspaceStore.setActiveThread(
      {
        thread: {
          id: "t1",
          projectId: "p1",
          title: "Reveal target",
          sortOrder: 0,
          lastMessageAt: null,
        },
        messages: [
          {
            id: "m2",
            threadId: "t1",
            role: "user",
            content: "Scroll here",
            createdAt: "2026-04-07T10:00:00.000Z",
            sequenceNumber: 1,
          },
        ],
      },
      { revealedMessageId: "m2" }
    );

    expect(workspaceStore.getState().revealedMessageId).toBe("m2");
  });
});
