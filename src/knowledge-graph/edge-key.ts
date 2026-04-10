import type { GraphEdge } from "./types.js";

/** Stable key for comparing edges across graph snapshots. */
export function graphEdgeKey(e: Pick<GraphEdge, "fromPageId" | "toPageId" | "headingAnchor">): string {
  return `${e.fromPageId}\0${e.toPageId}\0${e.headingAnchor ?? ""}`;
}
