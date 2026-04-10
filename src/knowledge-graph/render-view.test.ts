import { describe, expect, it } from "vitest";

import { buildKnowledgeGraph } from "./build-graph.js";
import { mermaidNodeId, renderKnowledgeGraphHtml, renderMermaidFlowchart } from "./render-view.js";

describe("renderMermaidFlowchart", () => {
  it("emits flowchart with edges", () => {
    const g = buildKnowledgeGraph("/tmp", [
      {
        pageId: "a",
        relativePath: "a.md",
        markdown: "# A\n[[b]]",
      },
      {
        pageId: "b",
        relativePath: "b.md",
        markdown: "# B\n",
      },
    ]);
    const mmd = renderMermaidFlowchart(g);
    expect(mmd).toContain("flowchart TB");
    expect(mmd).toContain(mermaidNodeId("a"));
    expect(mmd).toContain(mermaidNodeId("b"));
    expect(mmd).toContain(`${mermaidNodeId("a")} --> ${mermaidNodeId("b")}`);
  });
});

describe("renderKnowledgeGraphHtml", () => {
  it("renders product promise progress when plan is provided", () => {
    const g = buildKnowledgeGraph("/tmp", [
      { pageId: "lat", relativePath: "lat.md", markdown: "# Index\n[[odaas-core]]" },
      { pageId: "odaas-core", relativePath: "odaas-core.md", markdown: "# Core" },
    ]);
    const html = renderKnowledgeGraphHtml(g, {
      version: "test",
      updatedAt: "2026-04-10",
      unit: "capabilities",
      domains: [
        {
          id: "d1",
          title: "Core intelligence",
          productPromise: "Promise",
          graphPageIds: ["lat", "odaas-core"],
          targetUnits: 10,
          builtUnits: 4,
          status: "in_progress",
          notes: "Graph parser and viewer are available.",
        },
      ],
    });
    expect(html).toContain("Product promise vs build progress");
    expect(html).toContain("Currently available features");
    expect(html).toContain("Graph parser and viewer are available.");
    expect(html).toContain("target units");
    expect(html).toContain("Core intelligence");
    expect(html).toContain("40%");
  });
});
