import type { OrgModelRepository } from "./repository.js";
import { OrgPersistenceError } from "./repository.js";
import { scoreScenarioFromUnits } from "./scenario-scoring.js";

export interface InteractiveIo {
  choose(label: string, options: readonly string[]): Promise<string>;
  input(label: string): Promise<string>;
  output(message: string): void;
}

export class InteractiveOrgCliSession {
  private currentScopeId?: string;
  private readonly actionHistory: string[];

  constructor(
    private readonly repository: OrgModelRepository,
    private readonly io: InteractiveIo,
    actionHistory: string[] = []
  ) {
    this.actionHistory = actionHistory;
  }

  async run(): Promise<void> {
    await this.repository.ensureSchema();
    this.io.output("Org Model CLI (interactive prototype)");
    this.io.output("Use this flow to rehearse user navigation and input patterns.");

    let keepRunning = true;
    while (keepRunning) {
      this.io.output(this.currentScopeId ? `Current scope: ${this.currentScopeId}` : "No scope selected");
      const selection = await this.io.choose("Choose action", [
        "View validation flow map",
        "Run guided walkthrough (baseline -> scenario -> recommendation)",
        "Switch scope",
        "Create scope",
        "Add unit",
        "Add reporting line",
        "Create baseline",
        "Create scenario from baseline",
        "Score scenario vs baseline",
        "Compare scenarios against baseline",
        "Create recommendation draft",
        "Show action history",
        "Inspect current scope data",
        "Exit"
      ]);

      switch (selection) {
        case "View validation flow map":
          this.showValidationFlowMap();
          this.logAction("Viewed validation flow map");
          break;
        case "Run guided walkthrough (baseline -> scenario -> recommendation)":
          await this.runGuidedWalkthrough();
          break;
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
        case "Score scenario vs baseline":
          await this.requireScope(() => this.scoreScenarioAgainstBaseline());
          break;
        case "Compare scenarios against baseline":
          await this.requireScope(() => this.compareScenariosAgainstBaseline());
          break;
        case "Create recommendation draft":
          await this.requireScope(() => this.createRecommendation());
          break;
        case "Show action history":
          this.showActionHistory();
          break;
        case "Inspect current scope data":
          await this.requireScope(() => this.inspectScopeData());
          this.logAction(`Inspected scope snapshot for ${this.currentScopeId as string}`);
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
    this.logAction(`Switched scope to ${selected}`);
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
    this.logAction(`Created/updated scope ${scopeId}`);
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
    this.logAction(`Added/updated unit ${unitId} in ${this.currentScopeId as string}`);
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
    this.logAction(`Linked ${childId} -> ${parentId} in ${this.currentScopeId as string}`);
  }

  private async createBaseline(): Promise<void> {
    const baselineId = (await this.io.input("Baseline id")).trim();
    if (!baselineId) {
      this.io.output("Baseline id is required.");
      return;
    }
    await this.repository.createBaseline(this.currentScopeId as string, baselineId);
    this.io.output(`Baseline ${baselineId} created from current units.`);
    this.logAction(`Created baseline ${baselineId} in ${this.currentScopeId as string}`);
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
    this.logAction(`Created scenario ${scenarioId} from baseline ${baselineId}`);
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
    this.logAction(`Created recommendation draft for scenario ${scenarioId}`);
  }

  private async scoreScenarioAgainstBaseline(): Promise<void> {
    const baselines = await this.repository.listBaselines(this.currentScopeId as string);
    const scenarios = await this.repository.listScenarios(this.currentScopeId as string);
    if (baselines.length === 0 || scenarios.length === 0) {
      this.io.output("Need at least one baseline and one scenario before scoring.");
      return;
    }

    const baselineId = await this.io.choose(
      "Select baseline for scenario score",
      baselines.map((baseline) => baseline.baselineId)
    );
    const scenarioId = await this.io.choose(
      "Select scenario for score",
      scenarios.map((scenario) => scenario.scenarioId)
    );

    const [baselineUnits, scenarioUnits] = await Promise.all([
      this.repository.getBaselineUnits(this.currentScopeId as string, baselineId),
      this.repository.getScenarioUnits(this.currentScopeId as string, scenarioId)
    ]);
    const score = scoreScenarioFromUnits(baselineUnits, scenarioUnits);

    this.io.output(`Scenario score for ${scenarioId} vs ${baselineId}`);
    this.io.output(`  overallError=${score.overallError}`);
    this.io.output(`  normalizedScore=${score.normalizedScore}`);
    this.io.output(
      `  subscores root=${score.subscores.rootCountDrift}, depth=${score.subscores.maxDepthDrift}, span=${score.subscores.spanPressureDrift}`
    );
    this.io.output(`  contributors: ${score.contributors.join(", ")}`);
    this.logAction(`Scored scenario ${scenarioId} against baseline ${baselineId}`);
  }

  private async compareScenariosAgainstBaseline(): Promise<void> {
    const baselines = await this.repository.listBaselines(this.currentScopeId as string);
    if (baselines.length === 0) {
      this.io.output("Need at least one baseline before comparing scenarios.");
      return;
    }
    const baselineId = await this.io.choose(
      "Select baseline for scenario comparison",
      baselines.map((baseline) => baseline.baselineId)
    );

    const scenarios = (await this.repository.listScenarios(this.currentScopeId as string)).filter(
      (scenario) => scenario.baselineId === baselineId
    );
    if (scenarios.length === 0) {
      this.io.output(`No scenarios exist for baseline ${baselineId}.`);
      return;
    }

    const baselineUnits = await this.repository.getBaselineUnits(this.currentScopeId as string, baselineId);
    const scored = await Promise.all(
      scenarios.map(async (scenario) => {
        const scenarioUnits = await this.repository.getScenarioUnits(this.currentScopeId as string, scenario.scenarioId);
        return {
          scenarioId: scenario.scenarioId,
          score: scoreScenarioFromUnits(baselineUnits, scenarioUnits)
        };
      })
    );
    scored.sort((a, b) => b.score.normalizedScore - a.score.normalizedScore);

    this.io.output(`Scenario comparison ranking for baseline ${baselineId}`);
    for (const [index, entry] of scored.entries()) {
      this.io.output(
        `  ${index + 1}. ${entry.scenarioId} normalized=${entry.score.normalizedScore} error=${entry.score.overallError}`
      );
    }
    this.logAction(`Compared ${scored.length} scenarios against baseline ${baselineId}`);
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

  private showValidationFlowMap(): void {
    this.io.output("--- Validation flow map ---");
    this.io.output("1) Create or switch scope");
    this.io.output("2) Add units and reporting lines");
    this.io.output("3) Create baseline snapshot");
    this.io.output("4) Fork scenario from baseline");
    this.io.output("5) Score scenario against baseline");
    this.io.output("6) Compare scenarios against baseline");
    this.io.output("7) Draft recommendation");
    this.io.output("8) Inspect scope data and compare outcomes");
    this.io.output("Tip: use action history to review navigation behavior.");
    this.io.output("--- end flow map ---");
  }

  private async runGuidedWalkthrough(): Promise<void> {
    await this.requireScope(async () => {
      this.io.output("--- Guided walkthrough ---");
      this.io.output("This sequence helps validate end-to-end operator navigation.");
      await this.addUnit();
      await this.createBaseline();
      await this.createScenarioFromBaseline();
      await this.scoreScenarioAgainstBaseline();
      await this.createRecommendation();
      await this.inspectScopeData();
      this.io.output("Completed guided walkthrough.");
      this.io.output("--- End guided walkthrough ---");
      this.logAction("Completed guided walkthrough");
    });
  }

  private showActionHistory(): void {
    this.io.output("--- Action history ---");
    if (this.actionHistory.length === 0) {
      this.io.output("No actions recorded yet.");
      this.io.output("--- End action history ---");
      return;
    }
    for (const item of this.actionHistory) {
      this.io.output(`- ${item}`);
    }
    this.io.output("--- End action history ---");
  }

  private logAction(message: string): void {
    this.actionHistory.push(`[${new Date().toISOString()}] ${message}`);
  }
}
