import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  knowledgeGraphFromPublicJson,
  knowledgeGraphToPublicJson,
  stringifyKnowledgeGraphPublicJson,
} from "./graph-json.js";
import { loadIntelligencePlanFromFile } from "./intelligence-progress.js";
import { loadKnowledgeGraphFromDirectory } from "./load-graph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAT_MD_ROOT = path.join(__dirname, "../../docs/lat.md");
const PLAN_PATH = path.join(__dirname, "../../docs/knowledge-graph-view/intelligence-plan.json");

describe("knowledgeGraphToPublicJson", () => {
  it("round-trips the lat.md corpus through public JSON", async () => {
    const g = await loadKnowledgeGraphFromDirectory(LAT_MD_ROOT);
    const plan = await loadIntelligencePlanFromFile(PLAN_PATH);
    const j = knowledgeGraphToPublicJson(g, plan);
    const g2 = knowledgeGraphFromPublicJson(j, g.rootDir);
    const j2 = knowledgeGraphToPublicJson(g2, plan);
    expect(j2).toEqual(j);
  });

  it("produces stable stringify output", async () => {
    const g = await loadKnowledgeGraphFromDirectory(LAT_MD_ROOT);
    const plan = await loadIntelligencePlanFromFile(PLAN_PATH);
    const s1 = stringifyKnowledgeGraphPublicJson(knowledgeGraphToPublicJson(g, plan));
    const s2 = stringifyKnowledgeGraphPublicJson(knowledgeGraphToPublicJson(g, plan));
    expect(s1).toBe(s2);
  });
});
