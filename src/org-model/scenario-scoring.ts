import type { UnitRecord } from "./repository.js";

export interface ScenarioScoringSubscores {
  readonly rootCountDrift: number;
  readonly maxDepthDrift: number;
  readonly spanPressureDrift: number;
}

export interface ScenarioScoringResult {
  readonly overallError: number;
  readonly normalizedScore: number;
  readonly subscores: ScenarioScoringSubscores;
  readonly contributorLabel: string;
  readonly contributors: string[];
}

interface UnitNode {
  readonly parentId?: string;
}

const ROOT_COUNT_WEIGHT = 0.3;
const MAX_DEPTH_WEIGHT = 0.3;
const SPAN_PRESSURE_WEIGHT = 0.4;
const MAX_SPAN_THRESHOLD = 8;

function toUnitMap(units: readonly UnitRecord[]): Map<string, UnitNode> {
  return new Map(units.map((unit) => [unit.unitId, { parentId: unit.parentId }]));
}

function buildChildrenByParent(units: Map<string, UnitNode>): Map<string, string[]> {
  const childrenByParent = new Map<string, string[]>();
  for (const [unitId, unit] of units.entries()) {
    if (!unit.parentId) {
      continue;
    }
    const siblings = childrenByParent.get(unit.parentId) ?? [];
    siblings.push(unitId);
    childrenByParent.set(unit.parentId, siblings);
  }
  return childrenByParent;
}

function computeRootCount(units: Map<string, UnitNode>): number {
  let roots = 0;
  for (const unit of units.values()) {
    if (!unit.parentId) {
      roots += 1;
    }
  }
  return roots;
}

function computeMaxDepth(units: Map<string, UnitNode>): number {
  const depthMemo = new Map<string, number>();
  const computeDepth = (unitId: string, seen = new Set<string>()): number => {
    if (depthMemo.has(unitId)) {
      return depthMemo.get(unitId) as number;
    }
    if (seen.has(unitId)) {
      return 0;
    }
    seen.add(unitId);
    const parentId = units.get(unitId)?.parentId;
    const depth = parentId ? 1 + computeDepth(parentId, seen) : 0;
    seen.delete(unitId);
    depthMemo.set(unitId, depth);
    return depth;
  };

  let maxDepth = 0;
  for (const unitId of units.keys()) {
    const depth = computeDepth(unitId);
    if (depth > maxDepth) {
      maxDepth = depth;
    }
  }
  return maxDepth;
}

function computeSpanPressure(units: Map<string, UnitNode>): number {
  const childrenByParent = buildChildrenByParent(units);
  let pressure = 0;
  for (const directReports of childrenByParent.values()) {
    const overage = directReports.length - MAX_SPAN_THRESHOLD;
    if (overage > 0) {
      pressure += overage;
    }
  }
  return pressure;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function scoreScenarioFromUnits(
  baselineUnits: readonly UnitRecord[],
  scenarioUnits: readonly UnitRecord[]
): ScenarioScoringResult {
  const baselineMap = toUnitMap(baselineUnits);
  const scenarioMap = toUnitMap(scenarioUnits);

  const rootCountDrift = Math.abs(computeRootCount(scenarioMap) - computeRootCount(baselineMap));
  const maxDepthDrift = Math.abs(computeMaxDepth(scenarioMap) - computeMaxDepth(baselineMap));
  const spanPressureDrift = Math.abs(computeSpanPressure(scenarioMap) - computeSpanPressure(baselineMap));

  const overallError =
    rootCountDrift * ROOT_COUNT_WEIGHT +
    maxDepthDrift * MAX_DEPTH_WEIGHT +
    spanPressureDrift * SPAN_PRESSURE_WEIGHT;
  const normalizedScore = 1 / (1 + overallError);

  const contributors: string[] = [];
  if (rootCountDrift > 0) {
    contributors.push(`root_count_drift:${rootCountDrift}`);
  }
  if (maxDepthDrift > 0) {
    contributors.push(`max_depth_drift:${maxDepthDrift}`);
  }
  if (spanPressureDrift > 0) {
    contributors.push(`span_pressure_drift:${spanPressureDrift}`);
  }
  if (contributors.length === 0) {
    contributors.push("no_structural_drift");
  }

  const contributorLabel =
    contributors.length === 1 && contributors[0] === "no_structural_drift"
      ? "no_structural_drift"
      : contributors.join(", ");

  return {
    overallError: round(overallError),
    normalizedScore: round(normalizedScore),
    subscores: {
      rootCountDrift: round(rootCountDrift),
      maxDepthDrift: round(maxDepthDrift),
      spanPressureDrift: round(spanPressureDrift)
    },
    contributors,
    contributorLabel
  };
}
