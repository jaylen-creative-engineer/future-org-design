import { buildKnowledgeGraph } from "./build-graph.js";
import type { PageDocument } from "./build-graph.js";
import type { IntelligencePlan } from "./intelligence-progress.js";
import type { GraphEdge, KnowledgeGraph } from "./types.js";

/** Current on-disk format for `docs/knowledge-graph-view/knowledge-graph.json`. */
export const KNOWLEDGE_GRAPH_PUBLIC_JSON_VERSION = 2 as const;

/** Legacy snapshot: wiki pages only (no intelligence plan). */
export type KnowledgeGraphPublicJsonV1 = {
  version: 1;
  pages: readonly KnowledgeGraphPublicPage[];
};

/** Wiki graph plus the same intelligence plan snapshot used by the HTML viewer. */
export type KnowledgeGraphPublicJsonV2 = {
  version: typeof KNOWLEDGE_GRAPH_PUBLIC_JSON_VERSION;
  pages: readonly KnowledgeGraphPublicPage[];
  intelligencePlan: IntelligencePlan;
};

export type KnowledgeGraphPublicJson = KnowledgeGraphPublicJsonV1 | KnowledgeGraphPublicJsonV2;

export type KnowledgeGraphPublicPage = {
  pageId: string;
  title: string;
  relativePath: string;
  outbound: readonly KnowledgeGraphPublicOutbound[];
};

export type KnowledgeGraphPublicOutbound = {
  toPageId: string;
  headingAnchor: string | null;
  broken: boolean;
};

function sortOutbound(list: readonly KnowledgeGraphPublicOutbound[]): KnowledgeGraphPublicOutbound[] {
  return [...list].sort((a, b) => {
    const t = a.toPageId.localeCompare(b.toPageId);
    if (t !== 0) return t;
    const ah = a.headingAnchor ?? "";
    const bh = b.headingAnchor ?? "";
    return ah.localeCompare(bh);
  });
}

function outboundFromNode(outbound: readonly GraphEdge[]): KnowledgeGraphPublicOutbound[] {
  return sortOutbound(
    outbound.map((e) => ({
      toPageId: e.toPageId,
      headingAnchor: e.headingAnchor ?? null,
      broken: e.broken,
    })),
  );
}

function pagesToPublicList(g: KnowledgeGraph): KnowledgeGraphPublicPage[] {
  const pages: KnowledgeGraphPublicPage[] = [];
  for (const id of [...g.pageIds].sort((a, b) => a.localeCompare(b))) {
    const n = g.nodes.get(id);
    if (!n) continue;
    pages.push({
      pageId: n.pageId,
      title: n.title,
      relativePath: n.relativePath,
      outbound: outboundFromNode(n.outbound),
    });
  }
  return pages;
}

/**
 * Deterministic JSON-friendly view of a {@link KnowledgeGraph} for tools and drift checks.
 * Pages and outbound links are sorted; `rootDir` is not included. Includes `intelligencePlan`
 * (same source as `docs/knowledge-graph-view/intelligence-plan.json`) so consumers see build state.
 */
export function knowledgeGraphToPublicJson(g: KnowledgeGraph, plan: IntelligencePlan): KnowledgeGraphPublicJsonV2 {
  return {
    version: KNOWLEDGE_GRAPH_PUBLIC_JSON_VERSION,
    pages: pagesToPublicList(g),
    intelligencePlan: plan,
  };
}

function markdownFromPublicPage(p: KnowledgeGraphPublicPage): string {
  const links = p.outbound
    .map((o) => {
      if (o.headingAnchor) return `[[${o.toPageId}#${o.headingAnchor}]]`;
      return `[[${o.toPageId}]]`;
    })
    .join("\n");
  return `# ${p.title}\n\n${links}\n`;
}

/**
 * Rebuild an in-memory graph from a public JSON snapshot (for tests and round-trips).
 * Wikilinks are synthesized from `outbound`; `broken` is recomputed from the page id set.
 * Version 2 `intelligencePlan` is ignored for graph reconstruction.
 */
export function knowledgeGraphFromPublicJson(j: KnowledgeGraphPublicJson, rootDir: string): KnowledgeGraph {
  if (j.version !== 1 && j.version !== KNOWLEDGE_GRAPH_PUBLIC_JSON_VERSION) {
    throw new Error(`Unsupported knowledge graph JSON version: ${String((j as { version: unknown }).version)}`);
  }
  const pages: PageDocument[] = j.pages.map((p) => ({
    pageId: p.pageId,
    relativePath: p.relativePath,
    markdown: markdownFromPublicPage(p),
  }));
  return buildKnowledgeGraph(rootDir, pages);
}

/** Stable `JSON.stringify` output for drift checks (2-space indent). */
export function stringifyKnowledgeGraphPublicJson(j: KnowledgeGraphPublicJson): string {
  return `${JSON.stringify(j, null, 2)}\n`;
}
