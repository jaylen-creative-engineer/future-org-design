export { graphEdgeKey } from "./edge-key.js";
export type {
  GraphEdge,
  GraphNode,
  GraphStats,
  KnowledgeGraph,
  WikiLinkTarget,
} from "./types.js";
export {
  buildKnowledgeGraph,
  findOrphanPageIds,
  graphStats,
  inboundCounts,
  inboundEdges,
} from "./build-graph.js";
export type { PageDocument } from "./build-graph.js";
export { loadKnowledgeGraphFromDirectory } from "./load-graph.js";
export { parseWikiLinks, stripCodeFromMarkdown } from "./parse-wikilinks.js";
export { titleFromFirstHeading } from "./markdown-title.js";
export {
  domainRows,
  mermaidNodeId,
  renderKnowledgeGraphHtml,
  renderMermaidFlowchart,
} from "./render-view.js";
export type { DomainRow } from "./render-view.js";
export type { KnowledgeGraphDiff } from "./graph-diff.js";
export { diffKnowledgeGraphs } from "./graph-diff.js";
export type {
  KnowledgeGraphPublicJson,
  KnowledgeGraphPublicOutbound,
  KnowledgeGraphPublicPage,
} from "./graph-json.js";
export {
  KNOWLEDGE_GRAPH_PUBLIC_JSON_VERSION,
  knowledgeGraphFromPublicJson,
  knowledgeGraphToPublicJson,
  stringifyKnowledgeGraphPublicJson,
} from "./graph-json.js";
export {
  computeDomainProgress,
  computePlanSummary,
  loadIntelligencePlanFromFile,
} from "./intelligence-progress.js";
export type {
  IntelligenceDomainPlan,
  IntelligenceDomainProgress,
  IntelligencePlan,
  IntelligenceSummary,
} from "./intelligence-progress.js";
