import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UnitRecord } from "./repository.js";

type QueryResult = { rows: unknown[] };

const pgMocks = vi.hoisted(() => {
  const client = {
    query: vi.fn<(...args: unknown[]) => Promise<QueryResult>>(),
    release: vi.fn(),
  };
  const pool = {
    connect: vi.fn<() => Promise<typeof client>>(),
    query: vi.fn(),
    end: vi.fn(),
  };

  return {
    client,
    pool,
    Pool: vi.fn(),
  };
});

vi.mock("pg", () => ({
  Pool: pgMocks.Pool,
}));

vi.mock("./env.js", () => ({
  loadOrgCliEnv: () => ({
    DATABASE_URL: "postgres://org-model-test",
    DB_POOL_MAX: 1,
    DB_IDLE_TIMEOUT_MS: 1_000,
    DB_CONN_TIMEOUT_MS: 1_000,
  }),
}));

import { PostgresOrgModelRepository } from "./postgres-repository.js";

const baselineSnapshot: UnitRecord[] = [
  {
    scopeId: "scope-1",
    unitId: "exec",
    name: "Executive",
    createdAt: "2026-04-01T00:00:00.000Z",
  },
  {
    scopeId: "scope-1",
    unitId: "ops",
    name: "Operations",
    parentId: "exec",
    createdAt: "2026-04-01T00:00:00.000Z",
  },
];

function queryText(callIndex: number): string {
  return String(pgMocks.client.query.mock.calls[callIndex]?.[0] ?? "");
}

function queryParams(callIndex: number): unknown[] {
  return pgMocks.client.query.mock.calls[callIndex]?.[1] as unknown[];
}

describe("PostgresOrgModelRepository.createScenarioFromBaseline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pgMocks.Pool.mockImplementation(() => pgMocks.pool);
    pgMocks.pool.connect.mockResolvedValue(pgMocks.client);
    pgMocks.client.query.mockResolvedValue({ rows: [] });
  });

  it("forks baseline snapshot units into a draft scenario transaction", async () => {
    pgMocks.client.query.mockImplementation(async (statement) => {
      if (String(statement).includes("select snapshot_json")) {
        return { rows: [{ snapshot_json: baselineSnapshot }] };
      }
      return { rows: [] };
    });

    const repository = new PostgresOrgModelRepository();
    await repository.createScenarioFromBaseline("scope-1", "baseline-1", "scenario-1");

    expect(pgMocks.Pool).toHaveBeenCalledWith({
      connectionString: "postgres://org-model-test",
      max: 1,
      idleTimeoutMillis: 1_000,
      connectionTimeoutMillis: 1_000,
    });
    expect(queryText(0)).toBe("begin");
    expect(queryText(1)).toContain("select snapshot_json");
    expect(queryParams(1)).toEqual(["scope-1", "baseline-1"]);
    expect(queryText(2)).toContain("insert into org_model.scenarios");
    expect(queryText(2)).toContain("on conflict (scenario_id) do update");
    expect(queryText(2)).toContain("state = 'draft'");
    expect(queryParams(2)).toEqual(["scenario-1", "scope-1", "baseline-1"]);
    expect(queryText(3)).toContain("delete from org_model.scenario_units");
    expect(queryParams(3)).toEqual(["scenario-1"]);
    expect(queryText(4)).toContain("insert into org_model.scenario_units");
    expect(queryParams(4)).toEqual(["scenario-1", "exec", "Executive", null]);
    expect(queryText(5)).toContain("insert into org_model.scenario_units");
    expect(queryParams(5)).toEqual(["scenario-1", "ops", "Operations", "exec"]);
    expect(queryText(6)).toBe("commit");
    expect(pgMocks.client.query).not.toHaveBeenCalledWith("rollback");
    expect(pgMocks.client.release).toHaveBeenCalledOnce();
    expect(baselineSnapshot).toEqual([
      expect.objectContaining({ unitId: "exec", parentId: undefined }),
      expect.objectContaining({ unitId: "ops", parentId: "exec" }),
    ]);
  });

  it("rolls back and preserves the baseline-not-found code when the snapshot is missing", async () => {
    pgMocks.client.query.mockImplementation(async (statement) => {
      if (String(statement).includes("select snapshot_json")) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const repository = new PostgresOrgModelRepository();

    await expect(
      repository.createScenarioFromBaseline("scope-1", "missing-baseline", "scenario-1"),
    ).rejects.toMatchObject({
      code: "BASELINE_NOT_FOUND",
      name: "OrgPersistenceError",
    });
    expect(pgMocks.client.query).toHaveBeenCalledWith("rollback");
    expect(pgMocks.client.query).not.toHaveBeenCalledWith("commit");
    expect(pgMocks.client.release).toHaveBeenCalledOnce();
    expect(pgMocks.client.query.mock.calls).toHaveLength(3);
  });

  it("rolls back the transaction when copying a scenario unit fails", async () => {
    pgMocks.client.query.mockImplementation(async (statement) => {
      const sql = String(statement);
      if (sql.includes("select snapshot_json")) {
        return { rows: [{ snapshot_json: baselineSnapshot }] };
      }
      if (sql.includes("insert into org_model.scenario_units")) {
        throw new Error("scenario unit insert failed");
      }
      return { rows: [] };
    });

    const repository = new PostgresOrgModelRepository();

    await expect(
      repository.createScenarioFromBaseline("scope-1", "baseline-1", "scenario-1"),
    ).rejects.toMatchObject({
      code: "POSTGRES_ERROR",
      name: "OrgPersistenceError",
      message: expect.stringContaining("scenario unit insert failed"),
    });
    expect(pgMocks.client.query).toHaveBeenCalledWith("rollback");
    expect(pgMocks.client.query).not.toHaveBeenCalledWith("commit");
    expect(pgMocks.client.release).toHaveBeenCalledOnce();
  });
});
