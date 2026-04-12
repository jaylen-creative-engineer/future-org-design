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
