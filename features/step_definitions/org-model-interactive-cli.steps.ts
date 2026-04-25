import { Given, Then, When } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
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

Then(
  "the interactive inspection for scope {string} shows {int} units",
  async function (this: OrgModelWorld, scopeId: string, expectedCount: number) {
    const units = await this.interactiveRepository.listUnits(scopeId);
    assert.equal(units.length, expectedCount);
  }
);

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
