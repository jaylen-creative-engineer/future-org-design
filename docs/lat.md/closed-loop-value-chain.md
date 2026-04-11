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

## Implementation status snapshot (2026-04-11)

- Scenario modeling now has an executable baseline fork + structural edit slice in `features/org-model-intelligence.feature` (`@SCN-01`, `@SCN-02`, `@S-SCN-01`).
- Implemented behavior:
  - scenario copies are created from immutable baselines
  - scenario state transitions follow `draft -> ready -> archived`
  - subtree reparenting is allowed in scenarios and blocked from mutating baseline structure
- This closes a first part of the **Design** and **Planning** loop stages while preserving isolation from baseline state for repeatable comparison workflows.
