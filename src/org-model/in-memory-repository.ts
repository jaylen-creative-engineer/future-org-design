import type {
  BaselineRecord,
  OrgModelRepository,
  RecommendationRecord,
  ScenarioRecord,
  ScopeRecord,
  UnitRecord
} from "./repository.js";
import { OrgPersistenceError } from "./repository.js";

interface MutableScope {
  scopeId: string;
  name: string;
  createdAt: string;
}

interface MutableBaseline {
  baselineId: string;
  scopeId: string;
  snapshot: UnitRecord[];
  createdAt: string;
}

interface MutableScenario {
  scenarioId: string;
  scopeId: string;
  baselineId: string;
  state: "draft" | "ready" | "archived";
  createdAt: string;
}

interface MutableRecommendation {
  recommendationId: string;
  scopeId: string;
  baselineId: string;
  scenarioId: string;
  state: "proposed" | "accepted" | "rejected" | "superseded";
  rationale: string;
  confidenceScore: number;
  createdAt: string;
}

export class InMemoryOrgModelRepository implements OrgModelRepository {
  private readonly scopes = new Map<string, MutableScope>();
  private readonly units = new Map<string, Map<string, UnitRecord>>();
  private readonly baselines = new Map<string, MutableBaseline>();
  private readonly scenarios = new Map<string, MutableScenario>();
  private readonly recommendations = new Map<string, MutableRecommendation>();

  async ensureSchema(): Promise<void> {
    return Promise.resolve();
  }

  async createScope(scopeId: string, name: string): Promise<void> {
    const existing = this.scopes.get(scopeId);
    const createdAt = existing?.createdAt ?? new Date().toISOString();
    this.scopes.set(scopeId, { scopeId, name, createdAt });
    if (!this.units.has(scopeId)) {
      this.units.set(scopeId, new Map());
    }
  }

  async listScopes(): Promise<ScopeRecord[]> {
    return [...this.scopes.values()]
      .map((scope) => ({ ...scope }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async upsertUnit(scopeId: string, unitId: string, name: string): Promise<void> {
    const bucket = this.units.get(scopeId);
    if (!bucket) {
      throw new OrgPersistenceError("SCOPE_NOT_FOUND", `Scope ${scopeId} does not exist`);
    }
    const existing = bucket.get(unitId);
    const createdAt = existing?.createdAt ?? new Date().toISOString();
    bucket.set(unitId, { scopeId, unitId, name, parentId: existing?.parentId, createdAt });
  }

  async listUnits(scopeId: string): Promise<UnitRecord[]> {
    const bucket = this.units.get(scopeId);
    if (!bucket) {
      return [];
    }
    return [...bucket.values()]
      .map((unit) => ({ ...unit }))
      .sort((a, b) => a.unitId.localeCompare(b.unitId));
  }

  async addReportingLine(scopeId: string, childId: string, parentId: string): Promise<void> {
    const bucket = this.units.get(scopeId);
    if (!bucket) {
      throw new OrgPersistenceError("SCOPE_NOT_FOUND", `Scope ${scopeId} does not exist`);
    }
    const child = bucket.get(childId);
    const parent = bucket.get(parentId);
    if (!child || !parent) {
      throw new OrgPersistenceError("UNIT_NOT_FOUND", "Child or parent unit does not exist");
    }
    if (childId === parentId) {
      throw new OrgPersistenceError("CYCLE_DETECTED", "A unit cannot report to itself");
    }

    let cursor: string | undefined = parentId;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === childId) {
        throw new OrgPersistenceError("CYCLE_DETECTED", "Reporting line introduces a cycle");
      }
      if (visited.has(cursor)) {
        break;
      }
      visited.add(cursor);
      cursor = bucket.get(cursor)?.parentId;
    }

    bucket.set(childId, { ...child, parentId });
  }

  async createBaseline(scopeId: string, baselineId: string): Promise<void> {
    if (!this.scopes.has(scopeId)) {
      throw new OrgPersistenceError("SCOPE_NOT_FOUND", `Scope ${scopeId} does not exist`);
    }
    const snapshot = await this.listUnits(scopeId);
    this.baselines.set(baselineId, {
      baselineId,
      scopeId,
      snapshot,
      createdAt: new Date().toISOString()
    });
  }

  async listBaselines(scopeId: string): Promise<BaselineRecord[]> {
    return [...this.baselines.values()]
      .filter((baseline) => baseline.scopeId === scopeId)
      .map((baseline) => ({
        baselineId: baseline.baselineId,
        scopeId: baseline.scopeId,
        snapshotJson: JSON.stringify(baseline.snapshot),
        createdAt: baseline.createdAt
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createScenarioFromBaseline(scopeId: string, baselineId: string, scenarioId: string): Promise<void> {
    const baseline = this.baselines.get(baselineId);
    if (!baseline || baseline.scopeId !== scopeId) {
      throw new OrgPersistenceError("BASELINE_NOT_FOUND", `Baseline ${baselineId} does not exist`);
    }
    this.scenarios.set(scenarioId, {
      scenarioId,
      scopeId,
      baselineId,
      state: "draft",
      createdAt: new Date().toISOString()
    });
  }

  async listScenarios(scopeId: string): Promise<ScenarioRecord[]> {
    return [...this.scenarios.values()]
      .filter((scenario) => scenario.scopeId === scopeId)
      .map((scenario) => ({ ...scenario }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getBaselineUnits(scopeId: string, baselineId: string): Promise<UnitRecord[]> {
    const baseline = this.baselines.get(baselineId);
    if (!baseline || baseline.scopeId !== scopeId) {
      throw new OrgPersistenceError("BASELINE_NOT_FOUND", `Baseline ${baselineId} does not exist`);
    }
    return baseline.snapshot.map((unit) => ({ ...unit }));
  }

  async getScenarioUnits(scopeId: string, scenarioId: string): Promise<UnitRecord[]> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario || scenario.scopeId !== scopeId) {
      throw new OrgPersistenceError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    const baseline = this.baselines.get(scenario.baselineId);
    if (!baseline || baseline.scopeId !== scopeId) {
      throw new OrgPersistenceError("BASELINE_NOT_FOUND", `Baseline ${scenario.baselineId} does not exist`);
    }
    return baseline.snapshot.map((unit) => ({ ...unit }));
  }

  async createRecommendation(
    scopeId: string,
    baselineId: string,
    scenarioId: string,
    rationale: string,
    confidenceScore: number
  ): Promise<void> {
    if (!this.baselines.has(baselineId)) {
      throw new OrgPersistenceError("BASELINE_NOT_FOUND", `Baseline ${baselineId} does not exist`);
    }
    if (!this.scenarios.has(scenarioId)) {
      throw new OrgPersistenceError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    const recommendationId = `rec:${scopeId}:${Date.now()}:${this.recommendations.size + 1}`;
    this.recommendations.set(recommendationId, {
      recommendationId,
      scopeId,
      baselineId,
      scenarioId,
      rationale,
      confidenceScore,
      state: "proposed",
      createdAt: new Date().toISOString()
    });
  }

  async listRecommendations(scopeId: string): Promise<RecommendationRecord[]> {
    return [...this.recommendations.values()]
      .filter((recommendation) => recommendation.scopeId === scopeId)
      .map((recommendation) => ({ ...recommendation }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }
}
