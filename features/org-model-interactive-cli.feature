@org-model-intelligence @interactive-cli @S-CLI-01
Feature: Interactive org model CLI flow
  As a product designer validating user journeys
  I want guided CLI navigation and input prompts
  So I can rehearse intuitive workflow interactions before building a UI

  Scenario: Build a minimal scope graph through guided prompts
    Given an interactive CLI session backed by in-memory persistence
    When the operator creates scope "acme" named "Acme Corp"
    And the operator adds unit "engineering" named "Engineering"
    And the operator adds unit "platform" named "Platform"
    And the operator links unit "platform" to parent "engineering"
    And the operator creates baseline "baseline-v1"
    And the operator creates scenario "scenario-a" from baseline "baseline-v1"
    And the operator scores scenario "scenario-a" against baseline "baseline-v1"
    And the operator creates recommendation with rationale "Consolidate platform operations" and confidence 0.8
    Then the interactive inspection for scope "acme" shows 2 units
    And the interactive inspection for scope "acme" shows 1 baseline
    And the interactive inspection for scope "acme" shows 1 scenario
    And the interactive inspection for scope "acme" shows 1 recommendation
    And the interactive output includes "Scenario score for scenario-a vs baseline-v1"

  @S-CLI-03
  Scenario: Non-interactive smoke and demo commands print validation envelopes
    Given CLI batch mode is configured for "memory"
    When CLI smoke validation runs
    Then the CLI envelope result is ok
    And the CLI envelope includes key "counts"
    When CLI guided demo batch runs
    Then the CLI envelope result is ok
    And the CLI envelope includes key "latestRecommendation"

  @S-CLI-02
  Scenario: Use flow map and guided walkthrough to validate navigation behavior
    Given an interactive CLI session backed by in-memory persistence
    And the operator creates scope "acme" named "Acme Corp"
    When the operator views the validation flow map
    And the operator runs the guided walkthrough with:
      | unitId     | walkthrough-unit |
      | unitName   | Walkthrough Unit |
      | baselineId | baseline-guided  |
      | scenarioId | scenario-guided  |
      | rationale  | Guided rationale |
      | confidence | 0.7              |
    And the operator shows action history
    Then the interactive output includes "Validation flow map"
    And the interactive output includes "Completed guided walkthrough"
    And the interactive output includes "Scenario score for scenario-guided vs baseline-guided"
    And the interactive output includes "Recommendation created for scenario"
    And the interactive inspection for scope "acme" shows 1 units
    And the interactive inspection for scope "acme" shows 1 baseline
    And the interactive inspection for scope "acme" shows 1 scenario
    And the interactive inspection for scope "acme" shows 1 recommendation

  @S-CLI-04 @SCN-04 @SCN-05
  Scenario: Compare and rank multiple scenarios against one baseline
    Given an interactive CLI session backed by in-memory persistence
    When the operator creates scope "acme" named "Acme Corp"
    And the operator adds unit "engineering" named "Engineering"
    And the operator adds unit "platform" named "Platform"
    And the operator links unit "platform" to parent "engineering"
    And the operator creates baseline "baseline-v2"
    And the operator creates scenario "scenario-1" from baseline "baseline-v2"
    And the operator creates scenario "scenario-2" from baseline "baseline-v2"
    And the operator compares scenarios against baseline "baseline-v2":
      | scenarioId |
      | scenario-1 |
      | scenario-2 |
    Then the interactive output includes "Scenario comparison ranking for baseline baseline-v2"
    And the interactive output includes "contributors=no_structural_drift"
    And the interactive output includes "1. scenario-1"
    And the interactive output includes "2. scenario-2"
