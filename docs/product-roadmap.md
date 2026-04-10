# Future Org Design Product Roadmap

This roadmap translates the `docs/.devnotes` research and `docs/lat.md` knowledge graph into a build sequence for an ODaaS platform using Next.js and Google ADK.

## Product intent

- Build an intelligence-first ODaaS platform that supports a closed loop:
  - analytics -> design -> planning -> implementation -> monitoring
- Prioritize prescriptive org design, continuous redesign, and formal + informal org signals.
- Deliver in modular, testable segments so each increment can be deeply reviewed.

## Guiding principles from the knowledge graph

- Start with the highest value gap: prescriptive, data-driven structure recommendations.
- Keep implementation loop-oriented, not feature-siloed.
- Design for continuous operation (not episodic reorg projects).
- Separate domain logic from delivery interfaces (API/UI) for testability.

## Technical roadmap phases

### Phase 0: Foundation and architecture baseline (Week 1)

Goal: establish the app skeleton and engineering guardrails.

- Initialize Next.js app structure (App Router, TypeScript, linting, formatting).
- Define domain boundaries: ingestion, modeling, recommendation, monitoring.
- Establish testing strategy:
  - unit tests for domain/services
  - integration tests for database/repositories
  - API contract tests for route handlers
- Define environment and secrets strategy for DB and ADK integration.

Exit criteria:

- Local app boots.
- Test runner and CI checks run green.
- Architecture decision record exists for service-first modular design.

### Phase 1: Service and database core with functional validation (Weeks 2-4)

Goal: build the core back-end capability before UI.

- Model core entities: organization, role, team, reporting line, scenario, recommendation, metric snapshot.
- Implement repository layer and migrations.
- Build domain services:
  - org model service
  - scenario analysis service
  - recommendation service
  - monitoring signal service
- Integrate Google ADK harness behind an adapter boundary (no direct UI coupling).
- Add functional validation tests for each service capability and end-to-end service workflows.

Exit criteria:

- Core services pass unit + integration + functional tests.
- DB schema and migrations are stable.
- ADK-powered recommendation path is testable and deterministic under mocks.

### Phase 2: API routes and application contracts (Weeks 4-5)

Goal: expose stable interfaces to power future product experiences.

- Implement Next.js API routes for:
  - org data intake
  - scenario generation and evaluation
  - recommendation retrieval
  - monitoring and feedback updates
- Add request validation, structured error handling, and idempotency rules.
- Add API tests with realistic fixtures and failure-path coverage.

Exit criteria:

- API contracts documented and versioned.
- Route tests pass for happy path and key failure modes.
- Service-layer logic remains independently testable.

### Phase 3: Experience layer and workflow delivery (Weeks 6-8)

Goal: build the user experience on top of stable APIs.

- Implement core workflows:
  - baseline org snapshot
  - scenario compare
  - recommendation review and apply decision
  - post-change monitoring view
- Build thin UI orchestration that consumes APIs only.
- Add component and workflow tests focused on user-critical journeys.

Exit criteria:

- End-to-end flow works from ingest to monitored decision outcome.
- UX remains decoupled from service internals.
- Regression suite protects core journeys.

### Phase 4: Production hardening and GTM readiness (Weeks 9-10)

Goal: prepare for controlled pilots.

- Add observability (logs, tracing, metrics) across service and API layers.
- Add security controls: auth, RBAC, audit trails for structural changes.
- Add performance tests for scenario compute and recommendation latency.
- Finalize pilot readiness checklist and rollout playbook.

Exit criteria:

- Pilot environment is stable, observable, and secure.
- SLO baseline exists for availability and response time.
- Known-risk register and mitigation owners are defined.

## Milestone map

- M1: Foundation complete.
- M2: Service + DB + functional validation complete.
- M3: API contracts complete.
- M4: UX flows complete.
- M5: Pilot-ready release candidate.

