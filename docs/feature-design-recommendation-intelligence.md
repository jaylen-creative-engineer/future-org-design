# Feature Design: Recommendation Intelligence

This design defines the next intelligence domain to build after scenario modeling: generating, reviewing, and tracking prescriptive recommendation artifacts from stable scenario inputs.

## Domain intent

Recommendation Intelligence turns analyzed org scenarios into structured, auditable actions that teams can accept or reject. The domain must stay deterministic under test and isolate the ADK integration behind a mockable boundary.

## Why this is the next domain

Roadmap ordering in `docs/feature-design-organization-design-epic.md` places recommendation capabilities (`REC-01` to `REC-05`) directly after org model and scenario foundations (`ORG`, `DATA`, `SCN`) for the first complete prescriptive slice.

## Scope for this body of work

- Implement recommendation domain contracts and service orchestration.
- Define an ADK adapter boundary with deterministic test fixtures.
- Implement recommendation review workflow state transitions.
- Define executable Gherkin scenarios for all `REC` P0 requirements.

## Out of scope (this task)

- Full monitoring loop closure automation (`MON-04`).
- UI workflow implementation details (`UX-03`) beyond contracts and payload shape.
- Production auth and RBAC enforcement (covered by `PLT-*` work later).

## Capability traceability

| Feature ID | Summary | Acceptance scenarios |
| ---------- | ------- | -------------------- |
| REC-01 | Build recommendation analysis context from baseline + scenario + constraints + metrics | S-REC-01 |
| REC-02 | Keep ADK integration behind an adapter boundary | S-REC-01, S-REC-02 |
| REC-03 | Persist structured recommendation artifact with actions + rationale + confidence | S-REC-01 |
| REC-04 | Support review state transitions: proposed -> accepted/rejected/superseded | S-REC-03, S-REC-04 |
| REC-05 | Guarantee deterministic outputs in CI with golden fixtures | S-REC-02 |

## Domain contracts (service-first)

### Input contract

`RecommendationRequest`

- `scopeId: string`
- `baselineId: string`
- `scenarioId: string`
- `constraints: RecommendationConstraint[]`
- `metricSnapshots: MetricSnapshotRef[]`
- `idempotencyKey?: string`

### Adapter boundary

`AdkRecommendationAdapter`

- `generate(input: RecommendationGenerationInput): Promise<RecommendationDraft>`
- No imports from API/UI modules.
- Must be swappable with deterministic mock adapter for tests.

### Output artifact

`RecommendationArtifact`

- `recommendationId: string`
- `scopeId: string`
- `baselineId: string`
- `scenarioId: string`
- `state: "proposed" | "accepted" | "rejected" | "superseded"`
- `suggestedChanges: SuggestedChange[]`
- `rationale: string`
- `confidenceScore: number`
- `affectedEntityIds: string[]`
- `createdAt: string`
- `reviewedAt?: string`
- `reviewedBy?: string`

## Implementation slices (ordered)

1. **REC-S1: Domain model and state machine**
   - Add `RecommendationArtifact` types and `REC-04` transition rules.
   - Add unit tests for valid and invalid transitions.
2. **REC-S2: Recommendation service orchestration**
   - Build `RecommendationService.generate` using baseline/scenario inputs and adapter boundary.
   - Add functional tests for `S-REC-01`.
3. **REC-S3: Deterministic adapter harness**
   - Add mock adapter + golden fixtures for fixed payload replay.
   - Add test coverage for `S-REC-02`.
4. **REC-S4: Review workflow persistence path**
   - Add repository operations for accept/reject/supersede updates.
   - Add tests for `S-REC-03` and `S-REC-04`.
5. **REC-S5: API contract handoff**
   - Publish request/response envelopes for future API routes.
   - Keep route handlers out of this slice unless needed for tests.

## Executable Gherkin plan

Create or extend feature coverage with tags below:

- `@REC-01 @REC-02 @REC-03 @S-REC-01`
- `@REC-02 @REC-05 @S-REC-02`
- `@REC-04 @S-REC-03`
- `@REC-04 @S-REC-04`

Scenarios remain complete only when `npm run integration:check` passes with no pending or undefined steps.

## Validation checklist

- Unit tests cover recommendation state transitions and invariants.
- Functional tests cover service orchestration with mock adapter.
- Golden fixtures verify deterministic outputs for CI repeatability.
- Integration gate passes:

```bash
npm run integration:check
```

