import { Pool, type PoolClient } from "pg";
import type {
  BaselineRecord,
  OrgModelRepository,
  RecommendationRecord,
  ScenarioRecord,
  ScopeRecord,
  UnitRecord
} from "./repository.js";
import { OrgPersistenceError } from "./repository.js";
import { loadOrgCliEnv } from "./env.js";

type Queryable = Pool | PoolClient;

const SCHEMA_SQL = `
create schema if not exists org_model;

create table if not exists org_model.scopes (
  scope_id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists org_model.units (
  scope_id text not null references org_model.scopes(scope_id) on delete cascade,
  unit_id text not null,
  name text not null,
  parent_id text,
  created_at timestamptz not null default now(),
  primary key (scope_id, unit_id),
  foreign key (scope_id, parent_id)
    references org_model.units(scope_id, unit_id)
    on delete set null
);

create table if not exists org_model.baselines (
  baseline_id text primary key,
  scope_id text not null references org_model.scopes(scope_id) on delete cascade,
  snapshot_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists org_model.scenarios (
  scenario_id text primary key,
  scope_id text not null references org_model.scopes(scope_id) on delete cascade,
  baseline_id text not null references org_model.baselines(baseline_id) on delete restrict,
  state text not null check (state in ('draft','ready','archived')),
  created_at timestamptz not null default now()
);

create table if not exists org_model.scenario_units (
  scenario_id text not null references org_model.scenarios(scenario_id) on delete cascade,
  unit_id text not null,
  name text not null,
  parent_id text,
  created_at timestamptz not null default now(),
  primary key (scenario_id, unit_id)
);

create table if not exists org_model.recommendations (
  recommendation_id text primary key,
  scope_id text not null references org_model.scopes(scope_id) on delete cascade,
  baseline_id text not null references org_model.baselines(baseline_id) on delete restrict,
  scenario_id text not null references org_model.scenarios(scenario_id) on delete restrict,
  state text not null check (state in ('proposed','accepted','rejected','superseded')),
  rationale text not null,
  confidence_score numeric(6,5) not null check (confidence_score >= 0 and confidence_score <= 1),
  created_at timestamptz not null default now()
);
`;

export class PostgresOrgModelRepository implements OrgModelRepository {
  private readonly pool: Pool;

  constructor() {
    const env = loadOrgCliEnv();
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: env.DB_POOL_MAX,
      idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: env.DB_CONN_TIMEOUT_MS
    });
  }

  async ensureSchema(): Promise<void> {
    await this.pool.query(SCHEMA_SQL);
  }

  async createScope(scopeId: string, name: string): Promise<void> {
    await this.pool.query(
      `
      insert into org_model.scopes (scope_id, name)
      values ($1, $2)
      on conflict (scope_id) do update
      set name = excluded.name
      `,
      [scopeId, name]
    );
  }

  async listScopes(): Promise<ScopeRecord[]> {
    const result = await this.pool.query<ScopeRecord>(
      `
      select scope_id as "scopeId", name, created_at::text as "createdAt"
      from org_model.scopes
      order by created_at desc
      `
    );
    return result.rows;
  }

  async upsertUnit(scopeId: string, unitId: string, name: string): Promise<void> {
    await this.pool.query(
      `
      insert into org_model.units (scope_id, unit_id, name)
      values ($1, $2, $3)
      on conflict (scope_id, unit_id) do update
      set name = excluded.name
      `,
      [scopeId, unitId, name]
    );
  }

  async listUnits(scopeId: string): Promise<UnitRecord[]> {
    const result = await this.pool.query<UnitRecord>(
      `
      select
        scope_id as "scopeId",
        unit_id as "unitId",
        name,
        parent_id as "parentId",
        created_at::text as "createdAt"
      from org_model.units
      where scope_id = $1
      order by unit_id asc
      `,
      [scopeId]
    );
    return result.rows;
  }

  async addReportingLine(scopeId: string, childId: string, parentId: string): Promise<void> {
    await this.withTx(async (tx) => {
      const childExists = await this.unitExists(tx, scopeId, childId);
      const parentExists = await this.unitExists(tx, scopeId, parentId);
      if (!childExists || !parentExists) {
        throw new OrgPersistenceError("UNIT_NOT_FOUND", "Child or parent unit does not exist");
      }
      if (childId === parentId) {
        throw new OrgPersistenceError("CYCLE_DETECTED", "A unit cannot report to itself");
      }

      const cycleResult = await tx.query<{ hasCycle: boolean }>(
        `
        with recursive lineage(unit_id, parent_id) as (
          select unit_id, parent_id
          from org_model.units
          where scope_id = $1 and unit_id = $2
          union all
          select u.unit_id, u.parent_id
          from org_model.units u
          join lineage l
            on u.scope_id = $1
           and u.unit_id = l.parent_id
        )
        select exists(
          select 1 from lineage where parent_id = $3
        ) as "hasCycle"
        `,
        [scopeId, parentId, childId]
      );
      if (cycleResult.rows[0]?.hasCycle) {
        throw new OrgPersistenceError("CYCLE_DETECTED", "Reporting line introduces a cycle");
      }

      await tx.query(
        `
        update org_model.units
        set parent_id = $3
        where scope_id = $1 and unit_id = $2
        `,
        [scopeId, childId, parentId]
      );
    });
  }

  async createBaseline(scopeId: string, baselineId: string): Promise<void> {
    const units = await this.listUnits(scopeId);
    await this.pool.query(
      `
      insert into org_model.baselines (baseline_id, scope_id, snapshot_json)
      values ($1, $2, $3::jsonb)
      on conflict (baseline_id) do update
      set snapshot_json = excluded.snapshot_json
      `,
      [baselineId, scopeId, JSON.stringify(units)]
    );
  }

  async listBaselines(scopeId: string): Promise<BaselineRecord[]> {
    const result = await this.pool.query<BaselineRecord>(
      `
      select
        baseline_id as "baselineId",
        scope_id as "scopeId",
        snapshot_json::text as "snapshotJson",
        created_at::text as "createdAt"
      from org_model.baselines
      where scope_id = $1
      order by created_at desc
      `,
      [scopeId]
    );
    return result.rows;
  }

  async createScenarioFromBaseline(scopeId: string, baselineId: string, scenarioId: string): Promise<void> {
    await this.withTx(async (tx) => {
      const baselineRows = await tx.query<{ snapshot_json: UnitRecord[] }>(
        `
        select snapshot_json
        from org_model.baselines
        where scope_id = $1 and baseline_id = $2
        `,
        [scopeId, baselineId]
      );
      const snapshot = baselineRows.rows[0]?.snapshot_json;
      if (!snapshot) {
        throw new OrgPersistenceError("BASELINE_NOT_FOUND", `Baseline ${baselineId} does not exist`);
      }

      await tx.query(
        `
        insert into org_model.scenarios (scenario_id, scope_id, baseline_id, state)
        values ($1, $2, $3, 'draft')
        on conflict (scenario_id) do update
        set baseline_id = excluded.baseline_id, state = 'draft'
        `,
        [scenarioId, scopeId, baselineId]
      );

      await tx.query(`delete from org_model.scenario_units where scenario_id = $1`, [scenarioId]);
      for (const unit of snapshot) {
        await tx.query(
          `
          insert into org_model.scenario_units (scenario_id, unit_id, name, parent_id)
          values ($1, $2, $3, $4)
          `,
          [scenarioId, unit.unitId, unit.name, unit.parentId ?? null]
        );
      }
    });
  }

  async listScenarios(scopeId: string): Promise<ScenarioRecord[]> {
    const result = await this.pool.query<ScenarioRecord>(
      `
      select
        scenario_id as "scenarioId",
        scope_id as "scopeId",
        baseline_id as "baselineId",
        state,
        created_at::text as "createdAt"
      from org_model.scenarios
      where scope_id = $1
      order by created_at desc
      `,
      [scopeId]
    );
    return result.rows;
  }

  async getBaselineUnits(scopeId: string, baselineId: string): Promise<UnitRecord[]> {
    const result = await this.pool.query<{ snapshot_json: UnitRecord[] }>(
      `
      select snapshot_json
      from org_model.baselines
      where scope_id = $1 and baseline_id = $2
      `,
      [scopeId, baselineId]
    );
    const snapshot = result.rows[0]?.snapshot_json;
    if (!snapshot) {
      throw new OrgPersistenceError("BASELINE_NOT_FOUND", `Baseline ${baselineId} does not exist`);
    }
    return snapshot.map((unit) => ({ ...unit }));
  }

  async getScenarioUnits(scopeId: string, scenarioId: string): Promise<UnitRecord[]> {
    const scenarioResult = await this.pool.query<{ present: boolean }>(
      `
      select exists(
        select 1 from org_model.scenarios where scope_id = $1 and scenario_id = $2
      ) as present
      `,
      [scopeId, scenarioId]
    );
    if (!scenarioResult.rows[0]?.present) {
      throw new OrgPersistenceError("SCENARIO_NOT_FOUND", `Scenario ${scenarioId} does not exist`);
    }

    const result = await this.pool.query<UnitRecord>(
      `
      select
        s.scope_id as "scopeId",
        su.unit_id as "unitId",
        su.name,
        su.parent_id as "parentId",
        su.created_at::text as "createdAt"
      from org_model.scenario_units su
      join org_model.scenarios s
        on s.scenario_id = su.scenario_id
      where s.scope_id = $1 and s.scenario_id = $2
      order by su.unit_id asc
      `,
      [scopeId, scenarioId]
    );
    return result.rows;
  }

  async createRecommendation(
    scopeId: string,
    baselineId: string,
    scenarioId: string,
    rationale: string,
    confidenceScore: number
  ): Promise<void> {
    const recommendationId = `rec:${scopeId}:${Date.now()}`;
    await this.pool.query(
      `
      insert into org_model.recommendations
      (recommendation_id, scope_id, baseline_id, scenario_id, state, rationale, confidence_score)
      values ($1, $2, $3, $4, 'proposed', $5, $6)
      `,
      [recommendationId, scopeId, baselineId, scenarioId, rationale, confidenceScore]
    );
  }

  async listRecommendations(scopeId: string): Promise<RecommendationRecord[]> {
    const result = await this.pool.query<RecommendationRecord>(
      `
      select
        recommendation_id as "recommendationId",
        scope_id as "scopeId",
        baseline_id as "baselineId",
        scenario_id as "scenarioId",
        state,
        rationale,
        confidence_score::float8 as "confidenceScore",
        created_at::text as "createdAt"
      from org_model.recommendations
      where scope_id = $1
      order by created_at desc
      `,
      [scopeId]
    );
    return result.rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async unitExists(queryable: Queryable, scopeId: string, unitId: string): Promise<boolean> {
    const result = await queryable.query<{ present: boolean }>(
      `
      select exists(
        select 1 from org_model.units where scope_id = $1 and unit_id = $2
      ) as present
      `,
      [scopeId, unitId]
    );
    return result.rows[0]?.present ?? false;
  }

  private async withTx<T>(work: (tx: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await work(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      if (error instanceof OrgPersistenceError) {
        throw error;
      }
      throw new OrgPersistenceError("POSTGRES_ERROR", `Database operation failed: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }
}
