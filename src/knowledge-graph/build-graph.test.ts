import { describe, expect, it } from "vitest";

import { buildKnowledgeGraph, findOrphanPageIds, graphStats } from "./build-graph.js";

describe("buildKnowledgeGraph", () => {
  it("marks edges broken when target page is missing", () => {
    const g = buildKnowledgeGraph("/tmp", [
      {
        pageId: "a",
        relativePath: "a.md",
        markdown: "[[missing]] [[b]]",
      },
      { pageId: "b", relativePath: "b.md", markdown: "" },
    ]);
    const edges = g.nodes.get("a")?.outbound ?? [];
    expect(edges).toHaveLength(2);
    expect(edges.find((e) => e.toPageId === "missing")?.broken).toBe(true);
    expect(edges.find((e) => e.toPageId === "b")?.broken).toBe(false);
    expect(graphStats(g).brokenEdgeCount).toBe(1);
  });

  it("dedupes identical link triples per page", () => {
    const g = buildKnowledgeGraph("/tmp", [
      { pageId: "a", relativePath: "a.md", markdown: "[[b]] [[b]]" },
      { pageId: "b", relativePath: "b.md", markdown: "" },
    ]);
    expect(g.edges.filter((e) => e.fromPageId === "a")).toHaveLength(1);
  });
});

describe("findOrphanPageIds", () => {
  it("returns pages with no inbound links", () => {
    const g = buildKnowledgeGraph("/tmp", [
      { pageId: "hub", relativePath: "hub.md", markdown: "[[leaf]]" },
      { pageId: "leaf", relativePath: "leaf.md", markdown: "" },
    ]);
    expect(findOrphanPageIds(g)).toEqual(["hub"]);
  });
});
