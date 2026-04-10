import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  knowledgeGraphFromPublicJson,
  knowledgeGraphToPublicJson,
  stringifyKnowledgeGraphPublicJson,
} from "./graph-json.js";
import { loadKnowledgeGraphFromDirectory } from "./load-graph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAT_MD_ROOT = path.join(__dirname, "../../docs/lat.md");

describe("knowledgeGraphToPublicJson", () => {
  it("round-trips the lat.md corpus through public JSON", async () => {
    const g = await loadKnowledgeGraphFromDirectory(LAT_MD_ROOT);
    const j = knowledgeGraphToPublicJson(g);
    const g2 = knowledgeGraphFromPublicJson(j, g.rootDir);
    const j2 = knowledgeGraphToPublicJson(g2);
    expect(j2).toEqual(j);
  });

  it("produces stable stringify output", async () => {
    const g = await loadKnowledgeGraphFromDirectory(LAT_MD_ROOT);
    const s1 = stringifyKnowledgeGraphPublicJson(knowledgeGraphToPublicJson(g));
    const s2 = stringifyKnowledgeGraphPublicJson(knowledgeGraphToPublicJson(g));
    expect(s1).toBe(s2);
  });
});
