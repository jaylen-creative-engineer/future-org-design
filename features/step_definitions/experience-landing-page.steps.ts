import { Given, Then, When } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { DataTable } from "@cucumber/cucumber";
import {
  emphasisPhrasesAreInHeadings,
  landingContent,
  processStepsAreSequential,
  sectionIndexSequence,
  sectionsAreSequential,
  type LandingContent,
  type LandingSection
} from "../../src/landing/landing-content.js";

type LandingWorld = {
  landing?: LandingContent;
  currentSection?: LandingSection;
};

function content(world: LandingWorld): LandingContent {
  assert.ok(world.landing, "Expected landing content to be loaded");
  return world.landing;
}

Given("the published landing page content", function (this: LandingWorld) {
  this.landing = landingContent;
});

Then(
  "the hero emphasizes the word {string}",
  function (this: LandingWorld, word: string) {
    assert.equal(content(this).hero.emphasis, word);
  }
);

Then("the hero reads {string}", function (this: LandingWorld, sentence: string) {
  const { lead, emphasis, trail } = content(this).hero;
  assert.equal(`${lead} ${emphasis} ${trail}`, sentence);
});

Then(
  "the landing page presents {int} numbered sections",
  function (this: LandingWorld, count: number) {
    assert.equal(content(this).sections.length, count);
  }
);

Then(
  "the section indexes run sequentially from {string} to {string}",
  function (this: LandingWorld, first: string, last: string) {
    const indexes = sectionIndexSequence(content(this));
    assert.equal(indexes[0], first);
    assert.equal(indexes[indexes.length - 1], last);
    assert.equal(sectionsAreSequential(content(this)), true, "Section indexes must count up without gaps");
  }
);

Then(
  "the sections appear in this order:",
  function (this: LandingWorld, table: DataTable) {
    const expected = table.hashes();
    const actual = content(this).sections.map((s) => ({ index: s.index, name: s.name }));
    assert.deepEqual(actual, expected);
  }
);

When("I read the {string} section", function (this: LandingWorld, id: string) {
  const found = content(this).sections.find((s) => s.id === id);
  assert.ok(found, `Expected a section with id "${id}"`);
  this.currentSection = found;
});

Then("its heading contains {string}", function (this: LandingWorld, fragment: string) {
  assert.ok(this.currentSection, "Expected a section to be selected");
  assert.ok(
    this.currentSection.heading.includes(fragment),
    `Expected heading to contain "${fragment}", got: ${this.currentSection.heading}`
  );
});

Then(
  "the process lists {int} steps numbered sequentially from {int}",
  function (this: LandingWorld, count: number, start: number) {
    const steps = content(this).processSteps;
    assert.equal(steps.length, count);
    assert.equal(steps[0]?.number, start);
    assert.equal(processStepsAreSequential(content(this)), true, "Process steps must be numbered 1..n");
  }
);

Then("the process steps are titled:", function (this: LandingWorld, table: DataTable) {
  const expected = table.hashes().map((row) => row.title);
  const actual = content(this).processSteps.map((s) => s.title);
  assert.deepEqual(actual, expected);
});

Then(
  "every navigation link targets a declared section anchor",
  function (this: LandingWorld) {
    const anchors = new Set(content(this).sections.map((s) => `#${s.id}`));
    for (const link of content(this).nav) {
      assert.ok(
        anchors.has(link.href),
        `Nav link "${link.label}" targets ${link.href}, which is not a declared section anchor`
      );
    }
  }
);

Then(
  "the primary call to action is labeled {string}",
  function (this: LandingWorld, label: string) {
    assert.equal(content(this).primaryCta.label, label);
  }
);

Then(
  "the updates section lists {int} dated progress cards",
  function (this: LandingWorld, count: number) {
    assert.equal(content(this).updates.length, count);
  }
);

Then(
  "every declared section emphasis is a phrase of its own heading",
  function (this: LandingWorld) {
    assert.equal(
      emphasisPhrasesAreInHeadings(content(this)),
      true,
      "Every section emphasis must appear verbatim in its heading"
    );
  }
);

Then(
  "the {string} section emphasizes {string}",
  function (this: LandingWorld, id: string, phrase: string) {
    const found = content(this).sections.find((s) => s.id === id);
    assert.ok(found, `Expected a section with id "${id}"`);
    assert.equal(found.emphasis, phrase);
  }
);

Then(
  "every update card has a date, a title, and a summary",
  function (this: LandingWorld) {
    for (const card of content(this).updates) {
      assert.ok(card.date.length > 0, "Update card is missing a date");
      assert.ok(card.title.length > 0, "Update card is missing a title");
      assert.ok(card.summary.length > 0, "Update card is missing a summary");
    }
  }
);
