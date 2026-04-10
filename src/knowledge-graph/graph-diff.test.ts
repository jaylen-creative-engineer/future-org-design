import { describe, expect, it } from "vitest";

import { buildKnowledgeGraph } from "./build-graph.js";
import { diffKnowledgeGraphs } from "./graph-diff.js";
import type { PageDocument } from "./build-graph.js";

function pg(pageId: string, title: string, body: string, rel = `${pageId}.md`): PageDocument {
  return { pageId, relativePath: rel, markdown: `# ${title}\n\n${body}\n` };
}

describe("diffKnowledgeGraphs", () => {
  it("detects added and removed pages and edges", () => {
    const before = buildKnowledgeGraph("/a", [
      pg("a", "A", "[[b]]"),
      pg("b", "B", ""),
    ]);
    const after = buildKnowledgeGraph("/a", [
      pg("a", "A", "[[b]]\n[[c]]"),
      pg("b", "B", ""),
      pg("c", "C", "[[a]]"),
    ]);
    const d = diffKnowledgeGraphs(before, after);
    expect(d.addedPageIds).toEqual(["c"]);
    expect(d.removedPageIds).toEqual([]);
    expect(d.titleChanges).toEqual([]);
    expect(d.addedEdges.map((e) => `${e.fromPageId}->${e.toPageId}`).sort()).toEqual(["a->c", "c->a"]);
    expect(d.removedEdges).toEqual([]);
    expect(d.brokenFlagChanges).toEqual([]);
  });

  it("detects title changes on shared pages", () => {
    const before = buildKnowledgeGraph("/r", [pg("x", "Old", "")]);
    const after = buildKnowledgeGraph("/r", [pg("x", "New", "")]);
    const d = diffKnowledgeGraphs(before, after);
    expect(d.titleChanges).toEqual([{ pageId: "x", before: "Old", after: "New" }]);
  });

  it("detects removed edges and broken-flag changes when a target appears", () => {
    const before = buildKnowledgeGraph("/r", [pg("a", "A", "[[missing]]")]);
    const after = buildKnowledgeGraph("/r", [pg("a", "A", "[[missing]]"), pg("missing", "M", "")]);
    const d = diffKnowledgeGraphs(before, after);
    expect(d.addedPageIds).toEqual(["missing"]);
    expect(d.addedEdges).toEqual([]);
    expect(d.removedEdges).toEqual([]);
    expect(d.brokenFlagChanges.length).toBe(1);
    expect(d.brokenFlagChanges[0].beforeBroken).toBe(true);
    expect(d.brokenFlagChanges[0].afterBroken).toBe(false);
  });
});
