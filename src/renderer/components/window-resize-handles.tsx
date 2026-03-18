import React, { useEffect, useRef } from "react";
import { workspaceIpcClient } from "../ipc/workspace-client.js";
import type { WindowFrame } from "../../shared/contracts/workspace.js";
import {
  computeResizedWindowFrame,
  type ResizeEdge,
} from "./window-resize-utils.js";

interface ResizeSession {
  edge: ResizeEdge;
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startFrame: WindowFrame;
}

const HANDLE_THICKNESS = 6;
const RESIZE_FRAME_INTERVAL_MS = 33;

export function WindowResizeHandles(): React.ReactElement {
  const sessionRef = useRef<ResizeSession | null>(null);
  const latestFrameRef = useRef<WindowFrame | null>(null);
  const appliedFrameRef = useRef<WindowFrame | null>(null);
  const requestInFlightRef = useRef(false);
  const flushTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }

      latestFrameRef.current = computeResizedWindowFrame(
        session.startFrame,
        session.edge,
        event.screenX - session.startPointerX,
        event.screenY - session.startPointerY
      );
      scheduleFlush();
    };

    const handlePointerUp = (event: PointerEvent) => {
      const session = sessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      sessionRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      clearScheduledFlush();
      void flushLatestFrame();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      clearScheduledFlush();
    };
  }, []);

  async function flushLatestFrame(): Promise<void> {
    if (requestInFlightRef.current) {
      return;
    }

    const nextFrame = latestFrameRef.current;
    if (!nextFrame || framesEqual(nextFrame, appliedFrameRef.current)) {
      return;
    }

    requestInFlightRef.current = true;

    try {
      await workspaceIpcClient.setWindowFrame(nextFrame);
      appliedFrameRef.current = nextFrame;
    } finally {
      requestInFlightRef.current = false;
      if (latestFrameRef.current && !framesEqual(latestFrameRef.current, appliedFrameRef.current)) {
        scheduleFlush(true);
      }
    }
  }

  function scheduleFlush(immediate = false): void {
    if (flushTimeoutRef.current !== null && !immediate) {
      return;
    }

    clearScheduledFlush();
    flushTimeoutRef.current = window.setTimeout(() => {
      flushTimeoutRef.current = null;
      void flushLatestFrame();
    }, immediate ? 0 : RESIZE_FRAME_INTERVAL_MS);
  }

  function clearScheduledFlush(): void {
    if (flushTimeoutRef.current !== null) {
      window.clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
  }

  async function beginResize(edge: ResizeEdge, event: React.PointerEvent<HTMLDivElement>) {
    const frameResult = await workspaceIpcClient.getWindowFrame();
    if (!frameResult.success) {
      return;
    }

    sessionRef.current = {
      edge,
      pointerId: event.pointerId,
      startPointerX: event.screenX,
      startPointerY: event.screenY,
      startFrame: frameResult.data,
    };
    latestFrameRef.current = frameResult.data;
    appliedFrameRef.current = frameResult.data;
    document.body.style.cursor = cursorByEdge[edge];
    document.body.style.userSelect = "none";
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  return (
    <>
      {resizeHandles.map((handle) => (
        <div
          key={handle.edge}
          onPointerDown={(event) => {
            void beginResize(handle.edge, event);
          }}
          style={{
            position: "fixed",
            ...handle.style,
            cursor: cursorByEdge[handle.edge],
            zIndex: 1000,
            WebkitAppRegion: "no-drag",
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

const resizeHandles: Array<{ edge: ResizeEdge; style: React.CSSProperties }> = [
  {
    edge: "n",
    style: {
      top: 0,
      left: HANDLE_THICKNESS,
      right: HANDLE_THICKNESS,
      height: HANDLE_THICKNESS,
    },
  },
  {
    edge: "s",
    style: {
      bottom: 0,
      left: HANDLE_THICKNESS,
      right: HANDLE_THICKNESS,
      height: HANDLE_THICKNESS,
    },
  },
  {
    edge: "e",
    style: {
      top: HANDLE_THICKNESS,
      right: 0,
      bottom: HANDLE_THICKNESS,
      width: HANDLE_THICKNESS,
    },
  },
  {
    edge: "w",
    style: {
      top: HANDLE_THICKNESS,
      left: 0,
      bottom: HANDLE_THICKNESS,
      width: HANDLE_THICKNESS,
    },
  },
  {
    edge: "ne",
    style: { top: 0, right: 0, width: HANDLE_THICKNESS * 2, height: HANDLE_THICKNESS * 2 },
  },
  {
    edge: "nw",
    style: { top: 0, left: 0, width: HANDLE_THICKNESS * 2, height: HANDLE_THICKNESS * 2 },
  },
  {
    edge: "se",
    style: { bottom: 0, right: 0, width: HANDLE_THICKNESS * 2, height: HANDLE_THICKNESS * 2 },
  },
  {
    edge: "sw",
    style: { bottom: 0, left: 0, width: HANDLE_THICKNESS * 2, height: HANDLE_THICKNESS * 2 },
  },
];

const cursorByEdge: Record<ResizeEdge, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
};

function framesEqual(a: WindowFrame | null, b: WindowFrame | null): boolean {
  return (
    a?.x === b?.x &&
    a?.y === b?.y &&
    a?.width === b?.width &&
    a?.height === b?.height
  );
}
