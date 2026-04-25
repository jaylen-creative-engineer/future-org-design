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
    And the operator creates recommendation with rationale "Consolidate platform operations" and confidence 0.8
    Then the interactive inspection for scope "acme" shows 2 units
    And the interactive inspection for scope "acme" shows 1 baseline
    And the interactive inspection for scope "acme" shows 1 scenario
    And the interactive inspection for scope "acme" shows 1 recommendation

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
    And the interactive output includes "Recommendation created for scenario"
    And the interactive inspection for scope "acme" shows 1 units
    And the interactive inspection for scope "acme" shows 1 baseline
    And the interactive inspection for scope "acme" shows 1 scenario
    And the interactive inspection for scope "acme" shows 1 recommendation
