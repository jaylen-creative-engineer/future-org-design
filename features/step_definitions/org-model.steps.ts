import { Given, Then, When } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { OrgModelError } from "../support/org-model-driver.js";
import { RECOMMENDATION_GOLDEN_FIXTURES } from "../support/org-model-driver.js";
import type { IngestPayload, RecommendationArtifact, RecommendationRequest } from "../support/org-model-driver.js";
import { OrgModelWorld } from "../support/world.js";

function parsePayload(docString: string): IngestPayload {
  return JSON.parse(docString) as IngestPayload;
}

function parseRecommendationRequest(docString: string): RecommendationRequest {
  return JSON.parse(docString) as RecommendationRequest;
}

function recommendationOrThrow(world: OrgModelWorld): RecommendationArtifact {
  assert.ok(world.lastRecommendationArtifact, "Expected a recommendation artifact");
  return world.lastRecommendationArtifact;
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

Given("scope {string} has unit {string} only", function (this: OrgModelWorld, scopeId: string, unitId: string) {
  this.driver.createScope(scopeId);
  this.driver.addUnit(scopeId, unitId);
});

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
    try {
      this.driver.moveScenarioSubtree(scenarioId, unitId, nextParentId);
      this.lastError = undefined;
    } catch (error) {
      this.lastError = error as OrgModelError;
    }
  }
);

When(
  "subtree move of {string} under {string} is attempted in scenario {string}",
  function (this: OrgModelWorld, unitId: string, nextParentId: string, scenarioId: string) {
    try {
      this.driver.moveScenarioSubtree(scenarioId, unitId, nextParentId);
      this.lastError = undefined;
    } catch (error) {
      this.lastError = error as OrgModelError;
    }
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

When(
  "scenario {string} is scored against baseline {string}",
  function (this: OrgModelWorld, scenarioId: string, baselineId: string) {
    void baselineId;
    this.driver.scoreScenarioAgainstBaseline(scenarioId);
  }
);

When(
  "scenario score is computed for baseline {string} and scenario {string}",
  function (this: OrgModelWorld, baselineId: string, scenarioId: string) {
    void baselineId;
    this.driver.scoreScenarioAgainstBaseline(scenarioId);
  }
);

Then(
  "scenario score for {string} has overall error {float} and normalized score {float}",
  function (this: OrgModelWorld, scenarioId: string, expectedOverallError: number, expectedNormalizedScore: number) {
    const score = this.driver.scoreScenarioAgainstBaseline(scenarioId);
    assert.equal(score.overallError, expectedOverallError);
    assert.equal(score.normalizedScore, expectedNormalizedScore);
  }
);

Then(
  "scenario score for {string} has contributor {string}",
  function (this: OrgModelWorld, scenarioId: string, contributor: string) {
    const score = this.driver.scoreScenarioAgainstBaseline(scenarioId);
    assert.ok(score.contributors.includes(contributor));
  }
);

Then("scenario score overall error is {int}", function (this: OrgModelWorld, expectedOverallError: number) {
  const score = this.driver.getScenarioScore(this.lastRecommendationRequest?.scenarioId ?? "scenario-score-a");
  assert.equal(score.overallError, expectedOverallError);
});

Then("scenario score overall error is greater than {int}", function (this: OrgModelWorld, threshold: number) {
  const score = this.driver.getScenarioScore(this.lastRecommendationRequest?.scenarioId ?? "scenario-score-b");
  assert.ok(score.overallError > threshold);
});

Then("scenario score normalized score is {int}", function (this: OrgModelWorld, expectedNormalizedScore: number) {
  const score = this.driver.getScenarioScore(this.lastRecommendationRequest?.scenarioId ?? "scenario-score-a");
  assert.equal(score.normalizedScore, expectedNormalizedScore);
});

Then("scenario score includes contributor {string}", function (this: OrgModelWorld, contributor: string) {
  const scores = ["scenario-score-a", "scenario-score-b"]
    .map((scenarioId) => {
      try {
        return this.driver.getScenarioScore(scenarioId);
      } catch {
        return undefined;
      }
    })
    .filter((score): score is NonNullable<typeof score> => score !== undefined);
  assert.ok(scores.some((score) => score.contributors.includes(contributor)));
});

When(
  "scenarios are ranked against baseline {string}",
  function (this: OrgModelWorld, baselineId: string) {
    this.driver.compareScenariosAgainstBaseline(baselineId, this.driver.listScenarioIdsForBaseline(baselineId));
  }
);

When(
  "scenarios {string} and {string} are ranked against baseline {string}",
  function (this: OrgModelWorld, scenarioA: string, scenarioB: string, baselineId: string) {
    this.driver.compareScenariosAgainstBaseline(baselineId, [scenarioA, scenarioB]);
  }
);

Then(
  "scenario rank for baseline {string} is:",
  function (this: OrgModelWorld, baselineId: string, expectedRanksCsv: string) {
    const expectedRanks = expectedRanksCsv.split(",").map((item) => item.trim());
    const ranked = this.driver.compareScenariosAgainstBaseline(
      baselineId,
      this.driver.listScenarioIdsForBaseline(baselineId)
    );
    assert.deepEqual(ranked, expectedRanks);
  }
);

Then("scenario {string} ranks before {string}", function (this: OrgModelWorld, earlier: string, later: string) {
  const rankings = this.driver
    .getScenarioRankings("baseline-rank-v1")
    .map((entry: { scenarioId: string }) => entry.scenarioId);
  assert.ok(rankings.indexOf(earlier) !== -1 && rankings.indexOf(later) !== -1);
  assert.ok(rankings.indexOf(earlier) < rankings.indexOf(later));
});

When("scenario {string} archive is attempted", function (this: OrgModelWorld, scenarioId: string) {
  try {
    this.driver.archiveScenario(scenarioId);
    this.lastError = undefined;
  } catch (error) {
    this.lastError = error as OrgModelError;
  }
});

When("scenario {string} is reset to baseline", function (this: OrgModelWorld, scenarioId: string) {
  this.driver.resetScenarioToBaseline(scenarioId);
});

Given("a valid ingest payload:", function (this: OrgModelWorld, docString: string) {
  this.lastIngestPayload = parsePayload(docString);
});

Given("an ingest payload with duplicate external keys:", function (this: OrgModelWorld, docString: string) {
  this.lastIngestPayload = parsePayload(docString);
});

Given("an ingest payload with invalid schema:", function (this: OrgModelWorld, docString: string) {
  this.lastIngestPayload = parsePayload(docString);
});

Given("an ingest payload with unknown parent reference:", function (this: OrgModelWorld, docString: string) {
  this.lastIngestPayload = parsePayload(docString);
});

Given("an ingest payload that introduces a reporting cycle:", function (this: OrgModelWorld, docString: string) {
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

Given(
  "scope {string} has recommendation context baseline {string} and scenario {string}",
  function (this: OrgModelWorld, scopeId: string, baselineId: string, scenarioId: string) {
    this.driver.createScope(scopeId);
    this.driver.addUnit(scopeId, "engineering");
    this.driver.addUnit(scopeId, "platform");
    this.driver.addUnit(scopeId, "ops");
    this.driver.addReportingLine(scopeId, "platform", "engineering");
    this.driver.commitBaseline(scopeId, baselineId);
    this.driver.createScenarioFromBaseline(baselineId, scenarioId);
  }
);

Given("recommendation adapter fixture {string} is configured", function (this: OrgModelWorld, fixtureId: string) {
  this.driver.useRecommendationFixture(fixtureId);
});

Given("a recommendation request:", function (this: OrgModelWorld, docString: string) {
  this.lastRecommendationRequest = parseRecommendationRequest(docString);
});

When("recommendation generation runs", async function (this: OrgModelWorld) {
  assert.ok(this.lastRecommendationRequest, "No recommendation request provided");
  try {
    this.lastRecommendationArtifact = await this.driver.requestRecommendation(this.lastRecommendationRequest);
    this.previousRecommendationArtifact = undefined;
    this.lastError = undefined;
  } catch (error) {
    this.lastError = error as OrgModelError;
    this.lastRecommendationArtifact = undefined;
  }
});

When("recommendation generation runs twice", async function (this: OrgModelWorld) {
  assert.ok(this.lastRecommendationRequest, "No recommendation request provided");
  this.previousRecommendationArtifact = await this.driver.requestRecommendation(this.lastRecommendationRequest);
  this.lastRecommendationArtifact = await this.driver.requestRecommendation(this.lastRecommendationRequest);
});

When(
  "latest recommendation is accepted by {string} at {string}",
  function (this: OrgModelWorld, reviewedBy: string, reviewedAt: string) {
    const recommendation = recommendationOrThrow(this);
    this.driver.acceptRecommendation(recommendation.recommendationId, reviewedBy, reviewedAt);
    this.lastRecommendationArtifact = this.driver.getRecommendation(recommendation.recommendationId);
  }
);

When(
  "latest recommendation is rejected by {string} at {string}",
  function (this: OrgModelWorld, reviewedBy: string, reviewedAt: string) {
    const recommendation = recommendationOrThrow(this);
    this.driver.rejectRecommendation(recommendation.recommendationId, reviewedBy, reviewedAt);
    this.lastRecommendationArtifact = this.driver.getRecommendation(recommendation.recommendationId);
  }
);

Then("recommendation is created in state {string}", function (this: OrgModelWorld, expectedState: string) {
  assert.equal(recommendationOrThrow(this).state, expectedState);
});

Then("recommendation has at least {int} suggested changes", function (this: OrgModelWorld, minimumChanges: number) {
  assert.ok(recommendationOrThrow(this).suggestedChanges.length >= minimumChanges);
});

Then("recommendation rationale is present", function (this: OrgModelWorld) {
  assert.ok(recommendationOrThrow(this).rationale.trim().length > 0);
});

Then(
  "recommendation confidence score is between {float} and {float}",
  function (this: OrgModelWorld, minScore: number, maxScore: number) {
    const score = recommendationOrThrow(this).confidenceScore;
    assert.ok(score >= minScore && score <= maxScore);
  }
);

Then("recommendation affects entity {string}", function (this: OrgModelWorld, entityId: string) {
  assert.ok(recommendationOrThrow(this).affectedEntityIds.includes(entityId));
});

Then(
  "recommendation output matches golden fixture {string}",
  function (this: OrgModelWorld, fixtureId: string) {
    const expected = RECOMMENDATION_GOLDEN_FIXTURES[fixtureId];
    assert.ok(expected, `Fixture ${fixtureId} is not defined`);
    assert.ok(this.previousRecommendationArtifact, "Expected first recommendation artifact");
    assert.ok(this.lastRecommendationArtifact, "Expected second recommendation artifact");

    const normalize = (artifact: RecommendationArtifact) => ({
      suggestedChanges: artifact.suggestedChanges,
      rationale: artifact.rationale,
      confidenceScore: artifact.confidenceScore,
      affectedEntityIds: artifact.affectedEntityIds,
      createdAt: artifact.createdAt
    });

    assert.deepEqual(normalize(this.previousRecommendationArtifact), normalize(this.lastRecommendationArtifact));
    assert.deepEqual(normalize(this.lastRecommendationArtifact), expected);
  }
);

Then(
  "recommendation was reviewed by {string} at {string}",
  function (this: OrgModelWorld, reviewedBy: string, reviewedAt: string) {
    const recommendation = recommendationOrThrow(this);
    assert.equal(recommendation.reviewedBy, reviewedBy);
    assert.equal(recommendation.reviewedAt, reviewedAt);
  }
);
