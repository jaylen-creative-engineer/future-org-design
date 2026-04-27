import { Given, Then, When, type DataTable } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { OrgModelWorld } from "../support/world.js";
import { InteractiveOrgCliSession, type InteractiveIo } from "../../src/org-model/interactive-session.js";

class ScriptedInteractiveIo implements InteractiveIo {
  private readonly chooseQueue: string[] = [];
  private readonly inputQueue: string[] = [];

  constructor(private readonly world: OrgModelWorld) {}

  enqueueChoose(value: string): void {
    this.chooseQueue.push(value);
  }

  enqueueInput(value: string): void {
    this.inputQueue.push(value);
  }

  async choose(_label: string, options: readonly string[]): Promise<string> {
    const next = this.chooseQueue.shift();
    assert.ok(next, "No scripted menu selection available");
    assert.ok(options.includes(next), `Scripted selection "${next}" not in options: ${options.join(", ")}`);
    return next;
  }

  async input(_label: string): Promise<string> {
    const next = this.inputQueue.shift();
    assert.notEqual(next, undefined, "No scripted input available");
    return next as string;
  }

  output(message: string): void {
    this.world.interactiveMessages.push(message);
  }
}

async function runScriptedSession(world: OrgModelWorld, script: ScriptedInteractiveIo): Promise<void> {
  world.interactiveIo = script;
  world.interactiveSession = new InteractiveOrgCliSession(world.interactiveRepository, script);
  await world.interactiveSession.run();
}

function enqueueScopeSelection(script: ScriptedInteractiveIo): void {
  script.enqueueChoose("Switch scope");
  script.enqueueChoose("acme");
}

Given("an interactive CLI session backed by in-memory persistence", function (this: OrgModelWorld) {
  this.interactiveMessages = [];
  this.interactiveSession = undefined;
  this.interactiveIo = undefined;
});

function runCliForTest(args: readonly string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(
    "node",
    ["./node_modules/tsx/dist/cli.mjs", "./scripts/cli/entry.ts", ...args],
    {
      cwd: process.cwd(),
      env: { ...process.env },
      encoding: "utf8"
    }
  );
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

When(
  "the operator creates scope {string} named {string}",
  async function (this: OrgModelWorld, scopeId: string, scopeName: string) {
    const script = new ScriptedInteractiveIo(this);
    script.enqueueChoose("Create scope");
    script.enqueueInput(scopeId);
    script.enqueueInput(scopeName);
    script.enqueueChoose("Exit");
    await runScriptedSession(this, script);
  }
);

When(
  "the operator adds unit {string} named {string}",
  async function (this: OrgModelWorld, unitId: string, unitName: string) {
    const script = new ScriptedInteractiveIo(this);
    enqueueScopeSelection(script);
    script.enqueueChoose("Add unit");
    script.enqueueInput(unitId);
    script.enqueueInput(unitName);
    script.enqueueChoose("Exit");
    await runScriptedSession(this, script);
  }
);

When(
  "the operator links unit {string} to parent {string}",
  async function (this: OrgModelWorld, childId: string, parentId: string) {
    const script = new ScriptedInteractiveIo(this);
    enqueueScopeSelection(script);
    script.enqueueChoose("Add reporting line");
    script.enqueueInput(childId);
    script.enqueueInput(parentId);
    script.enqueueChoose("Exit");
    await runScriptedSession(this, script);
  }
);

When("the operator creates baseline {string}", async function (this: OrgModelWorld, baselineId: string) {
  const script = new ScriptedInteractiveIo(this);
  enqueueScopeSelection(script);
  script.enqueueChoose("Create baseline");
  script.enqueueInput(baselineId);
  script.enqueueChoose("Exit");
  await runScriptedSession(this, script);
});

When(
  "the operator creates scenario {string} from baseline {string}",
  async function (this: OrgModelWorld, scenarioId: string, baselineId: string) {
    const script = new ScriptedInteractiveIo(this);
    enqueueScopeSelection(script);
    script.enqueueChoose("Create scenario from baseline");
    script.enqueueChoose(baselineId);
    script.enqueueInput(scenarioId);
    script.enqueueChoose("Exit");
    await runScriptedSession(this, script);
  }
);

When(
  "the operator creates recommendation with rationale {string} and confidence {float}",
  async function (this: OrgModelWorld, rationale: string, confidence: number) {
    const baselines = await this.interactiveRepository.listBaselines("acme");
    const scenarios = await this.interactiveRepository.listScenarios("acme");
    assert.ok(baselines.length > 0, "Expected at least one baseline for scripted recommendation creation");
    assert.ok(scenarios.length > 0, "Expected at least one scenario for scripted recommendation creation");

    const script = new ScriptedInteractiveIo(this);
    enqueueScopeSelection(script);
    script.enqueueChoose("Create recommendation draft");
    script.enqueueChoose(baselines[0]?.baselineId as string);
    script.enqueueChoose(scenarios[0]?.scenarioId as string);
    script.enqueueInput(rationale);
    script.enqueueInput(String(confidence));
    script.enqueueChoose("Exit");
    await runScriptedSession(this, script);
  }
);

When(
  "the operator scores scenario {string} against baseline {string}",
  async function (this: OrgModelWorld, scenarioId: string, baselineId: string) {
    const script = new ScriptedInteractiveIo(this);
    enqueueScopeSelection(script);
    script.enqueueChoose("Score scenario vs baseline");
    script.enqueueChoose(baselineId);
    script.enqueueChoose(scenarioId);
    script.enqueueChoose("Exit");
    await runScriptedSession(this, script);
  }
);

When(
  "the operator compares scenarios against baseline {string}:",
  async function (this: OrgModelWorld, baselineId: string, table: DataTable) {
    const scenarioRows = table.hashes() as Array<{ scenarioId?: string }>;
    const scenarioIds = scenarioRows
      .map((row) => row.scenarioId?.trim())
      .filter((value): value is string => Boolean(value));
    assert.ok(scenarioIds.length >= 2, "Comparison requires at least two scenario ids");

    const script = new ScriptedInteractiveIo(this);
    enqueueScopeSelection(script);
    script.enqueueChoose("Compare scenarios against baseline");
    script.enqueueChoose(baselineId);
    script.enqueueInput(scenarioIds.join(","));
    script.enqueueChoose("Exit");
    await runScriptedSession(this, script);
  }
);

When(
  "the operator compares scenarios {string} and {string} against baseline {string}",
  async function (this: OrgModelWorld, scenarioA: string, scenarioB: string, baselineId: string) {
    const script = new ScriptedInteractiveIo(this);
    enqueueScopeSelection(script);
    script.enqueueChoose("Compare scenarios vs baseline");
    script.enqueueChoose(baselineId);
    script.enqueueInput(scenarioA);
    script.enqueueInput(scenarioB);
    script.enqueueInput("done");
    script.enqueueChoose("Exit");
    await runScriptedSession(this, script);
  }
);

When("the operator views the validation flow map", async function (this: OrgModelWorld) {
  const script = new ScriptedInteractiveIo(this);
  script.enqueueChoose("View validation flow map");
  script.enqueueChoose("Exit");
  await runScriptedSession(this, script);
});

When("the operator runs the guided walkthrough with:", async function (this: OrgModelWorld, table: DataTable) {
  const rows = table.rowsHash();
  const unitId = rows.unitId;
  const unitName = rows.unitName;
  const baselineId = rows.baselineId;
  const scenarioId = rows.scenarioId;
  const rationale = rows.rationale;
  const confidence = rows.confidence;
  assert.ok(unitId && unitName && baselineId && scenarioId && rationale && confidence, "Guided walkthrough table is incomplete");

  const script = new ScriptedInteractiveIo(this);
  enqueueScopeSelection(script);
  script.enqueueChoose("Run guided walkthrough (baseline -> scenario -> recommendation)");
  script.enqueueInput(unitId);
  script.enqueueInput(unitName);
  script.enqueueInput(baselineId);
  script.enqueueChoose(baselineId);
  script.enqueueInput(scenarioId);
  script.enqueueChoose(baselineId);
  script.enqueueChoose(scenarioId);
  script.enqueueChoose(baselineId);
  script.enqueueChoose(scenarioId);
  script.enqueueInput(rationale);
  script.enqueueInput(confidence);
  script.enqueueChoose("Exit");
  await runScriptedSession(this, script);
});

When("the operator shows action history", async function (this: OrgModelWorld) {
  const script = new ScriptedInteractiveIo(this);
  enqueueScopeSelection(script);
  script.enqueueChoose("Show action history");
  script.enqueueChoose("Exit");
  await runScriptedSession(this, script);
});

When("the operator runs CLI help in non-interactive mode", function (this: OrgModelWorld) {
  const result = runCliForTest(["--help", "--mode=memory"]);
  this.interactiveMessages.push(result.stdout);
  this.interactiveMessages.push(result.stderr);
  assert.equal(result.status, 0);
});

When("the operator runs CLI smoke in memory mode", function (this: OrgModelWorld) {
  const result = runCliForTest(["--smoke", "--mode=memory"]);
  this.interactiveMessages.push(result.stdout);
  this.interactiveMessages.push(result.stderr);
  assert.equal(result.status, 0);
});

When("the operator runs CLI demo in memory mode", function (this: OrgModelWorld) {
  const result = runCliForTest(["--demo", "--mode=memory"]);
  this.interactiveMessages.push(result.stdout);
  this.interactiveMessages.push(result.stderr);
  assert.equal(result.status, 0);
});

Given("CLI batch mode is configured for {string}", function (this: OrgModelWorld, mode: string) {
  this.cliOutput = "";
  this.interactiveMessages = [];
  if (mode !== "memory" && mode !== "postgres") {
    throw new Error(`Unsupported test mode ${mode}`);
  }
  this.interactiveMessages.push(`mode:${mode}`);
});

When("CLI smoke validation runs", function (this: OrgModelWorld) {
  const modeMessage = this.interactiveMessages.find((message) => message.startsWith("mode:")) ?? "mode:memory";
  const mode = modeMessage.replace("mode:", "");
  const result = runCliForTest(["--smoke", `--mode=${mode}`]);
  assert.equal(result.status, 0, `smoke command failed: ${result.stderr}`);
  this.cliOutput = result.stdout;
});

When("CLI guided demo batch runs", function (this: OrgModelWorld) {
  const modeMessage = this.interactiveMessages.find((message) => message.startsWith("mode:")) ?? "mode:memory";
  const mode = modeMessage.replace("mode:", "");
  const result = runCliForTest(["--demo", `--mode=${mode}`]);
  assert.equal(result.status, 0, `demo command failed: ${result.stderr}`);
  this.cliOutput = result.stdout;
});

Then("the CLI envelope result is ok", function (this: OrgModelWorld) {
  const parsed = JSON.parse(this.cliOutput) as { ok?: boolean };
  assert.equal(parsed.ok, true);
});

Then("the CLI envelope includes key {string}", function (this: OrgModelWorld, key: string) {
  const parsed = JSON.parse(this.cliOutput) as { data?: Record<string, unknown> };
  assert.ok(parsed.data && key in parsed.data, `Expected CLI envelope data to include key ${key}`);
});

Then(
  "the interactive inspection for scope {string} shows {int} units",
  async function (this: OrgModelWorld, scopeId: string, expectedCount: number) {
    const units = await this.interactiveRepository.listUnits(scopeId);
    assert.equal(units.length, expectedCount);
  }
);

Then("the interactive output includes {string}", function (this: OrgModelWorld, expectedMessage: string) {
  assert.ok(
    this.interactiveMessages.some((message) => message.includes(expectedMessage)),
    `Expected interactive output to include "${expectedMessage}"`
  );
});

Then(
  "the interactive inspection for scope {string} shows {int} baseline",
  async function (this: OrgModelWorld, scopeId: string, expectedCount: number) {
    const baselines = await this.interactiveRepository.listBaselines(scopeId);
    assert.equal(baselines.length, expectedCount);
  }
);

Then(
  "the interactive inspection for scope {string} shows {int} scenario",
  async function (this: OrgModelWorld, scopeId: string, expectedCount: number) {
    const scenarios = await this.interactiveRepository.listScenarios(scopeId);
    assert.equal(scenarios.length, expectedCount);
  }
);

Then(
  "the interactive inspection for scope {string} shows {int} recommendation",
  async function (this: OrgModelWorld, scopeId: string, expectedCount: number) {
    const recommendations = await this.interactiveRepository.listRecommendations(scopeId);
    assert.equal(recommendations.length, expectedCount);
  }
);
