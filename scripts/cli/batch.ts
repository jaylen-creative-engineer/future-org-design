import type { OrgModelRepository } from "../../src/org-model/repository.js";
import { createRepository, j, printHelp, type CliRuntimeMode } from "./shared.js";

interface CliEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

function ok<T>(data: T): CliEnvelope<T> {
  return { ok: true, data };
}

function fail(message: string): CliEnvelope<never> {
  return { ok: false, error: { code: "CLI_ERROR", message } };
}

async function runSafely<T>(work: () => Promise<T>): Promise<CliEnvelope<T>> {
  try {
    return ok(await work());
  } catch (error) {
    return fail((error as Error).message);
  }
}

async function withRepository<T>(
  mode: CliRuntimeMode,
  work: (repository: OrgModelRepository) => Promise<T>
): Promise<T> {
  const repository = createRepository(mode);
  try {
    await repository.ensureSchema();
    return await work(repository);
  } finally {
    await repository.close();
  }
}

export function runHelp(): void {
  printHelp();
}

export async function runSmoke(mode: CliRuntimeMode): Promise<number> {
  const seed = Date.now();
  const scopeId = `smoke-scope-${seed}`;
  const baselineId = `smoke-baseline-${seed}`;
  const scenarioId = `smoke-scenario-${seed}`;

  const result = await runSafely(async () =>
    withRepository(mode, async (repository) => {
      await repository.createScope(scopeId, "Smoke Scope");
      await repository.upsertUnit(scopeId, "engineering", "Engineering");
      await repository.createBaseline(scopeId, baselineId);
      await repository.createScenarioFromBaseline(scopeId, baselineId, scenarioId);

      const [scopes, units, baselines, scenarios] = await Promise.all([
        repository.listScopes(),
        repository.listUnits(scopeId),
        repository.listBaselines(scopeId),
        repository.listScenarios(scopeId)
      ]);

      return {
        mode,
        scopeId,
        counts: {
          scopes: scopes.length,
          units: units.length,
          baselines: baselines.length,
          scenarios: scenarios.length
        }
      };
    })
  );

  process.stdout.write(`${j(result)}\n`);
  return result.ok ? 0 : 1;
}

export async function runGuidedDemoBatch(mode: CliRuntimeMode): Promise<number> {
  const scopeId = "demo-acme";
  const baselineId = "demo-baseline-v1";
  const scenarioId = "demo-scenario-a";

  const result = await runSafely(async () =>
    withRepository(mode, async (repository) => {
      await repository.createScope(scopeId, "Acme Demo");
      await repository.upsertUnit(scopeId, "engineering", "Engineering");
      await repository.upsertUnit(scopeId, "platform", "Platform");
      await repository.addReportingLine(scopeId, "platform", "engineering");
      await repository.createBaseline(scopeId, baselineId);
      await repository.createScenarioFromBaseline(scopeId, baselineId, scenarioId);
      await repository.createRecommendation(
        scopeId,
        baselineId,
        scenarioId,
        "Demo recommendation to validate end-to-end data flow.",
        0.82
      );

      const [units, baselines, scenarios, recommendations] = await Promise.all([
        repository.listUnits(scopeId),
        repository.listBaselines(scopeId),
        repository.listScenarios(scopeId),
        repository.listRecommendations(scopeId)
      ]);

      return {
        mode,
        scopeId,
        labels: [
          "create scope",
          "seed units",
          "link reporting line",
          "commit baseline",
          "fork scenario",
          "draft recommendation"
        ],
        counts: {
          units: units.length,
          baselines: baselines.length,
          scenarios: scenarios.length,
          recommendations: recommendations.length
        },
        latestRecommendation: recommendations[0] ?? null
      };
    })
  );

  process.stdout.write(`${j(result)}\n`);
  return result.ok ? 0 : 1;
}
