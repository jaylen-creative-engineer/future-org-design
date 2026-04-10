import { graphEdgeKey } from "./edge-key.js";
import type { GraphEdge, KnowledgeGraph } from "./types.js";

export type KnowledgeGraphDiff = {
  /** Pages present in `after` but not in `before`. */
  addedPageIds: string[];
  /** Pages present in `before` but not in `after`. */
  removedPageIds: string[];
  /** Shared pages whose display title changed. */
  titleChanges: readonly { pageId: string; before: string; after: string }[];
  /** Edges in `after` with no matching edge key in `before`. */
  addedEdges: GraphEdge[];
  /** Edges in `before` with no matching edge key in `after`. */
  removedEdges: GraphEdge[];
  /** Same edge key in both graphs but `broken` flag differs. */
  brokenFlagChanges: readonly { edge: GraphEdge; beforeBroken: boolean; afterBroken: boolean }[];
};

function edgeMap(edges: readonly GraphEdge[]): Map<string, GraphEdge> {
  const m = new Map<string, GraphEdge>();
  for (const e of edges) {
    m.set(graphEdgeKey(e), e);
  }
  return m;
}

function sortPageIds(ids: Iterable<string>): string[] {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

/**
 * Compare two graphs loaded from the same or different corpuses.
 * Edge identity is `(fromPageId, toPageId, headingAnchor)`; order of the `edges` arrays does not matter.
 */
export function diffKnowledgeGraphs(before: KnowledgeGraph, after: KnowledgeGraph): KnowledgeGraphDiff {
  const beforeIds = before.pageIds;
  const afterIds = after.pageIds;

  const addedPageIds: string[] = [];
  const removedPageIds: string[] = [];
  for (const id of afterIds) if (!beforeIds.has(id)) addedPageIds.push(id);
  for (const id of beforeIds) if (!afterIds.has(id)) removedPageIds.push(id);
  sortPageIds(addedPageIds);
  sortPageIds(removedPageIds);

  const titleChanges: { pageId: string; before: string; after: string }[] = [];
  for (const id of beforeIds) {
    if (!afterIds.has(id)) continue;
    const nb = before.nodes.get(id);
    const na = after.nodes.get(id);
    if (!nb || !na) continue;
    if (nb.title !== na.title) titleChanges.push({ pageId: id, before: nb.title, after: na.title });
  }
  titleChanges.sort((a, b) => a.pageId.localeCompare(b.pageId));

  const beforeE = edgeMap(before.edges);
  const afterE = edgeMap(after.edges);

  const addedEdges: GraphEdge[] = [];
  const removedEdges: GraphEdge[] = [];
  const brokenFlagChanges: { edge: GraphEdge; beforeBroken: boolean; afterBroken: boolean }[] = [];

  for (const [k, e] of afterE) {
    const ob = beforeE.get(k);
    if (!ob) addedEdges.push(e);
    else if (ob.broken !== e.broken) brokenFlagChanges.push({ edge: e, beforeBroken: ob.broken, afterBroken: e.broken });
  }
  for (const [k, e] of beforeE) {
    if (!afterE.has(k)) removedEdges.push(e);
  }

  addedEdges.sort((a, b) => graphEdgeKey(a).localeCompare(graphEdgeKey(b)));
  removedEdges.sort((a, b) => graphEdgeKey(a).localeCompare(graphEdgeKey(b)));
  brokenFlagChanges.sort((a, b) => graphEdgeKey(a.edge).localeCompare(graphEdgeKey(b.edge)));

  return {
    addedPageIds,
    removedPageIds,
    titleChanges,
    addedEdges,
    removedEdges,
    brokenFlagChanges,
  };
}
