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
