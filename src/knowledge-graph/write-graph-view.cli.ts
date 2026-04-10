import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadIntelligencePlanFromFile } from "./intelligence-progress.js";
import { loadKnowledgeGraphFromDirectory } from "./load-graph.js";
import { renderKnowledgeGraphHtml, renderMermaidFlowchart } from "./render-view.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, "../../docs");
const graphRoot = path.join(docsDir, "lat.md");
const viewDir = path.join(docsDir, "knowledge-graph-view");
const htmlPath = path.join(viewDir, "knowledge-graph.html");
const mmdPath = path.join(viewDir, "knowledge-graph.mmd");
const planPath = path.join(viewDir, "intelligence-plan.json");

async function main(): Promise<void> {
  await fs.mkdir(viewDir, { recursive: true });
  const [g, plan] = await Promise.all([
    loadKnowledgeGraphFromDirectory(graphRoot),
    loadIntelligencePlanFromFile(planPath),
  ]);
  await fs.writeFile(htmlPath, renderKnowledgeGraphHtml(g, plan), "utf8");
  await fs.writeFile(mmdPath, `${renderMermaidFlowchart(g)}\n`, "utf8");
  console.log(`Wrote ${htmlPath}`);
  console.log(`Wrote ${mmdPath}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
