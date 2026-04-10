/** One wikilink target extracted from markdown `[[page]]` or `[[page#Heading]]`. */
export type WikiLinkTarget = {
  /** Target page id (filename stem, e.g. `odaas-core`). */
  pageId: string;
  /** Optional heading fragment after `#`. */
  headingAnchor: string | undefined;
};

/** Directed edge: source page references target page. */
export type GraphEdge = {
  fromPageId: string;
  toPageId: string;
  headingAnchor: string | undefined;
  /** True when no `{toPageId}.md` exists in the graph directory. */
  broken: boolean;
};

export type GraphNode = {
  pageId: string;
  /** Display label from the first `#` heading in the page body. */
  title: string;
  /** Relative path from graph root, POSIX-style. */
  relativePath: string;
  outbound: GraphEdge[];
};

export type KnowledgeGraph = {
  rootDir: string;
  /** All page ids discovered on disk (basename without `.md`). */
  pageIds: ReadonlySet<string>;
  nodes: ReadonlyMap<string, GraphNode>;
  /** All edges in document order. */
  edges: readonly GraphEdge[];
};

export type GraphStats = {
  pageCount: number;
  edgeCount: number;
  brokenEdgeCount: number;
};
