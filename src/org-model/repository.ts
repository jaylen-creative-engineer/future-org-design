export type ScenarioState = "draft" | "ready" | "archived";
export type RecommendationState = "proposed" | "accepted" | "rejected" | "superseded";

export interface ScopeRecord {
  scopeId: string;
  name: string;
  createdAt: string;
}

export interface UnitRecord {
  scopeId: string;
  unitId: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

export interface BaselineRecord {
  baselineId: string;
  scopeId: string;
  snapshotJson: string;
  createdAt: string;
}

export interface ScenarioRecord {
  scenarioId: string;
  scopeId: string;
  baselineId: string;
  state: ScenarioState;
  createdAt: string;
}

export interface RecommendationRecord {
  recommendationId: string;
  scopeId: string;
  baselineId: string;
  scenarioId: string;
  state: RecommendationState;
  rationale: string;
  confidenceScore: number;
  createdAt: string;
}

export class OrgPersistenceError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "OrgPersistenceError";
  }
}

export interface OrgModelRepository {
  ensureSchema(): Promise<void>;
  createScope(scopeId: string, name: string): Promise<void>;
  listScopes(): Promise<ScopeRecord[]>;
  upsertUnit(scopeId: string, unitId: string, name: string): Promise<void>;
  listUnits(scopeId: string): Promise<UnitRecord[]>;
  addReportingLine(scopeId: string, childId: string, parentId: string): Promise<void>;
  createBaseline(scopeId: string, baselineId: string): Promise<void>;
  listBaselines(scopeId: string): Promise<BaselineRecord[]>;
  createScenarioFromBaseline(scopeId: string, baselineId: string, scenarioId: string): Promise<void>;
  listScenarios(scopeId: string): Promise<ScenarioRecord[]>;
  createRecommendation(
    scopeId: string,
    baselineId: string,
    scenarioId: string,
    rationale: string,
    confidenceScore: number
  ): Promise<void>;
  listRecommendations(scopeId: string): Promise<RecommendationRecord[]>;
  close(): Promise<void>;
}
