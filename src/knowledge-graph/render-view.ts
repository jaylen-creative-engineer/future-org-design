import type { KnowledgeGraph } from "./types.js";
import { graphStats, inboundCounts } from "./build-graph.js";
import {
  computeDomainProgress,
  computePlanSummary,
  type IntelligencePlan,
} from "./intelligence-progress.js";

const MAX_EDGE_LABEL = 48;

/** Mermaid-safe node id from page id (stem). */
export function mermaidNodeId(pageId: string): string {
  return `p_${pageId.replace(/[^a-zA-Z0-9]/g, "_")}`;
}

function escapeMermaidLabel(text: string): string {
  return text.replace(/"/g, "'").replace(/\|/g, "/");
}

function edgeLabel(headingAnchor: string | undefined): string | undefined {
  if (!headingAnchor) return undefined;
  const t = headingAnchor.trim();
  if (!t) return undefined;
  return t.length > MAX_EDGE_LABEL ? `${t.slice(0, MAX_EDGE_LABEL - 1)}…` : t;
}

/**
 * Mermaid `flowchart` source: nodes show page titles; edges show optional section anchors.
 */
export function renderMermaidFlowchart(g: KnowledgeGraph): string {
  const lines: string[] = ["flowchart TB"];
  const ids = [...g.pageIds].sort((a, b) => a.localeCompare(b));

  for (const id of ids) {
    const n = g.nodes.get(id);
    if (!n) continue;
    const mid = mermaidNodeId(id);
    const label = escapeMermaidLabel(`${n.title} — ${id}.md`);
    lines.push(`  ${mid}["${label}"]`);
  }

  const seenPair = new Set<string>();
  for (const e of g.edges) {
    if (e.broken) continue;
    const pairKey = `${e.fromPageId}\0${e.toPageId}\0${e.headingAnchor ?? ""}`;
    if (seenPair.has(pairKey)) continue;
    seenPair.add(pairKey);

    const from = mermaidNodeId(e.fromPageId);
    const to = mermaidNodeId(e.toPageId);
    const el = edgeLabel(e.headingAnchor);
    if (el) lines.push(`  ${from} -->|"${escapeMermaidLabel(el)}"| ${to}`);
    else lines.push(`  ${from} --> ${to}`);
  }

  return lines.join("\n");
}

export type DomainRow = {
  pageId: string;
  title: string;
  relativePath: string;
  outbound: number;
  inbound: number;
};

export function domainRows(g: KnowledgeGraph): DomainRow[] {
  const inc = inboundCounts(g);
  const rows: DomainRow[] = [];
  for (const id of [...g.pageIds].sort((a, b) => a.localeCompare(b))) {
    const n = g.nodes.get(id);
    if (!n) continue;
    rows.push({
      pageId: id,
      title: n.title,
      relativePath: n.relativePath,
      outbound: n.outbound.filter((e) => !e.broken).length,
      inbound: inc.get(id) ?? 0,
    });
  }
  return rows;
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function renderProgressSection(g: KnowledgeGraph, plan: IntelligencePlan): string {
  const rows = plan.domains.map((d) => computeDomainProgress(g, d));
  const summary = computePlanSummary(rows);

  const tableRows = rows
    .map((r) => {
      const pageRefs = r.graphPageIds.map((id) => `<code>${escapeHtml(id)}</code>`).join(", ");
      return `          <tr>
            <td>${escapeHtml(r.title)}</td>
            <td>${escapeHtml(r.productPromise)}</td>
            <td>${pageRefs || "<span class=\"muted\">none</span>"}</td>
            <td class="num">${r.coveredGraphPages}/${r.graphPageIds.length}</td>
            <td class="num">${r.targetUnits}</td>
            <td class="num">${r.builtUnits}</td>
            <td class="num">${r.remainingUnits}</td>
            <td class="num">${formatPercent(r.completionRatio)}</td>
          </tr>`;
    })
    .join("\n");

  return `
  <h2>Product promise vs build progress</h2>
  <p class="lead">
    This maps product promise domains to logic-graph pages and tracks code-complete intelligence units.
    Unit: <code>${escapeHtml(plan.unit)}</code>. Last update: <code>${escapeHtml(plan.updatedAt)}</code>.
  </p>
  <div class="stats" role="status">
    <span><strong>${summary.targetUnits}</strong> target units</span>
    <span><strong>${summary.builtUnits}</strong> built units</span>
    <span><strong>${summary.remainingUnits}</strong> remaining units</span>
    <span><strong>${formatPercent(summary.completionRatio)}</strong> complete</span>
    <span><strong>${summary.fullyCompleteDomains}/${summary.domainCount}</strong> domains complete</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Promise domain</th>
        <th>Product promise</th>
        <th>Logic-graph pages</th>
        <th>Graph coverage</th>
        <th>Target</th>
        <th>Built</th>
        <th>Remaining</th>
        <th>Code complete</th>
      </tr>
    </thead>
    <tbody>
${tableRows}
    </tbody>
  </table>`;
}

/**
 * Self-contained HTML page with Mermaid from CDN. Open locally after `npm run graph:view`.
 */
export function renderKnowledgeGraphHtml(g: KnowledgeGraph, plan?: IntelligencePlan): string {
  const stats = graphStats(g);
  const rows = domainRows(g);
  const mmd = renderMermaidFlowchart(g);
  /** Use plan date so output is stable across `npm run graph:view` runs (graph:check compares bytes). */
  const generated = plan?.updatedAt ?? "—";

  const tableRows = rows
    .map(
      (r) =>
        `          <tr><td>${escapeHtml(r.title)}</td><td><code>${escapeHtml(r.pageId)}</code></td><td class="num">${r.outbound}</td><td class="num">${r.inbound}</td></tr>`,
    )
    .join("\n");

  const progressSection = plan ? renderProgressSection(g, plan) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Knowledge graph — future-org-design</title>
  <style>
    :root { color-scheme: light dark; --border: #c8c8c8; --muted: #666; --bg: #fafafa; }
    @media (prefers-color-scheme: dark) {
      :root { --border: #444; --muted: #aaa; --bg: #121212; }
    }
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 1.25rem clamp(1rem, 4vw, 2.5rem); line-height: 1.5; background: var(--bg); color: CanvasText; }
    h1 { font-size: 1.35rem; margin: 0 0 0.5rem; }
    p.lead { margin: 0 0 1rem; color: var(--muted); max-width: 52rem; }
    .stats { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; font-size: 0.9rem; color: var(--muted); }
    .stats span strong { color: CanvasText; }
    h2 { font-size: 1.05rem; margin: 1.5rem 0 0.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; max-width: 52rem; }
    th, td { text-align: left; padding: 0.45rem 0.6rem; border-bottom: 1px solid var(--border); }
    th { font-weight: 600; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .muted { color: var(--muted); }
    code { font-size: 0.85em; }
    .diagram-wrap { margin-top: 1rem; overflow: auto; border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; background: Canvas; }
    .mermaid { display: flex; justify-content: center; min-height: 200px; }
    footer { margin-top: 1.5rem; font-size: 0.8rem; color: var(--muted); }
  </style>
</head>
<body>
  <h1>lat.md knowledge graph</h1>
  <p class="lead">
    Wiki pages under <code>docs/lat.md/</code> and their wikilinks. Each page is a <strong>domain of intelligence</strong> to align product and services with (thesis, market, competition, gaps, AI/data, buyers, closed-loop).
    Higher <em>inbound</em> counts indicate hubs many other pages point at; <em>outbound</em> is how many distinct targets that page references.
  </p>
  <div class="stats" role="status">
    <span><strong>${stats.pageCount}</strong> pages</span>
    <span><strong>${stats.edgeCount}</strong> edges</span>
    <span><strong>${stats.brokenEdgeCount}</strong> broken</span>
  </div>

  <h2>Domains (pages)</h2>
  <table>
    <thead>
      <tr><th>Title</th><th>Page id</th><th>Outbound</th><th>Inbound</th></tr>
    </thead>
    <tbody>
${tableRows}
    </tbody>
  </table>

${progressSection}

  <h2>Link graph</h2>
  <div class="diagram-wrap">
    <pre class="mermaid">${embedMermaidInPre(mmd)}</pre>
  </div>

  <footer>Generated ${escapeHtml(generated)} · Regenerate: <code>npm run graph:view</code></footer>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
    mermaid.run({ querySelector: ".mermaid" });
  </script>
</body>
</html>
`;
}

/** Raw Mermaid source inside &lt;pre&gt;; only escapes a closing &lt;/pre&gt; sequence if present. */
function embedMermaidInPre(mmd: string): string {
  return mmd.replace(/<\/pre/gi, "<\\/pre");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
