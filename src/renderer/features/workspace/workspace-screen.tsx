/**
 * Main workspace screen: composes all workspace UI components.
 * Connects the store, controller, sidebar, thread view, and message composer.
 */
import React, { useEffect, useState, useCallback } from "react";
import { workspaceStore } from "../../state/workspace-store.js";
import { createWorkspaceController } from "./workspace-controller.js";
import { workspaceIpcClient } from "../../ipc/workspace-client.js";
import { Sidebar } from "../../components/sidebar.js";
import {
  WorkspaceShell,
  EmptyState,
  WorkspaceEmptyState,
} from "../../components/workspace-shell.js";
import { ThreadHeader } from "../../components/thread-header.js";
import { MessageHistory } from "../../components/message-history.js";
import { MessageComposer } from "../../components/message-composer.js";
import type { WorkspaceState } from "../../state/workspace-store.js";

const controller = createWorkspaceController(workspaceIpcClient);

export function WorkspaceScreen(): React.ReactElement {
  const [state, setState] = useState<WorkspaceState>(workspaceStore.getState());

  useEffect(() => {
    const unsub = workspaceStore.subscribe(setState);
    controller.loadWorkspace();
    return unsub;
  }, []);

  const handleSelectThread = useCallback((threadId: string) => {
    controller.openThread(threadId);
  }, []);

  const handleSend = useCallback(() => {
    const activeId = state.activeThread?.thread.id;
    if (!activeId) {
      return;
    }
    controller.sendMessage(activeId, state.composeText);
  }, [state.activeThread, state.composeText]);

  const sidebar = (
    <Sidebar
      projects={state.snapshot?.projects ?? []}
      threadsByProject={state.snapshot?.threadsByProject ?? {}}
      activeThreadId={state.activeThread?.thread.id ?? null}
      onSelectThread={handleSelectThread}
    />
  );

  const hasProjects = (state.snapshot?.projects.length ?? 0) > 0;

  const mainContent = state.activeThread ? (
    <>
      <ThreadHeader thread={state.activeThread.thread} />
      <MessageHistory messages={state.activeThread.messages} />
      <MessageComposer
        value={state.composeText}
        onChange={(text) => workspaceStore.setComposeText(text)}
        onSend={handleSend}
        sendError={state.sendError}
        disabled={state.isLoading}
      />
    </>
  ) : !hasProjects && !state.isLoading && !state.error ? (
    <WorkspaceEmptyState />
  ) : (
    <EmptyState />
  );

  return (
    <WorkspaceShell
      sidebar={sidebar}
      main={mainContent}
      isLoading={state.isLoading && state.snapshot === null}
      error={state.error}
    />
  );
}
