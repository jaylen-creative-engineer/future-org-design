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

export interface ScenarioScoringWeights {
  headcount: number;
  spanCompliance: number;
  complexity: number;
}

export interface ScenarioScoringRequest {
  targetSpan?: number;
  maxDepth?: number;
  weights?: Partial<ScenarioScoringWeights>;
  blockReadyOnViolation?: boolean;
}

export interface ScenarioScorecard {
  scenarioId: string;
  baselineId: string;
  totalScore: number;
  headcountScore: number;
  spanComplianceScore: number;
  complexityScore: number;
  headcountDelta: number;
  spanViolations: number;
  complexityChangeCount: number;
  maxDepth: number;
  violationCodes: string[];
  readyBlocked: boolean;
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

const DEFAULT_SCENARIO_SCORING_WEIGHTS: Readonly<ScenarioScoringWeights> = {
  headcount: 0.34,
  spanCompliance: 0.33,
  complexity: 0.33
};

function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function normalizeScoringWeights(weights?: Partial<ScenarioScoringWeights>): ScenarioScoringWeights {
  const merged: ScenarioScoringWeights = {
    headcount: weights?.headcount ?? DEFAULT_SCENARIO_SCORING_WEIGHTS.headcount,
    spanCompliance: weights?.spanCompliance ?? DEFAULT_SCENARIO_SCORING_WEIGHTS.spanCompliance,
    complexity: weights?.complexity ?? DEFAULT_SCENARIO_SCORING_WEIGHTS.complexity
  };

  if (merged.headcount < 0 || merged.spanCompliance < 0 || merged.complexity < 0) {
    throw new OrgModelError("INVALID_SCORING_WEIGHTS", "Scenario scoring weights must be non-negative");
  }

  const weightSum = merged.headcount + merged.spanCompliance + merged.complexity;
  if (weightSum <= 0) {
    throw new OrgModelError("INVALID_SCORING_WEIGHTS", "Scenario scoring weights must sum to a positive value");
  }

  return {
    headcount: merged.headcount / weightSum,
    spanCompliance: merged.spanCompliance / weightSum,
    complexity: merged.complexity / weightSum
  };
}

function cloneScenarioScorecard(scorecard: ScenarioScorecard): ScenarioScorecard {
  return {
    ...scorecard,
    violationCodes: [...scorecard.violationCodes]
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
  private readonly scenarioScores = new Map<string, ScenarioScorecard>();
  private readonly recommendations = new Map<string, RecommendationArtifact>();
  private readonly recommendationIdempotencyIndex = new Map<string, string>();
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

  scoreScenario(scenarioId: string, request: ScenarioScoringRequest): ScenarioScorecard {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new OrgModelError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }
    const baseline = this.baselines.get(scenario.baselineId);
    if (!baseline) {
      throw new OrgModelError("BASELINE_NOT_FOUND", `Baseline ${scenario.baselineId} does not exist`);
    }
    if (typeof request.targetSpan !== "number" || request.targetSpan < 0) {
      throw new OrgModelError("INVALID_SCORING_REQUEST", "Scenario scoring targetSpan must be a non-negative number");
    }
    if (typeof request.maxDepth !== "number" || request.maxDepth < 0) {
      throw new OrgModelError("INVALID_SCORING_REQUEST", "Scenario scoring maxDepth must be a non-negative number");
    }

    const normalizedWeights = normalizeScoringWeights(request.weights);
    const scenarioUnitIds = [...scenario.units.keys()].sort((left, right) => left.localeCompare(right));

    const directReportCount = new Map<string, number>();
    for (const unit of scenario.units.values()) {
      if (!unit.parentId) {
        continue;
      }
      directReportCount.set(unit.parentId, (directReportCount.get(unit.parentId) ?? 0) + 1);
    }

    const depthByUnit = new Map<string, number>();
    const getDepth = (unitId: string): number => {
      const knownDepth = depthByUnit.get(unitId);
      if (knownDepth !== undefined) {
        return knownDepth;
      }

      let depth = 0;
      let cursor = scenario.units.get(unitId)?.parentId;
      const visited = new Set<string>([unitId]);
      while (cursor) {
        if (visited.has(cursor)) {
          throw new OrgModelError("CYCLE_DETECTED", "Scenario contains a cycle and cannot be scored");
        }
        visited.add(cursor);
        depth += 1;
        cursor = scenario.units.get(cursor)?.parentId;
      }
      depthByUnit.set(unitId, depth);
      return depth;
    };

    let maxDepth = 0;
    for (const unitId of scenarioUnitIds) {
      maxDepth = Math.max(maxDepth, getDepth(unitId));
    }

    let spanViolations = 0;
    for (const unitId of scenarioUnitIds) {
      const directCount = directReportCount.get(unitId) ?? 0;
      if (directCount > request.targetSpan) {
        spanViolations += directCount - request.targetSpan;
      }
    }

    const complexityChangeCount = scenarioUnitIds.reduce((changes, unitId) => {
      const scenarioParentId = scenario.units.get(unitId)?.parentId;
      const baselineParentId = baseline.units.get(unitId)?.parentId;
      return scenarioParentId === baselineParentId ? changes : changes + 1;
    }, 0);
    const baselineSize = Math.max(1, baseline.units.size);
    const scenarioSize = Math.max(1, scenario.units.size);

    const headcountDelta = scenario.units.size - baseline.units.size;
    const headcountScore = clamp01(1 - Math.abs(headcountDelta) / baselineSize);
    const spanComplianceScore = clamp01(1 - spanViolations / scenarioSize);
    const complexityScore = clamp01(1 - complexityChangeCount / scenarioSize);

    const violationCodes: string[] = [];
    if (spanViolations > 0) {
      violationCodes.push("SPAN_TARGET_EXCEEDED");
    }
    if (maxDepth > request.maxDepth) {
      violationCodes.push("MAX_DEPTH_EXCEEDED");
    }

    const totalScore = clamp01(
      headcountScore * normalizedWeights.headcount +
        spanComplianceScore * normalizedWeights.spanCompliance +
        complexityScore * normalizedWeights.complexity
    );

    const scorecard: ScenarioScorecard = {
      scenarioId,
      baselineId: scenario.baselineId,
      totalScore,
      headcountScore,
      spanComplianceScore,
      complexityScore,
      headcountDelta,
      spanViolations,
      complexityChangeCount,
      maxDepth,
      violationCodes,
      readyBlocked: (request.blockReadyOnViolation ?? false) && violationCodes.length > 0
    };
    this.scenarioScores.set(scenarioId, scorecard);
    return cloneScenarioScorecard(scorecard);
  }

  rankScenarios(scenarioIds: string[], request: ScenarioScoringRequest): ScenarioScorecard[] {
    const uniqueScenarioIds = [...new Set(scenarioIds)];
    const scorecards = uniqueScenarioIds.map((scenarioId) => this.scoreScenario(scenarioId, request));
    scorecards.sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }
      if (left.violationCodes.length !== right.violationCodes.length) {
        return left.violationCodes.length - right.violationCodes.length;
      }
      return left.scenarioId.localeCompare(right.scenarioId);
    });
    return scorecards;
  }

  markScenarioReadyWithScoring(scenarioId: string, request: ScenarioScoringRequest): ScenarioScorecard {
    const scorecard = this.scoreScenario(scenarioId, request);
    if (scorecard.readyBlocked) {
      throw new OrgModelError(
        "SCENARIO_CONSTRAINTS_VIOLATED",
        `Scenario ${scenarioId} violates scoring constraints and cannot transition to ready`
      );
    }
    this.markScenarioReady(scenarioId);
    return scorecard;
  }

  getScenarioScore(scenarioId: string): ScenarioScorecard {
    const scorecard = this.scenarioScores.get(scenarioId);
    if (!scorecard) {
      throw new OrgModelError("SCENARIO_SCORE_NOT_FOUND", `Scenario ${scenarioId} has not been scored`);
    }
    return cloneScenarioScorecard(scorecard);
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
