import type { GraphEdge, GraphNode, GraphStats, KnowledgeGraph } from "./types.js";
import { titleFromFirstHeading } from "./markdown-title.js";
import { parseWikiLinks } from "./parse-wikilinks.js";

export type PageDocument = {
  pageId: string;
  /** Relative path from graph root (e.g. `odaas-core.md`). */
  relativePath: string;
  markdown: string;
};

function edgeKey(e: Pick<GraphEdge, "fromPageId" | "toPageId" | "headingAnchor">): string {
  return `${e.fromPageId}\0${e.toPageId}\0${e.headingAnchor ?? ""}`;
}

/**
 * Build a knowledge graph from parsed pages. Wikilinks resolve to `{pageId}.md` in the same corpus.
 */
export function buildKnowledgeGraph(rootDir: string, pages: readonly PageDocument[]): KnowledgeGraph {
  const pageIds = new Set<string>();
  for (const p of pages) pageIds.add(p.pageId);

  const edges: GraphEdge[] = [];
  const outboundByPage = new Map<string, GraphEdge[]>();

  for (const p of pages) {
    const list: GraphEdge[] = [];
    const seen = new Set<string>();
    for (const link of parseWikiLinks(p.markdown)) {
      const broken = !pageIds.has(link.pageId);
      const edge: GraphEdge = {
        fromPageId: p.pageId,
        toPageId: link.pageId,
        headingAnchor: link.headingAnchor,
        broken,
      };
      const k = edgeKey(edge);
      if (seen.has(k)) continue;
      seen.add(k);
      list.push(edge);
      edges.push(edge);
    }
    outboundByPage.set(p.pageId, list);
  }

  const nodes = new Map<string, GraphNode>();
  for (const p of pages) {
    nodes.set(p.pageId, {
      pageId: p.pageId,
      title: titleFromFirstHeading(p.markdown, p.pageId),
      relativePath: p.relativePath,
      outbound: outboundByPage.get(p.pageId) ?? [],
    });
  }

  return {
    rootDir,
    pageIds,
    nodes,
    edges,
  };
}

export function graphStats(g: KnowledgeGraph): GraphStats {
  let brokenEdgeCount = 0;
  for (const e of g.edges) if (e.broken) brokenEdgeCount += 1;
  return {
    pageCount: g.pageIds.size,
    edgeCount: g.edges.length,
    brokenEdgeCount,
  };
}

/** Pages that have no inbound wikilink from another page in the graph. */
export function findOrphanPageIds(g: KnowledgeGraph): string[] {
  const inbound = new Set<string>();
  for (const e of g.edges) {
    if (!e.broken) inbound.add(e.toPageId);
  }
  const orphans: string[] = [];
  for (const id of g.pageIds) {
    if (!inbound.has(id)) orphans.push(id);
  }
  return orphans.sort();
}

/** Inbound edges (references) to a page. */
export function inboundEdges(g: KnowledgeGraph, toPageId: string): GraphEdge[] {
  return g.edges.filter((e) => e.toPageId === toPageId && !e.broken);
}

/** Count of non-broken inbound references per page id. */
export function inboundCounts(g: KnowledgeGraph): Map<string, number> {
  const m = new Map<string, number>();
  for (const id of g.pageIds) m.set(id, 0);
  for (const e of g.edges) {
    if (e.broken) continue;
    m.set(e.toPageId, (m.get(e.toPageId) ?? 0) + 1);
  }
  return m;
}
