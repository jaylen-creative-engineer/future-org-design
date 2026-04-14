# Feature Spec: Org Model Intelligence (BDD)

This spec is executable through Cucumber and is the source of truth for `org-model-intelligence` requirements.

## Executable spec location

- `features/org-model-intelligence.feature`

## How to validate implementation against the spec

Run only this domain:

```bash
npm run bdd:org-model
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
| ORG-01 | S-ORG-01 |
| ORG-02 | S-ORG-02 |
| ORG-03 | S-ORG-02, S-ORG-03 |
| ORG-04 | S-ORG-04 |
| ORG-05 | S-ORG-05 |
| ORG-06 | S-ORG-06 |
| DATA-01 | S-DATA-01 |
| DATA-02 | S-DATA-01, S-DATA-02, S-DATA-03 |
| DATA-03 | S-DATA-04 |
| DATA-04 | S-DATA-05 |
| DATA-05 | S-DATA-06 |
| SCN-01 | S-SCN-01 |
| SCN-02 | S-SCN-01 |
| SCN-04 | S-SCN-02 |
| SCN-05 | S-SCN-03 |

## Completion gate

Work is complete for org-model-intelligence when all tagged scenarios in `features/org-model-intelligence.feature` pass in CI, no scenario is pending or undefined, and `npm run integration:check` is green.
