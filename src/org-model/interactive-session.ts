import type { OrgModelRepository } from "./repository.js";
import { OrgPersistenceError } from "./repository.js";

export interface InteractiveIo {
  choose(label: string, options: readonly string[]): Promise<string>;
  input(label: string): Promise<string>;
  output(message: string): void;
}

export class InteractiveOrgCliSession {
  private currentScopeId?: string;

  constructor(private readonly repository: OrgModelRepository, private readonly io: InteractiveIo) {}

  async run(): Promise<void> {
    await this.repository.ensureSchema();
    this.io.output("Org Model CLI (interactive prototype)");
    this.io.output("Use this flow to rehearse user navigation and input patterns.");

    let keepRunning = true;
    while (keepRunning) {
      this.io.output(this.currentScopeId ? `Current scope: ${this.currentScopeId}` : "No scope selected");
      const selection = await this.io.choose("Choose action", [
        "Switch scope",
        "Create scope",
        "Add unit",
        "Add reporting line",
        "Create baseline",
        "Create scenario from baseline",
        "Create recommendation draft",
        "Inspect current scope data",
        "Exit"
      ]);

      switch (selection) {
        case "Switch scope":
          await this.switchScope();
          break;
        case "Create scope":
          await this.createScope();
          break;
        case "Add unit":
          await this.requireScope(() => this.addUnit());
          break;
        case "Add reporting line":
          await this.requireScope(() => this.addReportingLine());
          break;
        case "Create baseline":
          await this.requireScope(() => this.createBaseline());
          break;
        case "Create scenario from baseline":
          await this.requireScope(() => this.createScenarioFromBaseline());
          break;
        case "Create recommendation draft":
          await this.requireScope(() => this.createRecommendation());
          break;
        case "Inspect current scope data":
          await this.requireScope(() => this.inspectScopeData());
          break;
        case "Exit":
          keepRunning = false;
          this.io.output("Session ended.");
          break;
        default:
          this.io.output(`Unsupported action: ${selection}`);
      }
    }
  }

  private async requireScope(work: () => Promise<void>): Promise<void> {
    if (!this.currentScopeId) {
      this.io.output("Select or create a scope first.");
      return;
    }

    try {
      await work();
    } catch (error) {
      if (error instanceof OrgPersistenceError) {
        this.io.output(`Persistence error [${error.code}]: ${error.message}`);
        return;
      }
      this.io.output(`Unexpected error: ${(error as Error).message}`);
    }
  }

  private async switchScope(): Promise<void> {
    const scopes = await this.repository.listScopes();
    if (scopes.length === 0) {
      this.io.output("No scopes exist yet. Create one first.");
      return;
    }
    const selected = await this.io.choose(
      "Select scope",
      scopes.map((scope) => scope.scopeId)
    );
    this.currentScopeId = selected;
    this.io.output(`Switched to scope: ${selected}`);
  }

  private async createScope(): Promise<void> {
    const scopeId = (await this.io.input("Scope id")).trim();
    const name = (await this.io.input("Scope display name")).trim();
    if (!scopeId || !name) {
      this.io.output("Scope id and display name are required.");
      return;
    }
    await this.repository.createScope(scopeId, name);
    this.currentScopeId = scopeId;
    this.io.output(`Scope ${scopeId} ready.`);
  }

  private async addUnit(): Promise<void> {
    const unitId = (await this.io.input("Unit id")).trim();
    const name = (await this.io.input("Unit display name")).trim();
    if (!unitId || !name) {
      this.io.output("Unit id and display name are required.");
      return;
    }
    await this.repository.upsertUnit(this.currentScopeId as string, unitId, name);
    this.io.output(`Unit ${unitId} saved in scope ${this.currentScopeId}.`);
  }

  private async addReportingLine(): Promise<void> {
    const childId = (await this.io.input("Child unit id")).trim();
    const parentId = (await this.io.input("Parent unit id")).trim();
    if (!childId || !parentId) {
      this.io.output("Child and parent ids are required.");
      return;
    }
    await this.repository.addReportingLine(this.currentScopeId as string, childId, parentId);
    this.io.output(`Reporting line saved: ${childId} -> ${parentId}.`);
  }

  private async createBaseline(): Promise<void> {
    const baselineId = (await this.io.input("Baseline id")).trim();
    if (!baselineId) {
      this.io.output("Baseline id is required.");
      return;
    }
    await this.repository.createBaseline(this.currentScopeId as string, baselineId);
    this.io.output(`Baseline ${baselineId} created from current units.`);
  }

  private async createScenarioFromBaseline(): Promise<void> {
    const baselines = await this.repository.listBaselines(this.currentScopeId as string);
    if (baselines.length === 0) {
      this.io.output("Create a baseline first.");
      return;
    }

    const baselineId = await this.io.choose(
      "Select baseline",
      baselines.map((baseline) => baseline.baselineId)
    );
    const scenarioId = (await this.io.input("Scenario id")).trim();
    if (!scenarioId) {
      this.io.output("Scenario id is required.");
      return;
    }
    await this.repository.createScenarioFromBaseline(this.currentScopeId as string, baselineId, scenarioId);
    this.io.output(`Scenario ${scenarioId} created from baseline ${baselineId}.`);
  }

  private async createRecommendation(): Promise<void> {
    const baselines = await this.repository.listBaselines(this.currentScopeId as string);
    const scenarios = await this.repository.listScenarios(this.currentScopeId as string);
    if (baselines.length === 0 || scenarios.length === 0) {
      this.io.output("Need at least one baseline and one scenario before creating recommendations.");
      return;
    }

    const baselineId = await this.io.choose(
      "Select baseline for recommendation",
      baselines.map((baseline) => baseline.baselineId)
    );
    const scenarioId = await this.io.choose(
      "Select scenario",
      scenarios.map((scenario) => scenario.scenarioId)
    );
    const rationale = (await this.io.input("Rationale summary")).trim();
    const confidenceRaw = (await this.io.input("Confidence score [0..1]")).trim();
    const confidenceScore = Number(confidenceRaw);
    if (!rationale || Number.isNaN(confidenceScore) || confidenceScore < 0 || confidenceScore > 1) {
      this.io.output("Rationale and confidence score within [0..1] are required.");
      return;
    }
    await this.repository.createRecommendation(
      this.currentScopeId as string,
      baselineId,
      scenarioId,
      rationale,
      confidenceScore
    );
    this.io.output(`Recommendation created for scenario ${scenarioId}.`);
  }

  private async inspectScopeData(): Promise<void> {
    const scopeId = this.currentScopeId as string;
    const [units, baselines, scenarios, recommendations] = await Promise.all([
      this.repository.listUnits(scopeId),
      this.repository.listBaselines(scopeId),
      this.repository.listScenarios(scopeId),
      this.repository.listRecommendations(scopeId)
    ]);

    this.io.output(`--- Scope ${scopeId} snapshot ---`);
    this.io.output(`Units (${units.length})`);
    for (const unit of units) {
      this.io.output(`  - ${unit.unitId}: ${unit.name}${unit.parentId ? ` -> ${unit.parentId}` : ""}`);
    }

    this.io.output(`Baselines (${baselines.length})`);
    for (const baseline of baselines) {
      this.io.output(`  - ${baseline.baselineId} @ ${baseline.createdAt}`);
    }

    this.io.output(`Scenarios (${scenarios.length})`);
    for (const scenario of scenarios) {
      this.io.output(`  - ${scenario.scenarioId} [${scenario.state}] baseline=${scenario.baselineId}`);
    }

    this.io.output(`Recommendations (${recommendations.length})`);
    for (const recommendation of recommendations) {
      this.io.output(
        `  - ${recommendation.recommendationId} [${recommendation.state}] scenario=${recommendation.scenarioId} confidence=${recommendation.confidenceScore}`
      );
    }
    this.io.output("--- end snapshot ---");
  }
}
