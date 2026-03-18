import type { WindowFrame } from "../../shared/contracts/workspace.js";

export type ResizeEdge =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

const MIN_WIDTH = 720;
const MIN_HEIGHT = 520;

export function computeResizedWindowFrame(
  frame: WindowFrame,
  edge: ResizeEdge,
  deltaX: number,
  deltaY: number
): WindowFrame {
  let nextX = frame.x;
  let nextY = frame.y;
  let nextWidth = frame.width;
  let nextHeight = frame.height;

  if (edge.includes("e")) {
    nextWidth = Math.max(MIN_WIDTH, frame.width + deltaX);
  }

  if (edge.includes("s")) {
    nextHeight = Math.max(MIN_HEIGHT, frame.height + deltaY);
  }

  if (edge.includes("w")) {
    const proposedWidth = frame.width - deltaX;
    nextWidth = Math.max(MIN_WIDTH, proposedWidth);
    nextX = frame.x + (frame.width - nextWidth);
  }

  if (edge.includes("n")) {
    const proposedHeight = frame.height - deltaY;
    nextHeight = Math.max(MIN_HEIGHT, proposedHeight);
    nextY = frame.y + (frame.height - nextHeight);
  }

  return {
    x: Math.round(nextX),
    y: Math.round(nextY),
    width: Math.round(nextWidth),
    height: Math.round(nextHeight),
  };
}
