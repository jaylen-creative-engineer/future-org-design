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
  baselineId: string;
  units: Map<string, { id: string; name: string; parentId?: string }>;
}

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

export class InMemoryOrgModelDriver {
  private readonly scopes = new Map<string, ScopeView>();
  private readonly baselines = new Map<
    string,
    { baselineId: string; scopeId: string; units: Map<string, { id: string; name: string; parentId?: string }> }
  >();
  private readonly scenarios = new Map<string, ScenarioView>();

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
      baselineId,
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

    return {
      scopeId: payload.scopeId,
      unitCount: scope.units.size
    };
  }

  getNormalizedInternalId(scopeId: string, externalId: string): string | undefined {
    return this.getScope(scopeId).normalizedExternalToInternal.get(externalId);
  }
}
