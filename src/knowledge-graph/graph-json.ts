import { buildKnowledgeGraph } from "./build-graph.js";
import type { PageDocument } from "./build-graph.js";
import type { GraphEdge, KnowledgeGraph } from "./types.js";

export const KNOWLEDGE_GRAPH_PUBLIC_JSON_VERSION = 1 as const;

/** Serializable snapshot of the wiki graph (no absolute filesystem paths). */
export type KnowledgeGraphPublicJson = {
  version: typeof KNOWLEDGE_GRAPH_PUBLIC_JSON_VERSION;
  pages: readonly KnowledgeGraphPublicPage[];
};

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

/**
 * Deterministic JSON-friendly view of a {@link KnowledgeGraph} for tools and drift checks.
 * Pages and outbound links are sorted; `rootDir` is not included.
 */
export function knowledgeGraphToPublicJson(g: KnowledgeGraph): KnowledgeGraphPublicJson {
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
  return { version: KNOWLEDGE_GRAPH_PUBLIC_JSON_VERSION, pages };
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
 */
export function knowledgeGraphFromPublicJson(j: KnowledgeGraphPublicJson, rootDir: string): KnowledgeGraph {
  if (j.version !== KNOWLEDGE_GRAPH_PUBLIC_JSON_VERSION) {
    throw new Error(`Unsupported knowledge graph JSON version: ${String(j.version)}`);
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
