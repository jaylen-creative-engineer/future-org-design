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
