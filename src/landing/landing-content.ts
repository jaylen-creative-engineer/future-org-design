/**
 * Content model for the editorial marketing landing page.
 *
 * The Next.js homepage (app/page.tsx) renders from this module, and the
 * @experience-intelligence Gherkin scenarios assert against it, so the
 * narrative contract stays testable without booting a browser.
 */

export type LandingCta = {
  label: string;
  href: string;
};

export type LandingSection = {
  /** Anchor id used for in-page navigation. */
  id: string;
  /** Two-digit editorial index shown in the section kicker, e.g. "01". */
  index: string;
  /** Short kicker name shown next to the index, e.g. "Mission". */
  name: string;
  /** The section's display heading. */
  heading: string;
  /**
   * Optional phrase within `heading` rendered in italic serif, matching the
   * editorial emphasis motif ("same rigor", "a loop", ...).
   */
  emphasis?: string;
};

export type ProcessStep = {
  number: number;
  title: string;
  description: string;
};

export type UpdateCard = {
  date: string;
  title: string;
  summary: string;
};

export type LandingContent = {
  brand: string;
  nav: LandingCta[];
  primaryCta: LandingCta;
  hero: {
    lead: string;
    emphasis: string;
    trail: string;
  };
  sections: LandingSection[];
  processSteps: ProcessStep[];
  updates: UpdateCard[];
  joinHeading: string;
  closingInvitation: string;
};

export const landingContent: LandingContent = {
  brand: "Future Org Design",
  nav: [
    { label: "Mission", href: "#mission" },
    { label: "Research", href: "#research" },
    { label: "Platform", href: "#platform" },
    { label: "Process", href: "#process" },
    { label: "Updates", href: "#updates" }
  ],
  primaryCta: { label: "Get in touch", href: "#contact" },
  hero: {
    lead: "Org design is",
    emphasis: "meaningful",
    trail: "when structure can naturally respond to change."
  },
  sections: [
    {
      id: "mission",
      index: "01",
      name: "Mission",
      heading:
        "We are an org design intelligence company. Our mission is to bring structure into the real world through data, the most important interface to organizational decisions."
    },
    {
      id: "research",
      index: "02",
      name: "Research",
      heading: "We develop org models with the same rigor researchers bring to data",
      emphasis: "same rigor"
    },
    {
      id: "proof",
      index: "03",
      name: "Proof",
      heading:
        "Our platform is built for org designers, COOs, and people-ops teams that work with baselines, scenarios, recommendations, and monitoring."
    },
    {
      id: "platform",
      index: "04",
      name: "Platform",
      heading: "A platform suite designed for baseline, scenario, and recommendation workflows"
    },
    {
      id: "process",
      index: "05",
      name: "Process",
      heading: "Working with us is a loop, not a project",
      emphasis: "a loop"
    },
    {
      id: "updates",
      index: "06",
      name: "Updates",
      heading: "Updates on our progress"
    }
  ],
  processSteps: [
    {
      number: 1,
      title: "Ingest a baseline",
      description:
        "Push units, roles and reporting lines as JSON or CSV. Keys are normalized, duplicates merged, and invalid rows quarantined with reasons."
    },
    {
      number: 2,
      title: "Fork scenarios",
      description:
        "Branch the baseline into competing designs. Every edit produces a deterministic structural diff and an updated multi-criteria score."
    },
    {
      number: 3,
      title: "Review recommendations",
      description:
        "AI-generated structural moves arrive with rationale, confidence and affected entities — accepted or rejected with a full audit trail."
    },
    {
      number: 4,
      title: "Monitor. Experiment with us.",
      description:
        "Time-stamped metric snapshots and drift signals compare before and after the decision window, feeding the next design pass."
    }
  ],
  updates: [
    {
      date: "2026 / 06",
      title: "Scenario scoring and ranking ships",
      summary:
        "Deterministic multi-criteria scorecards rank competing designs on cost, span compliance and complexity risk — same inputs, same ranking."
    },
    {
      date: "2026 / 05",
      title: "Twelve executable org-model slices",
      summary:
        "Structure, reporting validation, baseline isolation and ingest normalization are all covered by executable Gherkin scenarios."
    },
    {
      date: "2026 / 04",
      title: "Knowledge graph snapshot v2",
      summary:
        "The public knowledge-graph JSON now embeds the intelligence plan, so product promise and build progress ship as one artifact."
    }
  ],
  joinHeading: "Join us to shape the future of org design",
  closingInvitation: "Interested in working with us?"
};

/** The section indexes in the order they appear on the page. */
export function sectionIndexSequence(content: LandingContent): string[] {
  return content.sections.map((section) => section.index);
}

/**
 * True when section indexes count up from "01" without gaps, keeping the
 * editorial numbering honest as sections are added or reordered.
 */
export function sectionsAreSequential(content: LandingContent): boolean {
  return content.sections.every(
    (section, i) => section.index === String(i + 1).padStart(2, "0")
  );
}

/** True when process steps are numbered 1..n in display order. */
export function processStepsAreSequential(content: LandingContent): boolean {
  return content.processSteps.every((step, i) => step.number === i + 1);
}

/**
 * True when every declared section emphasis is an actual phrase of its
 * heading, so the italic-serif rendering can never silently drop copy.
 */
export function emphasisPhrasesAreInHeadings(content: LandingContent): boolean {
  return content.sections.every(
    (section) => section.emphasis === undefined || section.heading.includes(section.emphasis)
  );
}
