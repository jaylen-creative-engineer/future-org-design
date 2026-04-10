# future-org-design — Knowledge graph index

ODaaS product intelligence as a wiki graph: thesis, market, competition, gaps, AI layer, and buyers. Use this instead of re-grepping the full research doc.

Full citations live in `docs/.devnotes/ODaaS_Research_Compilation.md`.

## Graph map

Navigate the graph by topic. Each row points to a section with more detail.


| Topic                        | Section                                          |
| ---------------------------- | ------------------------------------------------ |
| Product thesis & value chain | [[odaas-core#ODaaS product thesis]]              |
| Market & TAM                 | [[market-and-tam#Executive snapshot]]            |
| Competitors                  | [[competition#Competitive tiers]]                |
| Strategic gaps               | [[strategic-gaps#Ten critical market gaps]]      |
| AI & data                    | [[ai-and-data-layer#Intelligence stack]]         |
| Buyers & pain                | [[buyers-and-pain#Confidence–execution gap]]     |
| Closed-loop pipeline         | [[closed-loop-value-chain#Closed-loop pipeline]] |


## Documents in this graph

One wiki page per theme; follow links to move across the graph without reading every file in order.

- [[odaas-core]] — Product thesis, strategic position, links to adjacent domains.
- [[market-and-tam]] — TAM, timing, fragmentation, people analytics, WFP, Team Topologies.
- [[competition]] — Software tiers, notable vendors, collective gap vs ODaaS.
- [[strategic-gaps]] — Ten gaps, prescriptive analytics, operating model, entry vectors.
- [[ai-and-data-layer]] — AI snapshots, ONA, frameworks, SBO, human–AI teaming.
- [[buyers-and-pain]] — Confidence gap, pain themes, personas, triggers, continuous design.
- [[closed-loop-value-chain]] — End-to-end analytics → design → plan → implement → monitor loop.

## Programmatic graph (code)

TypeScript in `src/knowledge-graph/` loads this directory and parses wikilinks into a graph. Viewer output and the build-progress plan live in `docs/knowledge-graph-view/` (not in this folder, so `lat` checks stay markdown-only).

`npm test` fails if that viewer drifts from the generator; run `npm run graph:view` after edits to wiki pages here, `docs/knowledge-graph-view/intelligence-plan.json`, or graph code. Open `docs/knowledge-graph-view/knowledge-graph.html` for the table, product promise vs build progress (including currently available features from plan notes), and Mermaid export (`knowledge-graph.mmd`). The same generator emits a stable JSON snapshot (`knowledge-graph.json`) for programmatic consumers and diffing; use `diffKnowledgeGraphs` in `src/knowledge-graph/` to compare two loaded graphs (for example before/after a wiki edit).

## Cross-cutting themes

Themes that appear in multiple documents: prescription vs description, episodic vs continuous redesign, and formal org charts vs informal networks.

- **Prescriptive org design** — [[strategic-gaps#Prescriptive analytics gap]].
- **Continuous capability** — [[buyers-and-pain#Continuous design gap]].
- **ONA + structure** — [[ai-and-data-layer#Organizational network analysis (ONA)]] and [[strategic-gaps#ONA and informal organization]].