import { describe, expect, it } from "vitest";
import type { UnitRecord } from "./repository.js";
import { scoreScenarioFromUnits } from "./scenario-scoring.js";

function mk(scopeId: string, unitId: string, parentId?: string): UnitRecord {
  return {
    scopeId,
    unitId,
    name: unitId,
    parentId,
    createdAt: "2026-04-01T00:00:00.000Z"
  };
}

describe("scoreScenarioFromUnits", () => {
  it("returns no structural drift for identical baseline and scenario", () => {
    const baseline = [mk("acme", "engineering"), mk("acme", "platform", "engineering")];
    const scenario = [mk("acme", "engineering"), mk("acme", "platform", "engineering")];

    const result = scoreScenarioFromUnits(baseline, scenario);
    expect(result.overallError).toBe(0);
    expect(result.normalizedScore).toBe(1);
    expect(result.contributors).toEqual(["no_structural_drift"]);
  });

  it("raises error when scenario introduces additional roots", () => {
    const baseline = [mk("acme", "engineering"), mk("acme", "platform", "engineering")];
    const scenario = [mk("acme", "engineering"), mk("acme", "platform"), mk("acme", "ops")];

    const result = scoreScenarioFromUnits(baseline, scenario);
    expect(result.overallError).toBeGreaterThan(0);
    expect(result.subscores.rootCountDrift).toBeGreaterThan(0);
    expect(result.normalizedScore).toBeLessThan(1);
  });
});
