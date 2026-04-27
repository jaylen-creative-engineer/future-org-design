export interface IngestUnit {
  externalId?: string;
  name?: string;
  parentExternalId?: string;
}

export interface IngestPayload {
  scopeId?: string;
  units?: IngestUnit[];
}

export interface ScopeView {
  scopeId: string;
  rootOrgId?: string;
  units: Map<string, { id: string; name: string; parentId?: string }>;
  normalizedExternalToInternal: Map<string, string>;
}

export interface ScenarioView {
  scenarioId: string;
  scopeId: string;
  baselineId: string;
  state: ScenarioState;
  units: Map<string, { id: string; name: string; parentId?: string }>;
}

export type ScenarioState = "draft" | "ready" | "archived";

export interface ScenarioScore {
  overallError: number;
  normalizedScore: number;
  contributors: string[];
}

export interface RecommendationConstraint {
  type: string;
  targetEntityId: string;
  value: number;
}

export interface MetricSnapshotRef {
  metricId: string;
  value: number;
  capturedAt: string;
}

export interface RecommendationRequest {
  scopeId?: string;
  baselineId?: string;
  scenarioId?: string;
  constraints?: RecommendationConstraint[];
  metricSnapshots?: MetricSnapshotRef[];
  idempotencyKey?: string;
}

export type SuggestedChangeAction = "reparent_unit" | "add_unit" | "remove_unit";

export interface SuggestedChange {
  action: SuggestedChangeAction;
  entityId: string;
  targetParentId?: string;
  reason?: string;
}

export interface RecommendationGenerationInput {
  scopeId: string;
  baselineId: string;
  scenarioId: string;
  constraints: RecommendationConstraint[];
  metricSnapshots: MetricSnapshotRef[];
}

export interface RecommendationDraft {
  suggestedChanges: SuggestedChange[];
  rationale: string;
  confidenceScore: number;
  affectedEntityIds: string[];
  createdAt: string;
}

export type RecommendationState = "proposed" | "accepted" | "rejected" | "superseded";

export interface RecommendationArtifact extends RecommendationDraft {
  recommendationId: string;
  scopeId: string;
  baselineId: string;
  scenarioId: string;
  state: RecommendationState;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AdkRecommendationAdapter {
  generate(input: RecommendationGenerationInput): Promise<RecommendationDraft>;
}

export const RECOMMENDATION_GOLDEN_FIXTURES: Readonly<Record<string, RecommendationDraft>> = {
  "golden-rec-default": {
    suggestedChanges: [
      {
        action: "reparent_unit",
        entityId: "platform",
        targetParentId: "ops",
        reason: "Reduce coordination overhead by colocating platform operations."
      }
    ],
    rationale: "Golden fixture recommendation for deterministic CI validation.",
    confidenceScore: 0.87,
    affectedEntityIds: ["platform", "ops"],
    createdAt: "2026-04-11T00:00:00.000Z"
  }
};

export class OrgModelError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "OrgModelError";
  }
}

function cloneUnits(
  units: Map<string, { id: string; name: string; parentId?: string }>
): Map<string, { id: string; name: string; parentId?: string }> {
  return new Map(
    [...units.entries()].map(([key, value]) => [key, { ...value }])
  );
}

function cloneRecommendationDraft(draft: RecommendationDraft): RecommendationDraft {
  return {
    ...draft,
    suggestedChanges: draft.suggestedChanges.map((change) => ({ ...change })),
    affectedEntityIds: [...draft.affectedEntityIds]
  };
}

class DeterministicAdkRecommendationAdapter implements AdkRecommendationAdapter {
  constructor(private readonly fixtureId?: string) {}

  async generate(input: RecommendationGenerationInput): Promise<RecommendationDraft> {
    if (this.fixtureId) {
      const fixture = RECOMMENDATION_GOLDEN_FIXTURES[this.fixtureId];
      if (!fixture) {
        throw new OrgModelError("FIXTURE_NOT_FOUND", `Recommendation fixture ${this.fixtureId} does not exist`);
      }
      return cloneRecommendationDraft(fixture);
    }

    const targetEntityId = input.constraints[0]?.targetEntityId ?? "platform";
    return {
      suggestedChanges: [
        {
          action: "reparent_unit",
          entityId: targetEntityId,
          targetParentId: "ops",
          reason: `Align ${targetEntityId} with operating model goals for scenario ${input.scenarioId}.`
        }
      ],
      rationale: `Recommendation generated from baseline ${input.baselineId} and scenario ${input.scenarioId}.`,
      confidenceScore: 0.81,
      affectedEntityIds: [targetEntityId, "ops"],
      createdAt: "2026-04-11T00:00:00.000Z"
    };
  }
}

export class InMemoryOrgModelDriver {
  private readonly scopes = new Map<string, ScopeView>();
  private readonly baselines = new Map<
    string,
    { baselineId: string; scopeId: string; units: Map<string, { id: string; name: string; parentId?: string }> }
  >();
  private readonly scenarios = new Map<string, ScenarioView>();
  private readonly recommendations = new Map<string, RecommendationArtifact>();
  private readonly recommendationIdempotencyIndex = new Map<string, string>();
  private readonly scenarioScores = new Map<string, ScenarioScore>();
  private readonly scenarioRankingsByBaseline = new Map<string, string[]>();
  private recommendationCounter = 0;
  private recommendationAdapter: AdkRecommendationAdapter = new DeterministicAdkRecommendationAdapter();

  createScope(scopeId: string): void {
    if (!this.scopes.has(scopeId)) {
      this.scopes.set(scopeId, {
        scopeId,
        units: new Map(),
        normalizedExternalToInternal: new Map()
      });
    }
  }

  getScope(scopeId: string): ScopeView {
    const scope = this.scopes.get(scopeId);
    if (!scope) {
      throw new OrgModelError("SCOPE_NOT_FOUND", `Scope ${scopeId} does not exist`);
    }
    return scope;
  }

  createRootAndUnit(scopeId: string, rootOrgId: string, unitId: string, name = unitId): void {
    const scope = this.getScope(scopeId);
    scope.rootOrgId = rootOrgId;
    scope.units.set(unitId, { id: unitId, name });
  }

  addUnit(scopeId: string, unitId: string, name = unitId): void {
    const scope = this.getScope(scopeId);
    scope.units.set(unitId, { id: unitId, name });
  }

  addReportingLine(scopeId: string, childId: string, parentId: string): void {
    const scope = this.getScope(scopeId);
    if (!scope.units.has(childId) || !scope.units.has(parentId)) {
      throw new OrgModelError("UNIT_NOT_FOUND", "Child or parent unit does not exist");
    }

    const path = new Set<string>();
    let cursor: string | undefined = parentId;
    while (cursor) {
      if (cursor === childId) {
        throw new OrgModelError("CYCLE_DETECTED", "Reporting line introduces a cycle");
      }
      if (path.has(cursor)) {
        break;
      }
      path.add(cursor);
      cursor = scope.units.get(cursor)?.parentId;
    }

    const child = scope.units.get(childId);
    if (!child) {
      throw new OrgModelError("UNIT_NOT_FOUND", `Unit ${childId} does not exist`);
    }
    scope.units.set(childId, { ...child, parentId });
  }

  getDepth(scopeId: string, unitId: string): number {
    const scope = this.getScope(scopeId);
    let depth = 0;
    let cursor = scope.units.get(unitId)?.parentId;
    while (cursor) {
      depth += 1;
      cursor = scope.units.get(cursor)?.parentId;
    }
    return depth;
  }

  commitBaseline(scopeId: string, baselineId: string): void {
    const scope = this.getScope(scopeId);
    this.baselines.set(baselineId, {
      baselineId,
      scopeId,
      units: cloneUnits(scope.units)
    });
  }

  createScenarioFromBaseline(baselineId: string, scenarioId: string): void {
    const baseline = this.baselines.get(baselineId);
    if (!baseline) {
      throw new OrgModelError("BASELINE_NOT_FOUND", `Baseline ${baselineId} does not exist`);
    }
    this.scenarios.set(scenarioId, {
      scenarioId,
      scopeId: baseline.scopeId,
      baselineId,
      state: "draft",
      units: cloneUnits(baseline.units)
    });
  }

  addUnitToScenario(scenarioId: string, unitId: string, name = unitId): void {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    scenario.units.set(unitId, { id: unitId, name });
  }

  removeUnitFromScenario(scenarioId: string, unitId: string): void {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    if (scenario.state !== "draft") {
      throw new OrgModelError("SCENARIO_NOT_DRAFT", "Only draft scenarios can be edited");
    }
    scenario.units.delete(unitId);
    for (const [id, unit] of scenario.units.entries()) {
      if (unit.parentId === unitId) {
        scenario.units.set(id, { ...unit, parentId: undefined });
      }
    }
  }

  resetScenarioToBaseline(scenarioId: string): void {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    if (scenario.state !== "draft") {
      throw new OrgModelError("SCENARIO_NOT_DRAFT", "Only draft scenarios can be edited");
    }
    const baseline = this.baselines.get(scenario.baselineId);
    if (!baseline) {
      throw new OrgModelError("BASELINE_NOT_FOUND", `Baseline ${scenario.baselineId} does not exist`);
    }
    scenario.units = cloneUnits(baseline.units);
  }

  moveScenarioSubtree(scenarioId: string, unitId: string, nextParentId: string): void {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    if (scenario.state !== "draft") {
      throw new OrgModelError("SCENARIO_NOT_DRAFT", "Only draft scenarios can be edited");
    }

    const unit = scenario.units.get(unitId);
    const nextParent = scenario.units.get(nextParentId);
    if (!unit || !nextParent) {
      throw new OrgModelError("UNIT_NOT_FOUND", "Scenario unit or parent unit does not exist");
    }

    let cursor: string | undefined = nextParentId;
    while (cursor) {
      if (cursor === unitId) {
        throw new OrgModelError("CYCLE_DETECTED", "Scenario move would introduce a cycle");
      }
      cursor = scenario.units.get(cursor)?.parentId;
    }

    scenario.units.set(unitId, { ...unit, parentId: nextParentId });
  }

  markScenarioReady(scenarioId: string): void {
    this.transitionScenarioState(scenarioId, "ready");
  }

  archiveScenario(scenarioId: string): void {
    this.transitionScenarioState(scenarioId, "archived");
  }

  getScenarioState(scenarioId: string): ScenarioState {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    return scenario.state;
  }

  scenarioHasUnit(scenarioId: string, unitId: string): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    return scenario.units.has(unitId);
  }

  baselineHasUnit(baselineId: string, unitId: string): boolean {
    const baseline = this.baselines.get(baselineId);
    if (!baseline) {
      throw new OrgModelError("BASELINE_NOT_FOUND", `Baseline ${baselineId} does not exist`);
    }
    return baseline.units.has(unitId);
  }

  scenarioParentOf(scenarioId: string, unitId: string): string | undefined {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    return scenario.units.get(unitId)?.parentId;
  }

  baselineParentOf(baselineId: string, unitId: string): string | undefined {
    const baseline = this.baselines.get(baselineId);
    if (!baseline) {
      throw new OrgModelError("BASELINE_NOT_FOUND", `Baseline ${baselineId} does not exist`);
    }
    return baseline.units.get(unitId)?.parentId;
  }

  scoreScenarioAgainstBaseline(scenarioId: string, baselineId?: string): ScenarioScore {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    if (baselineId && scenario.baselineId !== baselineId) {
      throw new OrgModelError("BASELINE_SCENARIO_MISMATCH", `Scenario ${scenarioId} does not belong to ${baselineId}`);
    }
    const baseline = this.baselines.get(scenario.baselineId);
    if (!baseline) {
      throw new OrgModelError("BASELINE_NOT_FOUND", `Baseline ${scenario.baselineId} does not exist`);
    }

    const baselineIds = new Set(baseline.units.keys());
    const scenarioIds = new Set(scenario.units.keys());
    const commonIds = [...scenarioIds].filter((id) => baselineIds.has(id));

    let reparentedCount = 0;
    for (const unitId of commonIds) {
      if (scenario.units.get(unitId)?.parentId !== baseline.units.get(unitId)?.parentId) {
        reparentedCount += 1;
      }
    }

    const addedCount = [...scenarioIds].filter((id) => !baselineIds.has(id)).length;
    const removedCount = [...baselineIds].filter((id) => !scenarioIds.has(id)).length;

    const overallError = Number((addedCount + removedCount + reparentedCount).toFixed(3));
    const normalizedScore = Number((1 / (1 + overallError)).toFixed(3));
    const contributors: string[] = [];
    if (reparentedCount > 0) {
      contributors.push(`parent_link_drift:${reparentedCount}`);
    }
    if (addedCount > 0) {
      contributors.push(`added:${addedCount}`);
    }
    if (removedCount > 0) {
      contributors.push(`removed:${removedCount}`);
    }
    if (contributors.length === 0) {
      contributors.push("no_structural_drift");
    }

    const score = { overallError, normalizedScore, contributors };
    this.scenarioScores.set(scenarioId, score);
    return score;
  }

  compareScenariosAgainstBaseline(baselineId: string, scenarioIds: string[]): string[] {
    const baseline = this.baselines.get(baselineId);
    if (!baseline) {
      throw new OrgModelError("BASELINE_NOT_FOUND", `Baseline ${baselineId} does not exist`);
    }
    const candidates = scenarioIds.map((scenarioId) => {
      const scenario = this.scenarios.get(scenarioId);
      if (!scenario) {
        throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
      }
      if (scenario.baselineId !== baselineId) {
        throw new OrgModelError("BASELINE_SCENARIO_MISMATCH", `Scenario ${scenarioId} does not belong to ${baselineId}`);
      }
      return { scenarioId, score: this.scoreScenarioAgainstBaseline(scenarioId) };
    });

    candidates.sort((a, b) => {
      const normalizedDelta = b.score.normalizedScore - a.score.normalizedScore;
      if (normalizedDelta !== 0) {
        return normalizedDelta;
      }
      const errorDelta = a.score.overallError - b.score.overallError;
      if (errorDelta !== 0) {
        return errorDelta;
      }
      return a.scenarioId.localeCompare(b.scenarioId);
    });
    const ranked = candidates.map((entry) => entry.scenarioId);
    this.scenarioRankingsByBaseline.set(baselineId, ranked);
    return ranked;
  }

  rankScenariosForBaseline(baselineId: string): string[] {
    const scenarioIds = [...this.scenarios.values()]
      .filter((scenario) => scenario.baselineId === baselineId)
      .map((scenario) => scenario.scenarioId);
    return this.compareScenariosAgainstBaseline(baselineId, scenarioIds);
  }

  getScenarioScore(scenarioId: string): ScenarioScore {
    const score = this.scenarioScores.get(scenarioId);
    if (!score) {
      throw new OrgModelError("SCENARIO_SCORE_NOT_FOUND", `Scenario ${scenarioId} has not been scored`);
    }
    return {
      overallError: score.overallError,
      normalizedScore: score.normalizedScore,
      contributors: [...score.contributors]
    };
  }

  getScenarioRankings(baselineId: string): Array<{ scenarioId: string }> {
    const rankings = this.scenarioRankingsByBaseline.get(baselineId) ?? [];
    return rankings.map((scenarioId) => ({ scenarioId }));
  }

  listScenarioIdsForBaseline(baselineId: string): string[] {
    return [...this.scenarios.values()]
      .filter((scenario) => scenario.baselineId === baselineId)
      .map((scenario) => scenario.scenarioId)
      .sort((a, b) => a.localeCompare(b));
  }

  useRecommendationFixture(fixtureId: string): void {
    this.recommendationAdapter = new DeterministicAdkRecommendationAdapter(fixtureId);
  }

  async requestRecommendation(request: RecommendationRequest): Promise<RecommendationArtifact> {
    if (
      !request.scopeId ||
      !request.baselineId ||
      !request.scenarioId ||
      !Array.isArray(request.constraints) ||
      !Array.isArray(request.metricSnapshots)
    ) {
      throw new OrgModelError(
        "INVALID_RECOMMENDATION_REQUEST",
        "Recommendation request must include scopeId, baselineId, scenarioId, constraints, and metricSnapshots"
      );
    }

    const baseline = this.baselines.get(request.baselineId);
    if (!baseline) {
      throw new OrgModelError("BASELINE_NOT_FOUND", `Baseline ${request.baselineId} does not exist`);
    }
    const scenario = this.scenarios.get(request.scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${request.scenarioId} does not exist`);
    }
    if (baseline.scopeId !== request.scopeId || scenario.scopeId !== request.scopeId) {
      throw new OrgModelError("SCOPE_MISMATCH", "Baseline/scenario must belong to request scope");
    }

    if (request.idempotencyKey) {
      const idempotencyMapKey = `${request.scopeId}:${request.idempotencyKey}`;
      const existingRecommendationId = this.recommendationIdempotencyIndex.get(idempotencyMapKey);
      if (existingRecommendationId) {
        return this.getRecommendation(existingRecommendationId);
      }
    }

    const draft = await this.recommendationAdapter.generate({
      scopeId: request.scopeId,
      baselineId: request.baselineId,
      scenarioId: request.scenarioId,
      constraints: request.constraints,
      metricSnapshots: request.metricSnapshots
    });

    if (draft.suggestedChanges.length === 0) {
      throw new OrgModelError("INVALID_RECOMMENDATION_DRAFT", "Recommendation draft must include suggested changes");
    }
    if (draft.confidenceScore < 0 || draft.confidenceScore > 1) {
      throw new OrgModelError("INVALID_RECOMMENDATION_DRAFT", "Confidence score must be between 0 and 1");
    }

    const recommendationId = `rec:${request.scopeId}:${++this.recommendationCounter}`;
    const artifact: RecommendationArtifact = {
      recommendationId,
      scopeId: request.scopeId,
      baselineId: request.baselineId,
      scenarioId: request.scenarioId,
      state: "proposed",
      ...cloneRecommendationDraft(draft)
    };

    this.recommendations.set(recommendationId, artifact);
    if (request.idempotencyKey) {
      this.recommendationIdempotencyIndex.set(`${request.scopeId}:${request.idempotencyKey}`, recommendationId);
    }

    return this.getRecommendation(recommendationId);
  }

  acceptRecommendation(recommendationId: string, reviewedBy?: string, reviewedAt?: string): void {
    this.transitionRecommendationState(recommendationId, "accepted", reviewedBy, reviewedAt);
  }

  rejectRecommendation(recommendationId: string, reviewedBy?: string, reviewedAt?: string): void {
    this.transitionRecommendationState(recommendationId, "rejected", reviewedBy, reviewedAt);
  }

  supersedeRecommendation(recommendationId: string, reviewedBy?: string, reviewedAt?: string): void {
    this.transitionRecommendationState(recommendationId, "superseded", reviewedBy, reviewedAt);
  }

  getRecommendation(recommendationId: string): RecommendationArtifact {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new OrgModelError("RECOMMENDATION_NOT_FOUND", `Recommendation ${recommendationId} does not exist`);
    }
    return {
      ...recommendation,
      suggestedChanges: recommendation.suggestedChanges.map((change) => ({ ...change })),
      affectedEntityIds: [...recommendation.affectedEntityIds]
    };
  }

  ingest(payload: IngestPayload): { scopeId: string; unitCount: number } {
    if (!payload.scopeId || !Array.isArray(payload.units)) {
      throw new OrgModelError("INVALID_SCHEMA", "Payload must include scopeId and units array");
    }

    const seen = new Set<string>();
    for (const unit of payload.units) {
      if (!unit.externalId || !unit.name) {
        throw new OrgModelError("INVALID_SCHEMA", "Each unit must include externalId and name");
      }
      if (seen.has(unit.externalId)) {
        throw new OrgModelError("DUPLICATE_EXTERNAL_KEY", `Duplicate key ${unit.externalId}`);
      }
      seen.add(unit.externalId);
    }

    this.createScope(payload.scopeId);
    const scope = this.getScope(payload.scopeId);

    for (const unit of payload.units) {
      const externalId = unit.externalId as string;
      const internalId = `unit:${payload.scopeId}:${externalId}`;
      scope.normalizedExternalToInternal.set(externalId, internalId);
      scope.units.set(internalId, { id: internalId, name: unit.name as string });
    }

    for (const unit of payload.units) {
      const externalId = unit.externalId as string;
      if (!unit.parentExternalId) {
        continue;
      }
      const childInternalId = scope.normalizedExternalToInternal.get(externalId);
      const parentInternalId = scope.normalizedExternalToInternal.get(unit.parentExternalId);
      if (!childInternalId || !parentInternalId) {
        throw new OrgModelError("INVALID_SCHEMA", "parentExternalId must reference another unit");
      }
      const child = scope.units.get(childInternalId);
      if (!child) {
        throw new OrgModelError("UNIT_NOT_FOUND", `Unit ${childInternalId} not found`);
      }
      scope.units.set(childInternalId, { ...child, parentId: parentInternalId });
    }

    this.assertReportingGraphAcyclic(scope);

    return {
      scopeId: payload.scopeId,
      unitCount: scope.units.size
    };
  }

  getNormalizedInternalId(scopeId: string, externalId: string): string | undefined {
    return this.getScope(scopeId).normalizedExternalToInternal.get(externalId);
  }

  /** Ensures parent links form a DAG (no reporting cycles). */
  private assertReportingGraphAcyclic(scope: ScopeView): void {
    for (const startId of scope.units.keys()) {
      const seenOnPath = new Set<string>();
      let cursor: string | undefined = startId;
      while (cursor) {
        if (seenOnPath.has(cursor)) {
          throw new OrgModelError("CYCLE_DETECTED", "Ingest introduces a reporting cycle");
        }
        seenOnPath.add(cursor);
        cursor = scope.units.get(cursor)?.parentId;
      }
    }
  }

  private transitionScenarioState(scenarioId: string, targetState: ScenarioState): void {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }

    const allowedTransitions: Record<ScenarioState, readonly ScenarioState[]> = {
      draft: ["ready"],
      ready: ["archived"],
      archived: []
    };

    if (!allowedTransitions[scenario.state].includes(targetState)) {
      throw new OrgModelError(
        "INVALID_SCENARIO_STATE_TRANSITION",
        `Cannot transition scenario ${scenarioId} from ${scenario.state} to ${targetState}`
      );
    }

    scenario.state = targetState;
  }

  private transitionRecommendationState(
    recommendationId: string,
    targetState: RecommendationState,
    reviewedBy?: string,
    reviewedAt?: string
  ): void {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new OrgModelError("RECOMMENDATION_NOT_FOUND", `Recommendation ${recommendationId} does not exist`);
    }

    const allowedTransitions: Record<RecommendationState, readonly RecommendationState[]> = {
      proposed: ["accepted", "rejected", "superseded"],
      accepted: [],
      rejected: [],
      superseded: []
    };
    if (!allowedTransitions[recommendation.state].includes(targetState)) {
      throw new OrgModelError(
        "INVALID_RECOMMENDATION_STATE_TRANSITION",
        `Cannot transition recommendation ${recommendationId} from ${recommendation.state} to ${targetState}`
      );
    }

    recommendation.state = targetState;
    recommendation.reviewedBy = reviewedBy;
    recommendation.reviewedAt = reviewedAt ?? new Date().toISOString();
  }
}
