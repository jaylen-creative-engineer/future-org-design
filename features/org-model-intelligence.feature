@org-model-intelligence
Feature: Org model intelligence requirements
  As a platform builder
  I want executable requirements for org model intelligence
  So completed work can be validated against the feature spec

  Rule: ORG core structure and baseline behavior

    @ORG-01 @S-ORG-01
    Scenario: Create org root and first unit
      Given a new organization scope "acme"
      When an operator creates root org "acme-root" and first unit "engineering" in scope "acme"
      Then the unit "engineering" persists in scope "acme"

    @ORG-02 @ORG-03 @S-ORG-02
    Scenario: Add reporting line and resolve depth
      Given scope "acme" has units "engineering" and "platform"
      When a reporting line is added from "platform" to "engineering" in scope "acme"
      Then depth for unit "platform" in scope "acme" is 1

    @ORG-03 @S-ORG-03
    Scenario: Reject cyclic reporting lines
      Given scope "acme" has a reporting line from "platform" to "engineering"
      When a reporting line from "engineering" to "platform" is attempted in scope "acme"
      Then the operation fails with error code "CYCLE_DETECTED"

    @ORG-05 @S-ORG-05
    Scenario: Scenario edits do not mutate baseline snapshot
      Given scope "acme" has baseline "baseline-v1" with unit "engineering"
      When scenario "scenario-a" is created from baseline "baseline-v1" and unit "innovation" is added to that scenario
      Then scenario "scenario-a" includes unit "innovation"
      And baseline "baseline-v1" does not include unit "innovation"

  Rule: DATA ingest and normalization behavior

    @DATA-01 @DATA-02 @S-DATA-01
    Scenario: Ingest valid payload and normalize external IDs
      Given a valid ingest payload:
        """
        {
          "scopeId": "acme",
          "units": [
            { "externalId": "u-eng", "name": "Engineering" },
            { "externalId": "u-plat", "name": "Platform", "parentExternalId": "u-eng" }
          ]
        }
        """
      When ingest runs
      Then ingest succeeds with unit count 2
      And external key "u-eng" maps to stable internal id "unit:acme:u-eng" in scope "acme"

    @DATA-02 @S-DATA-02
    Scenario: Reject duplicate external keys
      Given an ingest payload with duplicate external keys:
        """
        {
          "scopeId": "acme",
          "units": [
            { "externalId": "u-eng", "name": "Engineering" },
            { "externalId": "u-eng", "name": "Engineering Duplicate" }
          ]
        }
        """
      When ingest runs
      Then the operation fails with error code "DUPLICATE_EXTERNAL_KEY"

    @DATA-02 @S-DATA-03
    Scenario: Reject invalid schema payloads
      Given an ingest payload with invalid schema:
        """
        {
          "scopeId": "acme",
          "units": [
            { "name": "Missing external key" }
          ]
        }
        """
      When ingest runs
      Then the operation fails with error code "INVALID_SCHEMA"

    @DATA-03 @S-DATA-04
    Scenario: Re-ingest remains idempotent
      Given the same ingest payload is run twice:
        """
        {
          "scopeId": "acme",
          "units": [
            { "externalId": "u-eng", "name": "Engineering" },
            { "externalId": "u-plat", "name": "Platform", "parentExternalId": "u-eng" }
          ]
        }
        """
      When ingest runs
      Then ingest succeeds with unit count 2

    @ORG-04 @S-ORG-04
    Scenario: Reject reporting line when child unit is missing
      Given scope "acme" has unit "engineering" only
      When a reporting line from "missing-child" to "engineering" is attempted in scope "acme"
      Then the operation fails with error code "UNIT_NOT_FOUND"

    @ORG-06 @S-ORG-06
    Scenario: Reject reporting line when parent unit is missing
      Given scope "acme" has units "engineering" and "platform"
      When a reporting line from "engineering" to "missing-parent" is attempted in scope "acme"
      Then the operation fails with error code "UNIT_NOT_FOUND"

    @DATA-04 @S-DATA-05
    Scenario: Reject ingest when parent external id is unknown
      Given an ingest payload with unknown parent reference:
        """
        {
          "scopeId": "acme",
          "units": [
            { "externalId": "u-eng", "name": "Engineering" },
            { "externalId": "u-plat", "name": "Platform", "parentExternalId": "u-ghost" }
          ]
        }
        """
      When ingest runs
      Then the operation fails with error code "INVALID_SCHEMA"

    @DATA-05 @S-DATA-06
    Scenario: Reject ingest that introduces a reporting cycle
      Given an ingest payload that introduces a reporting cycle:
        """
        {
          "scopeId": "acme",
          "units": [
            { "externalId": "u-a", "name": "Team A", "parentExternalId": "u-b" },
            { "externalId": "u-b", "name": "Team B", "parentExternalId": "u-a" }
          ]
        }
        """
      When ingest runs
      Then the operation fails with error code "CYCLE_DETECTED"

  Rule: SCN scenario lifecycle and structural edit behavior

    @SCN-01 @SCN-02 @S-SCN-01
    Scenario: Move scenario subtree without mutating baseline
      Given scope "acme" has baseline "baseline-v1" with units "engineering", "platform", and "ops" and reporting line from "platform" to "engineering"
      When scenario "scenario-a" is created from baseline "baseline-v1"
      Then scenario "scenario-a" state is "draft"
      When subtree rooted at "platform" is moved under "ops" in scenario "scenario-a"
      And scenario "scenario-a" is marked ready
      And scenario "scenario-a" is archived
      Then scenario "scenario-a" state is "archived"
      And scenario "scenario-a" unit "platform" reports to "ops"
      And baseline "baseline-v1" unit "platform" reports to "engineering"

    @SCN-03 @SCN-05 @S-SCN-03
    Scenario: Rank scenarios deterministically with the same scoring weights
      Given scope "acme" has baseline "baseline-score-v1" with units "engineering", "platform", and "ops" and reporting line from "platform" to "engineering"
      And scenario "scenario-a" is created from baseline "baseline-score-v1" and unit "innovation" is added to that scenario
      And scenario "scenario-b" is created from baseline "baseline-score-v1"
      And subtree rooted at "platform" is moved under "ops" in scenario "scenario-b"
      And a scenario scoring request:
        """
        {
          "targetSpan": 1,
          "maxDepth": 2,
          "weights": {
            "headcount": 0.4,
            "spanCompliance": 0.4,
            "complexity": 0.2
          }
        }
        """
      When scenarios "scenario-a" and "scenario-b" are ranked using scenario scoring
      Then ranked scenarios are ordered as "scenario-b", "scenario-a"
      And ranked scenarios have deterministic score ordering

    @SCN-03 @SCN-05 @S-SCN-04
    Scenario: Constraint violations can block scenario readiness
      Given scope "acme" has baseline "baseline-score-v2" with units "engineering", "platform", and "ops" and reporting line from "platform" to "engineering"
      And scenario "scenario-violation" is created from baseline "baseline-score-v2"
      And subtree rooted at "platform" is moved under "ops" in scenario "scenario-violation"
      And unit "innovation" is added to scenario "scenario-violation" under parent "platform"
      And unit "data" is added to scenario "scenario-violation" under parent "platform"
      And a blocking scenario scoring request:
        """
        {
          "targetSpan": 1,
          "maxDepth": 1,
          "weights": {
            "headcount": 0.2,
            "spanCompliance": 0.6,
            "complexity": 0.2
          }
        }
        """
      When scenario "scenario-violation" is scored and marked ready with scoring
      Then the operation fails with error code "SCENARIO_CONSTRAINTS_VIOLATED"
      And scenario "scenario-violation" has score violation code "SPAN_TARGET_EXCEEDED"
      And scenario "scenario-violation" has score violation code "MAX_DEPTH_EXCEEDED"
      And scenario "scenario-violation" ready block is true
      And scenario "scenario-violation" state is "draft"

    @SCN-04 @S-SCN-02
    Scenario: Diff a scenario against baseline with stable change references
      Given scope "acme" has baseline "baseline-diff-v1" with units "engineering", "platform", and "ops" and reporting line from "platform" to "engineering"
      And scenario "scenario-diff-a" is created from baseline "baseline-diff-v1"
      And subtree rooted at "platform" is moved under "ops" in scenario "scenario-diff-a"
      And unit "innovation" is added to scenario "scenario-diff-a" under parent "platform"
      And unit "innovation" is removed from scenario "scenario-diff-a"
      When scenario "scenario-diff-a" is diffed against its baseline
      Then scenario "scenario-diff-a" diff includes change "reparent_unit" for entity "platform"
      And scenario "scenario-diff-a" diff reports baseline parent "engineering" and scenario parent "ops" for entity "platform"

    @SCN-06 @S-SCN-05
    Scenario: Compare scenarios with ranked tabular metrics
      Given scope "acme" has baseline "baseline-compare-v1" with units "engineering", "platform", and "ops" and reporting line from "platform" to "engineering"
      And scenario "scenario-compare-a" is created from baseline "baseline-compare-v1"
      And scenario "scenario-compare-b" is created from baseline "baseline-compare-v1" and unit "innovation" is added to that scenario
      And subtree rooted at "platform" is moved under "ops" in scenario "scenario-compare-a"
      And a scenario scoring request:
        """
        {
          "targetSpan": 1,
          "maxDepth": 2,
          "weights": {
            "headcount": 0.5,
            "spanCompliance": 0.3,
            "complexity": 0.2
          }
        }
        """
      When scenarios "scenario-compare-a" and "scenario-compare-b" are compared using scenario scoring
      Then scenario comparison baseline is "baseline-compare-v1"
      And scenario comparison rank 1 is "scenario-compare-a"
      And scenario comparison rank 2 is "scenario-compare-b"
      And scenario comparison includes 2 rows

  Rule: REC recommendation generation and review workflow behavior

    @REC-01 @REC-02 @REC-03 @S-REC-01
    Scenario: Generate a structured recommendation artifact
      Given scope "acme" has recommendation context baseline "baseline-rec-v1" and scenario "scenario-rec-a"
      And a recommendation request:
        """
        {
          "scopeId": "acme",
          "baselineId": "baseline-rec-v1",
          "scenarioId": "scenario-rec-a",
          "constraints": [
            { "type": "span_of_control", "targetEntityId": "platform", "value": 8 }
          ],
          "metricSnapshots": [
            { "metricId": "engagement", "value": 0.62, "capturedAt": "2026-04-11T00:00:00.000Z" }
          ],
          "idempotencyKey": "rec-request-1"
        }
        """
      When recommendation generation runs
      Then recommendation is created in state "proposed"
      And recommendation has at least 1 suggested changes
      And recommendation rationale is present
      And recommendation confidence score is between 0 and 1
      And recommendation affects entity "platform"

    @REC-02 @REC-05 @S-REC-02
    Scenario: Recommendation output is deterministic with a mock ADK fixture
      Given scope "acme" has recommendation context baseline "baseline-rec-v1" and scenario "scenario-rec-b"
      And recommendation adapter fixture "golden-rec-default" is configured
      And a recommendation request:
        """
        {
          "scopeId": "acme",
          "baselineId": "baseline-rec-v1",
          "scenarioId": "scenario-rec-b",
          "constraints": [
            { "type": "span_of_control", "targetEntityId": "platform", "value": 8 }
          ],
          "metricSnapshots": [
            { "metricId": "engagement", "value": 0.62, "capturedAt": "2026-04-11T00:00:00.000Z" }
          ]
        }
        """
      When recommendation generation runs twice
      Then recommendation output matches golden fixture "golden-rec-default"

    @REC-04 @S-REC-03
    Scenario: Accept a proposed recommendation
      Given scope "acme" has recommendation context baseline "baseline-rec-v1" and scenario "scenario-rec-c"
      And a recommendation request:
        """
        {
          "scopeId": "acme",
          "baselineId": "baseline-rec-v1",
          "scenarioId": "scenario-rec-c",
          "constraints": [
            { "type": "span_of_control", "targetEntityId": "platform", "value": 8 }
          ],
          "metricSnapshots": [
            { "metricId": "engagement", "value": 0.62, "capturedAt": "2026-04-11T00:00:00.000Z" }
          ]
        }
        """
      When recommendation generation runs
      And latest recommendation is accepted by "operator-1" at "2026-04-11T10:30:00.000Z"
      Then recommendation is created in state "accepted"
      And recommendation was reviewed by "operator-1" at "2026-04-11T10:30:00.000Z"

    @REC-04 @S-REC-04
    Scenario: Reject a proposed recommendation without mutating baseline
      Given scope "acme" has recommendation context baseline "baseline-rec-v1" and scenario "scenario-rec-d"
      And a recommendation request:
        """
        {
          "scopeId": "acme",
          "baselineId": "baseline-rec-v1",
          "scenarioId": "scenario-rec-d",
          "constraints": [
            { "type": "span_of_control", "targetEntityId": "platform", "value": 8 }
          ],
          "metricSnapshots": [
            { "metricId": "engagement", "value": 0.62, "capturedAt": "2026-04-11T00:00:00.000Z" }
          ]
        }
        """
      When recommendation generation runs
      And latest recommendation is rejected by "operator-2" at "2026-04-11T11:00:00.000Z"
      Then recommendation is created in state "rejected"
      And baseline "baseline-rec-v1" unit "platform" reports to "engineering"
