import { Given, Then, When } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { OrgModelError } from "../support/org-model-driver.js";
import type { IngestPayload } from "../support/org-model-driver.js";
import { OrgModelWorld } from "../support/world.js";

function parsePayload(docString: string): IngestPayload {
  return JSON.parse(docString) as IngestPayload;
}

Given("a new organization scope {string}", function (this: OrgModelWorld, scopeId: string) {
  this.driver.createScope(scopeId);
});

When(
  "an operator creates root org {string} and first unit {string} in scope {string}",
  function (this: OrgModelWorld, rootOrgId: string, unitId: string, scopeId: string) {
    this.driver.createRootAndUnit(scopeId, rootOrgId, unitId);
  }
);

Then(
  "the unit {string} persists in scope {string}",
  function (this: OrgModelWorld, unitId: string, scopeId: string) {
    const scope = this.driver.getScope(scopeId);
    assert.equal(scope.units.has(unitId), true);
  }
);

Given("scope {string} has units {string} and {string}", function (this: OrgModelWorld, scopeId: string, first: string, second: string) {
  this.driver.createScope(scopeId);
  this.driver.addUnit(scopeId, first);
  this.driver.addUnit(scopeId, second);
});

When(
  "a reporting line is added from {string} to {string} in scope {string}",
  function (this: OrgModelWorld, childId: string, parentId: string, scopeId: string) {
    this.driver.addReportingLine(scopeId, childId, parentId);
  }
);

Then(
  "depth for unit {string} in scope {string} is {int}",
  function (this: OrgModelWorld, unitId: string, scopeId: string, expectedDepth: number) {
    assert.equal(this.driver.getDepth(scopeId, unitId), expectedDepth);
  }
);

Given(
  "scope {string} has a reporting line from {string} to {string}",
  function (this: OrgModelWorld, scopeId: string, childId: string, parentId: string) {
    this.driver.createScope(scopeId);
    this.driver.addUnit(scopeId, childId);
    this.driver.addUnit(scopeId, parentId);
    this.driver.addReportingLine(scopeId, childId, parentId);
  }
);

When(
  "a reporting line from {string} to {string} is attempted in scope {string}",
  function (this: OrgModelWorld, childId: string, parentId: string, scopeId: string) {
    try {
      this.driver.addReportingLine(scopeId, childId, parentId);
      this.lastError = undefined;
    } catch (error) {
      this.lastError = error as OrgModelError;
    }
  }
);

Then(
  "the operation fails with error code {string}",
  function (this: OrgModelWorld, errorCode: string) {
    assert.ok(this.lastError, "Expected an error to be captured");
    assert.equal(this.lastError?.code, errorCode);
  }
);

Given(
  "scope {string} has baseline {string} with unit {string}",
  function (this: OrgModelWorld, scopeId: string, baselineId: string, unitId: string) {
    this.driver.createScope(scopeId);
    this.driver.addUnit(scopeId, unitId);
    this.driver.commitBaseline(scopeId, baselineId);
  }
);

Given(
  "scope {string} has baseline {string} with units {string}, {string}, and {string} and reporting line from {string} to {string}",
  function (
    this: OrgModelWorld,
    scopeId: string,
    baselineId: string,
    firstUnit: string,
    secondUnit: string,
    thirdUnit: string,
    childId: string,
    parentId: string
  ) {
    this.driver.createScope(scopeId);
    this.driver.addUnit(scopeId, firstUnit);
    this.driver.addUnit(scopeId, secondUnit);
    this.driver.addUnit(scopeId, thirdUnit);
    this.driver.addReportingLine(scopeId, childId, parentId);
    this.driver.commitBaseline(scopeId, baselineId);
  }
);

When(
  "scenario {string} is created from baseline {string}",
  function (this: OrgModelWorld, scenarioId: string, baselineId: string) {
    this.driver.createScenarioFromBaseline(baselineId, scenarioId);
  }
);

When(
  "scenario {string} is created from baseline {string} and unit {string} is added to that scenario",
  function (this: OrgModelWorld, scenarioId: string, baselineId: string, scenarioOnlyUnitId: string) {
    this.driver.createScenarioFromBaseline(baselineId, scenarioId);
    this.driver.addUnitToScenario(scenarioId, scenarioOnlyUnitId);
  }
);

When(
  "subtree rooted at {string} is moved under {string} in scenario {string}",
  function (this: OrgModelWorld, unitId: string, nextParentId: string, scenarioId: string) {
    this.driver.moveScenarioSubtree(scenarioId, unitId, nextParentId);
  }
);

When("scenario {string} is marked ready", function (this: OrgModelWorld, scenarioId: string) {
  this.driver.markScenarioReady(scenarioId);
});

When("scenario {string} is archived", function (this: OrgModelWorld, scenarioId: string) {
  this.driver.archiveScenario(scenarioId);
});

Then("scenario {string} state is {string}", function (this: OrgModelWorld, scenarioId: string, expectedState: string) {
  assert.equal(this.driver.getScenarioState(scenarioId), expectedState);
});

Then(
  "scenario {string} includes unit {string}",
  function (this: OrgModelWorld, scenarioId: string, unitId: string) {
    assert.equal(this.driver.scenarioHasUnit(scenarioId, unitId), true);
  }
);

Then(
  "baseline {string} does not include unit {string}",
  function (this: OrgModelWorld, baselineId: string, unitId: string) {
    assert.equal(this.driver.baselineHasUnit(baselineId, unitId), false);
  }
);

Then(
  "scenario {string} unit {string} reports to {string}",
  function (this: OrgModelWorld, scenarioId: string, unitId: string, expectedParentId: string) {
    assert.equal(this.driver.scenarioParentOf(scenarioId, unitId), expectedParentId);
  }
);

Then(
  "baseline {string} unit {string} reports to {string}",
  function (this: OrgModelWorld, baselineId: string, unitId: string, expectedParentId: string) {
    assert.equal(this.driver.baselineParentOf(baselineId, unitId), expectedParentId);
  }
);

Given("a valid ingest payload:", function (this: OrgModelWorld, docString: string) {
  this.lastIngestPayload = parsePayload(docString);
});

Given("an ingest payload with duplicate external keys:", function (this: OrgModelWorld, docString: string) {
  this.lastIngestPayload = parsePayload(docString);
});

Given("an ingest payload with invalid schema:", function (this: OrgModelWorld, docString: string) {
  this.lastIngestPayload = parsePayload(docString);
});

When("ingest runs", function (this: OrgModelWorld) {
  assert.ok(this.lastIngestPayload, "No ingest payload provided");
  try {
    this.lastIngestResult = this.driver.ingest(this.lastIngestPayload);
    this.lastError = undefined;
  } catch (error) {
    this.lastError = error as OrgModelError;
    this.lastIngestResult = undefined;
  }
});

Then(
  "external key {string} maps to stable internal id {string} in scope {string}",
  function (this: OrgModelWorld, externalKey: string, internalId: string, scopeId: string) {
    assert.equal(this.driver.getNormalizedInternalId(scopeId, externalKey), internalId);
  }
);

Then(
  "ingest succeeds with unit count {int}",
  function (this: OrgModelWorld, expectedCount: number) {
    assert.equal(this.lastError, undefined);
    assert.equal(this.lastIngestResult?.unitCount, expectedCount);
  }
);

Given("the same ingest payload is run twice:", function (this: OrgModelWorld, docString: string) {
  this.lastIngestPayload = parsePayload(docString);
  this.driver.ingest(this.lastIngestPayload);
});
