@experience-intelligence
Feature: Editorial marketing landing page
  The public homepage presents Future Org Design as an org design
  intelligence company using an editorial, numbered-section layout.
  These scenarios pin the narrative contract that app/page.tsx renders
  from src/landing/landing-content.ts.

  @EXP-01
  Scenario: Hero states the company thesis with an emphasized word
    Given the published landing page content
    Then the hero emphasizes the word "meaningful"
    And the hero reads "Org design is meaningful when structure can naturally respond to change."

  @EXP-02
  Scenario: Sections are numbered sequentially in editorial order
    Given the published landing page content
    Then the landing page presents 6 numbered sections
    And the section indexes run sequentially from "01" to "06"
    And the sections appear in this order:
      | index | name     |
      | 01    | Mission  |
      | 02    | Research |
      | 03    | Proof    |
      | 04    | Platform |
      | 05    | Process  |
      | 06    | Updates  |

  @EXP-03
  Scenario: The mission section declares the intelligence-company positioning
    Given the published landing page content
    When I read the "mission" section
    Then its heading contains "org design intelligence company"
    And its heading contains "the most important interface to organizational decisions"

  @EXP-04
  Scenario: The process section walks through the closed loop in four steps
    Given the published landing page content
    Then the process lists 4 steps numbered sequentially from 1
    And the process steps are titled:
      | title                        |
      | Ingest a baseline            |
      | Fork scenarios               |
      | Review recommendations       |
      | Monitor. Experiment with us. |

  @EXP-05
  Scenario: Navigation covers every anchored section and ends in a contact call to action
    Given the published landing page content
    Then every navigation link targets a declared section anchor
    And the primary call to action is labeled "Get in touch"

  @EXP-06
  Scenario: The updates feed publishes dated progress cards
    Given the published landing page content
    Then the updates section lists 3 dated progress cards
    And every update card has a date, a title, and a summary
