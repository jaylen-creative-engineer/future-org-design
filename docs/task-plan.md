# Implementation Task Plan

This task plan converts the roadmap into execution slices that are modular, testable, and review-friendly.

## Delivery strategy

- Sequence: service + database + functional tests first, then API routes, then UI experience.
- Keep each increment small enough for focused code review and rollback safety.
- Require clear contracts between layers: domain services -> repositories -> API routes -> UI.

## Workstreams

### Workstream A: Platform setup (Sprint 0)

- Create Next.js TypeScript app scaffold with App Router.
- Add linting, formatting, type-check, and test scripts.
- Add CI pipeline for lint + test + build.
- Add configuration management for DB and Google ADK credentials.

Definition of done:

- `npm run lint`, `npm run test`, and `npm run build` pass in CI.

### Workstream B: Data model and persistence (Sprint 1)

- Select database stack and ORM/migration tooling.
- Implement schema modules:
  - organization + teams + roles
  - reporting edges + scenarios
  - recommendations + monitoring snapshots
- Implement repository interfaces and concrete adapters.
- Add migration and seed strategy for deterministic tests.

Definition of done:

- Repository integration tests pass against test DB.
- Schema versioning and rollback are verified.

### Workstream C: Domain services and ADK harness (Sprints 1-2)

- Implement `OrgModelService` (ingest + normalize + validate).
- Implement `ScenarioService` (what-if generation and scoring).
- Implement `RecommendationService` (prescriptive output pipeline).
- Implement `MonitoringService` (post-change metrics and drift signals).
- Add `AdkAgentAdapter` abstraction so Google ADK is swappable/mocked.

Definition of done:

- Unit tests for each service module pass.
- Functional service tests validate full orchestration flows.
- ADK integration is covered by contract and mocked integration tests.

### Workstream D: API layer (Sprint 3)

- Add Next.js route handlers for service capabilities.
- Add request schema validation and response contracts.
- Add authentication/authorization placeholders for protected routes.
- Add route-level integration tests and error-path coverage.

Definition of done:

- API contract tests pass for create/read/update workflows and failures.
- Route handlers remain thin and delegate to service modules.

### Workstream E: Experience layer (Sprints 4-5)

- Build baseline org snapshot and upload flows.
- Build scenario compare and recommendation review flows.
- Build monitoring dashboard and change tracking flow.
- Add frontend tests for critical journeys and edge states.

Definition of done:

- End-to-end user journeys pass from UI to API to services.
- UI does not directly depend on persistence details.

## Modular implementation slices

Use this template for every PR/task:

1. Single capability scope (one domain behavior).
2. Service contract first (types/interfaces).
3. Tests first or in same change set (unit + integration as needed).
4. Minimal infrastructure touch.
5. API/UI wiring only after service contract is green.

## Test matrix

- Unit tests: pure domain logic and decision rules.
- Integration tests: repository + DB + migrations.
- Functional tests: multi-service workflows and ADK orchestration.
- API tests: route contracts, validation, auth failure paths.
- End-to-end tests: key user workflows after UI phase starts.

## Execution order checklist

- Core schema + repositories
- Domain services
- Functional validation suite
- API routes + contract tests
- Experience flows + end-to-end tests
- Observability and hardening

## Dependency and parallelization map

Use this section to orchestrate multiple agents without violating architectural dependencies.

### Task that must start first

- Platform setup baseline in Workstream A must begin first, specifically:
  - project scaffold
  - test/lint/build tooling
  - CI pipeline
  - config conventions

Reason: every other stream depends on shared project structure, scripts, and quality gates.

### Critical path (longest dependency chain)

1. Workstream A: platform setup
2. Workstream B: data model and repositories
3. Workstream C: domain services and ADK adapter
4. Functional validation suite (service workflow tests)
5. Workstream D: API routes and API contract tests
6. Workstream E: experience layer
7. Hardening and observability

### What can run in parallel

After Workstream A baseline is complete:

- In parallel:
  - B1 schema design and migration setup
  - C0 service interface and contract design
  - test harness setup for unit/integration/functional test folders
- Constraint: C implementation cannot complete until B repository contracts are stable.

After B initial schema + repository interfaces are stable:

- In parallel:
  - C service implementation per module (`OrgModelService`, `ScenarioService`, `RecommendationService`, `MonitoringService`)
  - integration tests for repositories
  - ADK adapter contract + mocks

After C core services reach green tests:

- In parallel:
  - D route handler implementation per capability
  - API contract test authoring
  - auth/RBAC scaffolding

After D API contracts stabilize:

- In parallel:
  - E frontend workflow implementation by journey
  - end-to-end tests by journey
  - observability instrumentation for API endpoints

### Dependency matrix (for agent scheduling)

- A scaffold -> B schema/repositories, C service contracts, test harness
- B repository interfaces -> C service implementations
- B migrations + test DB -> repository integration tests
- C service contracts + passing service tests -> D API route handlers
- D stable API contracts -> E UI workflows
- E implemented flows + D contracts -> end-to-end tests
- C and D stable behavior -> hardening (performance/security/SLOs)

### Suggested agent lanes

- Lane 1: Platform and CI
  - Own Workstream A and cross-cutting tooling updates.
- Lane 2: Data and persistence
  - Own Workstream B and repository integration tests.
- Lane 3: Domain and ADK orchestration
  - Own Workstream C and functional service validation.
- Lane 4: API contracts and routes
  - Own Workstream D once Lane 3 contracts are stable.
- Lane 5: Experience and E2E
  - Own Workstream E once Lane 4 contracts are stable.

### Handoff gates between lanes

- Gate A->B/C: lint/test/build + CI are green.
- Gate B->C: repository interfaces and migrations are versioned and testable.
- Gate C->D: service contracts frozen for current milestone and functional tests green.
- Gate D->E: API schemas and error contracts frozen for current milestone.
- Gate E->Release: end-to-end regression set green with baseline observability.

## Machine-readable orchestration spec

- Runner spec: `docs/orchestration-spec.yaml`
- Use this YAML as the source for:
  - lane assignment
  - dependency DAG scheduling
  - gate enforcement
  - parallel group activation

