import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { graphStats, loadKnowledgeGraphFromDirectory } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAT_MD_ROOT = path.join(__dirname, "../../docs/lat.md");

describe("docs/lat.md corpus", () => {
  it("loads the graph with no broken wikilinks", async () => {
    const g = await loadKnowledgeGraphFromDirectory(LAT_MD_ROOT);
    const stats = graphStats(g);
    expect(stats.pageCount).toBeGreaterThanOrEqual(8);
    expect(stats.brokenEdgeCount).toBe(0);
    expect(g.pageIds.has("lat")).toBe(true);
    expect(g.pageIds.has("odaas-core")).toBe(true);
  });
});
