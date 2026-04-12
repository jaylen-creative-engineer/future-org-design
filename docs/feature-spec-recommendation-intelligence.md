# Feature Spec: Recommendation Intelligence (BDD)

This spec is executable through Cucumber and is the source of truth for recommendation-intelligence requirements.

## Executable spec location

- `features/org-model-intelligence.feature` (REC rule and `@REC-*` tags)

## How to validate implementation against the spec

Run REC-only scenarios:

```bash
npm run bdd -- --tags '@REC-01 or @REC-02 or @REC-03 or @REC-04 or @REC-05'
```

Run all BDD features:

```bash
npm run bdd
```

Run the full integration completion gate:

```bash
npm run integration:check
```

## Scenario coverage (traceability)

| Feature ID | Scenario tags |
| ---------- | ------------- |
| REC-01 | S-REC-01 |
| REC-02 | S-REC-01, S-REC-02 |
| REC-03 | S-REC-01 |
| REC-04 | S-REC-03, S-REC-04 |
| REC-05 | S-REC-02 |

## Domain behavior summary

- Recommendation generation builds analysis context from scope + baseline + scenario + constraints + metric snapshots.
- ADK integration is isolated behind a deterministic mockable adapter.
- Recommendation artifacts persist structured suggested changes, rationale, confidence, and affected entities.
- Review workflow transitions from `proposed` to `accepted`, `rejected`, or `superseded` with reviewer metadata.

## Completion gate

Work is complete for recommendation-intelligence when all tagged scenarios in `features/org-model-intelligence.feature` pass in CI, no scenario is pending or undefined, and `npm run integration:check` is green.
