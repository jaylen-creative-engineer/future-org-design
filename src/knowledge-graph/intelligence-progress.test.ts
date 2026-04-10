import { describe, expect, it } from "vitest";

import { buildKnowledgeGraph } from "./build-graph.js";
import { computeDomainProgress, computePlanSummary } from "./intelligence-progress.js";

describe("intelligence progress", () => {
  it("computes completion and graph coverage", () => {
    const g = buildKnowledgeGraph("/tmp", [
      { pageId: "lat", relativePath: "lat.md", markdown: "# Index" },
      { pageId: "odaas-core", relativePath: "odaas-core.md", markdown: "# Core" },
    ]);
    const row = computeDomainProgress(g, {
      id: "x",
      title: "X",
      productPromise: "Promise",
      graphPageIds: ["lat", "missing", "lat"],
      targetUnits: 10,
      builtUnits: 4,
      status: "in_progress",
    });
    expect(row.coveredGraphPages).toBe(1);
    expect(row.graphPageIds).toEqual(["lat", "missing"]);
    expect(row.completionRatio).toBe(0.4);
    expect(row.remainingUnits).toBe(6);
  });

  it("summarizes plan totals", () => {
    const summary = computePlanSummary([
      {
        id: "a",
        title: "A",
        productPromise: "p",
        graphPageIds: [],
        targetUnits: 8,
        builtUnits: 8,
        status: "complete",
        coveredGraphPages: 0,
        completionRatio: 1,
        remainingUnits: 0,
      },
      {
        id: "b",
        title: "B",
        productPromise: "p",
        graphPageIds: [],
        targetUnits: 10,
        builtUnits: 2,
        status: "in_progress",
        coveredGraphPages: 0,
        completionRatio: 0.2,
        remainingUnits: 8,
      },
    ]);
    expect(summary.targetUnits).toBe(18);
    expect(summary.builtUnits).toBe(10);
    expect(summary.remainingUnits).toBe(8);
    expect(summary.fullyCompleteDomains).toBe(1);
  });
});
