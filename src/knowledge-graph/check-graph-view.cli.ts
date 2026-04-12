import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { knowledgeGraphToPublicJson, stringifyKnowledgeGraphPublicJson } from "./graph-json.js";
import { loadIntelligencePlanFromFile } from "./intelligence-progress.js";
import { loadKnowledgeGraphFromDirectory } from "./load-graph.js";
import { renderKnowledgeGraphHtml, renderMermaidFlowchart } from "./render-view.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, "../../docs");
const graphRoot = path.join(docsDir, "lat.md");
const viewDir = path.join(docsDir, "knowledge-graph-view");
const htmlPath = path.join(viewDir, "knowledge-graph.html");
const mmdPath = path.join(viewDir, "knowledge-graph.mmd");
const jsonPath = path.join(viewDir, "knowledge-graph.json");
const planPath = path.join(viewDir, "intelligence-plan.json");

function normalizeNewlines(s: string): string {
  return s.replace(/\r\n/g, "\n");
}

async function readExpected(path: string): Promise<string> {
  try {
    return normalizeNewlines(await fs.readFile(path, "utf8"));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Cannot read ${path}: ${msg}`);
  }
}

async function main(): Promise<void> {
  const [g, plan, expectedHtml, expectedMmd, expectedJson] = await Promise.all([
    loadKnowledgeGraphFromDirectory(graphRoot),
    loadIntelligencePlanFromFile(planPath),
    readExpected(htmlPath),
    readExpected(mmdPath),
    readExpected(jsonPath),
  ]);

  const actualHtml = normalizeNewlines(renderKnowledgeGraphHtml(g, plan));
  const actualMmd = normalizeNewlines(`${renderMermaidFlowchart(g)}\n`);
  const actualJson = normalizeNewlines(stringifyKnowledgeGraphPublicJson(knowledgeGraphToPublicJson(g, plan)));

  const problems: string[] = [];
  if (actualHtml !== expectedHtml) problems.push(`${path.relative(process.cwd(), htmlPath)} is out of date`);
  if (actualMmd !== expectedMmd) problems.push(`${path.relative(process.cwd(), mmdPath)} is out of date`);
  if (actualJson !== expectedJson) problems.push(`${path.relative(process.cwd(), jsonPath)} is out of date`);

  if (problems.length > 0) {
    console.error("graph:check failed — generated knowledge graph viewer does not match repo files:\n");
    for (const p of problems) console.error(`  - ${p}`);
    console.error("\nRun: npm run graph:view\n");
    process.exit(1);
  }

  console.log("graph:check ok (knowledge-graph.html + knowledge-graph.mmd + knowledge-graph.json match rendered output)");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
