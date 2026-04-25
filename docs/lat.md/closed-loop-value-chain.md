# Closed-loop value chain

The end-to-end pipeline ODaaS seeks to own: analytics through monitoring, and why unifying it beats point solutions.

## Closed-loop pipeline

Canonical loop from research:

```
People Analytics → Org Design → Workforce Planning → Implementation → Monitoring → (repeat)
```

- **Analytics** — [[market-and-tam#People analytics and org design]].
- **Design** — [[strategic-gaps#Operating model layer]].
- **Planning** — [[market-and-tam#Workforce planning disconnect]].
- **Implementation** — [[strategic-gaps#Ten critical market gaps]] (last mile).
- **Monitoring** — [[ai-and-data-layer#Organizational network analysis (ONA)]].

Addresses [[competition#Who owns which slice]].

## Why it matters

Separate vendors per stage raise integration cost and block prescriptions — [[strategic-gaps#Prescriptive analytics gap]].

## ODaaS alignment

[[odaas-core#ODaaS product thesis]] — rotate the loop continuously vs [[buyers-and-pain#Continuous design gap]].

## Implementation status snapshot (2026-04-25)

This snapshot records shipped scenario-intelligence and recommendation-intelligence behaviors that operationalize the design/planning loop with executable requirements.

- Org model intelligence (structure + ingest) is at full planned unit coverage in `features/org-model-intelligence.feature` (`@ORG-01` through `@ORG-06`, `@DATA-01` through `@DATA-05`, including ingest-time cycle detection and unknown-parent rejection).
- Scenario modeling now has an executable baseline fork + structural edit slice in `features/org-model-intelligence.feature` (`@SCN-01`, `@SCN-02`, `@S-SCN-01`).
- Recommendation intelligence now has executable artifact generation + review workflow coverage in `features/org-model-intelligence.feature` (`@REC-01` to `@REC-05`, `@S-REC-01` to `@S-REC-04`).
- Interactive experience intelligence now includes a guided CLI prototype in `src/org-model/org-model-cli.ts` with executable behavior in `features/org-model-interactive-cli.feature` (`@S-CLI-01`), covering navigation, prompt sequencing, and end-to-end creation of scope, units, reporting lines, baselines, scenarios, and recommendations.
- Implemented behavior:
  - scenario copies are created from immutable baselines
  - scenario state transitions follow `draft -> ready -> archived`
  - subtree reparenting is allowed in scenarios and blocked from mutating baseline structure
  - recommendation artifacts are generated through a deterministic ADK adapter boundary with structured suggested changes, rationale, and confidence
  - recommendation review transitions enforce `proposed -> accepted/rejected/superseded` with reviewer metadata
  - interactive users can navigate menu actions, switch context, and inspect persisted scope state snapshots while iterating on UX flow design
- This closes a larger part of the **Design**, **Planning**, and early **Implementation** loop stages while preserving baseline isolation for repeatable comparison and decision workflows.
