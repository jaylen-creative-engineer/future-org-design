import fs from "node:fs/promises";

import type { KnowledgeGraph } from "./types.js";

export type IntelligenceDomainPlan = {
  id: string;
  title: string;
  productPromise: string;
  graphPageIds: string[];
  targetUnits: number;
  builtUnits: number;
  status: "planned" | "in_progress" | "complete";
  notes?: string;
};

export type IntelligencePlan = {
  version: string;
  unit: string;
  updatedAt: string;
  domains: IntelligenceDomainPlan[];
};

export type IntelligenceDomainProgress = IntelligenceDomainPlan & {
  coveredGraphPages: number;
  completionRatio: number;
  remainingUnits: number;
};

export type IntelligenceSummary = {
  targetUnits: number;
  builtUnits: number;
  remainingUnits: number;
  completionRatio: number;
  domainCount: number;
  fullyCompleteDomains: number;
};

export function computeDomainProgress(
  graph: KnowledgeGraph,
  domain: IntelligenceDomainPlan,
): IntelligenceDomainProgress {
  const targetUnits = clampNonNegative(domain.targetUnits);
  const builtUnits = clamp(0, targetUnits, domain.builtUnits);
  const uniquePageIds = [...new Set(domain.graphPageIds)];
  const coveredGraphPages = uniquePageIds.filter((id) => graph.pageIds.has(id)).length;

  return {
    ...domain,
    graphPageIds: uniquePageIds,
    targetUnits,
    builtUnits,
    coveredGraphPages,
    completionRatio: targetUnits === 0 ? 0 : builtUnits / targetUnits,
    remainingUnits: Math.max(0, targetUnits - builtUnits),
  };
}

export function computePlanSummary(rows: IntelligenceDomainProgress[]): IntelligenceSummary {
  let targetUnits = 0;
  let builtUnits = 0;
  let fullyCompleteDomains = 0;

  for (const row of rows) {
    targetUnits += row.targetUnits;
    builtUnits += row.builtUnits;
    if (row.builtUnits >= row.targetUnits && row.targetUnits > 0) {
      fullyCompleteDomains += 1;
    }
  }

  return {
    targetUnits,
    builtUnits,
    remainingUnits: Math.max(0, targetUnits - builtUnits),
    completionRatio: targetUnits === 0 ? 0 : builtUnits / targetUnits,
    domainCount: rows.length,
    fullyCompleteDomains,
  };
}

export async function loadIntelligencePlanFromFile(path: string): Promise<IntelligencePlan> {
  const raw = await fs.readFile(path, "utf8");
  return JSON.parse(raw) as IntelligencePlan;
}

function clamp(min: number, max: number, n: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

function clampNonNegative(n: number): number {
  return Math.max(0, Number.isFinite(n) ? n : 0);
}
