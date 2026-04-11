# Feature Design: Organization Design Epic

This document defines the **feature set** and **scenarios** needed to complete the next development epic: **prescriptive, loop-oriented organization design** on top of the existing knowledge-graph foundation. It aligns with `docs/product-roadmap.md` (Phases 1–4), `docs/knowledge-graph-view/intelligence-plan.json` capability domains, and the closed loop in `docs/lat.md/closed-loop-value-chain.md`.

## Epic intent

Deliver a **minimal complete slice** of ODaaS: ingest and normalize an org structure, model **what-if scenarios**, produce **prescriptive recommendations** (via an adapter to the Google ADK harness), expose **stable APIs**, ship **core UX workflows**, and close the loop with **monitoring** signals—so the platform can run **continuously**, not only as a one-off redesign project.

## In scope for this epic

- Formal org structure (units, roles/positions, reporting lines, basic matrix/dotted-line representation as data).
- Scenario modeling, comparison, and scoring sufficient to rank alternatives.
- Recommendation generation with explicit artifacts (rationale, suggested actions, review state).
- Monitoring of **structural and metric snapshots** after decisions (drift-oriented, not full HRIS replacement).
- API contracts and application workflows described in the roadmap.

## Explicitly out of scope (later epics unless noted)

- Full **ONA** (email/calendar graph ingestion)—capture **interfaces and placeholders** only if needed for monitoring stubs.
- Deep **operating model** authoring (decision-rights matrices as first-class UI)—may appear as **metadata hooks** on entities without a full governance product.
- **Labor market** and external salary feeds.
- Full **change management** execution (Jira/Workday workflows)—**export or handoff** hooks only at epic boundary.
- Production **multi-tenant SaaS** hardening beyond pilot-grade auth/RBAC/audit where listed in Platform features.

## Traceability


| Intelligence domain (`intelligence-plan.json`) | Feature groups below |
| ---------------------------------------------- | -------------------- |
| `org-model-intelligence`                       | ORG, DATA            |
| `scenario-intelligence`                        | SCN                  |
| `recommendation-intelligence`                  | REC                  |
| `monitoring-intelligence`                      | MON                  |
| `api-contract-intelligence`                    | API                  |
| `experience-intelligence`                      | UX                   |
| (cross-cutting)                                | PLT                  |


---

## Features

Features are numbered for reference in scenarios and tests. **Priority** is relative within the epic: **P0** blocks a credible vertical slice; **P1** completes the roadmap Phases 1–3 narrative; **P2** strengthens pilots and Phase 4.

### ORG — Org model & persistence


| ID     | Feature                       | Priority | Summary                                                                                                         |
| ------ | ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| ORG-01 | Tenancy and organization root | P0       | Single-tenant or org-scoped root; all entities belong to an organization scope.                                 |
| ORG-02 | Core entities                 | P0       | Organization unit, team/group, role or position, assignment (person optional), reporting line.                  |
| ORG-03 | Reporting topology            | P0       | Tree plus additional edges for dotted/matrix; cycle detection and validation rules.                             |
| ORG-04 | Constraints                   | P1       | Encode targets and limits (e.g., span of control, max depth, cost or headcount caps) as data validated on save. |
| ORG-05 | Baseline snapshot             | P0       | Immutable (or versioned) baseline of structure for scenario fork and comparison.                                |
| ORG-06 | Schema migrations             | P0       | Repository layer and DB migrations; entities stable enough for API contracts.                                   |


### DATA — Ingestion & normalization


| ID      | Feature              | Priority | Summary                                                                                                    |
| ------- | -------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| DATA-01 | Structured ingest    | P0       | Accept batch payloads (JSON/CSV contract) for units, roles, lines, optional people identifiers.            |
| DATA-02 | Normalization        | P0       | Map external keys to internal IDs; dedupe and merge rules; reject or quarantine invalid rows with reasons. |
| DATA-03 | Idempotent re-ingest | P1       | Same logical payload does not duplicate entities; updates are explicit.                                    |
| DATA-04 | Lineage metadata     | P2       | Record source system, ingest batch id, and timestamp for audit.                                            |


### SCN — Scenario intelligence


| ID     | Feature            | Priority | Summary                                                                                                                                 |
| ------ | ------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| SCN-01 | Scenario lifecycle | P0       | Create scenario from baseline; states: draft → ready → archived.                                                                        |
| SCN-02 | Structural edits   | P0       | Add/remove/move nodes and edges within a scenario without mutating baseline.                                                            |
| SCN-03 | Parameters         | P1       | Numeric or enum parameters (e.g., target span, layer count) driving validation or scoring.                                              |
| SCN-04 | Diff vs baseline   | P0       | Deterministic structural diff (added/removed/changed nodes and reporting relationships).                                                |
| SCN-05 | Scoring            | P0       | Multi-criteria score (at least: cost/headcount proxy, span compliance, simple risk or complexity proxy); extensible for future weights. |
| SCN-06 | Comparison         | P1       | Side-by-side metrics for two or more scenarios against baseline.                                                                        |


### REC — Recommendation intelligence


| ID     | Feature                 | Priority | Summary                                                                                                       |
| ------ | ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| REC-01 | Analysis context        | P0       | Bundle baseline + scenario(s) + relevant constraints + metric snapshots for recommendation input.             |
| REC-02 | ADK adapter boundary    | P0       | Single service boundary; no UI imports; mockable for tests.                                                   |
| REC-03 | Recommendation artifact | P0       | Structured output: suggested changes, rationale text, confidence or score, affected entities.                 |
| REC-04 | Review workflow         | P0       | States: proposed → accepted / rejected / superseded; store actor and timestamp when platform identity exists. |
| REC-05 | Determinism under test  | P0       | Golden fixtures + mock ADK responses for CI.                                                                  |


### MON — Monitoring intelligence


| ID     | Feature          | Priority | Summary                                                                                                                     |
| ------ | ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| MON-01 | Metric snapshots | P0       | Attach time-stamped metrics to org scope (e.g., engagement proxy, turnover, productivity placeholder).                      |
| MON-02 | Pre/post windows | P1       | Associate snapshots with a decision event; compare before/after for selected metrics.                                       |
| MON-03 | Drift signals    | P1       | Flag material divergence between planned structure and current structure, or metric drift vs threshold.                     |
| MON-04 | Loop closure     | P2       | Feed drift summaries as optional input to new recommendation runs (data contract only in epic if full automation deferred). |


### API — Contract intelligence


| ID     | Feature                | Priority | Summary                                                                                |
| ------ | ---------------------- | -------- | -------------------------------------------------------------------------------------- |
| API-01 | REST JSON surface      | P0       | Routes for ingest, org model read, scenarios, recommendations, monitoring per roadmap. |
| API-02 | Validation & errors    | P0       | Request validation; stable error envelope with machine-readable codes.                 |
| API-03 | Idempotency            | P1       | Idempotency keys for applicable write operations.                                      |
| API-04 | Contract documentation | P1       | Versioned API notes or OpenAPI fragment checked into repo.                             |


### UX — Experience workflows


| ID    | Feature               | Priority | Summary                                                              |
| ----- | --------------------- | -------- | -------------------------------------------------------------------- |
| UX-01 | Baseline view         | P0       | Navigate baseline structure (list/tree/chart as appropriate to MVP). |
| UX-02 | Scenario editor       | P0       | Edit scenario and view diff vs baseline.                             |
| UX-03 | Recommendation review | P0       | Review REC-03 artifacts; accept/reject with audit trail.             |
| UX-04 | Monitoring view       | P1       | Show MON snapshots and simple before/after or drift indicators.      |
| UX-05 | Thin API client       | P0       | UI calls APIs only; no direct DB access from client.                 |


### PLT — Platform & pilot readiness


| ID     | Feature                | Priority | Summary                                                                         |
| ------ | ---------------------- | -------- | ------------------------------------------------------------------------------- |
| PLT-01 | Authentication         | P1       | Protect routes and APIs for pilot (mechanism per architecture baseline).        |
| PLT-02 | RBAC                   | P2       | Role-based permissions for read vs structural write vs recommendation approval. |
| PLT-03 | Audit log              | P1       | Append-only record of structural changes and recommendation decisions.          |
| PLT-04 | Observability          | P1       | Structured logs and request correlation for API and services.                   |
| PLT-05 | Performance guardrails | P2       | Baseline latency checks for scenario scoring and recommendation path.           |


---

## Scenarios

Scenarios are written for **acceptance** and **test design** (functional, API, and workflow). **Actor** is implied where it helps; use **system** for batch or automated flows.

### ORG scenarios


| ID       | Related features | Scenario                                                                                                                                              |
| -------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-ORG-01 | ORG-01, ORG-02   | **Given** a new organization scope, **when** an operator creates the root org and first unit, **then** the unit persists and appears in scoped reads. |
| S-ORG-02 | ORG-02, ORG-03   | **Given** two units, **when** a reporting line is added from child to parent, **then** the hierarchy resolves and depth can be queried.               |
| S-ORG-03 | ORG-03           | **Given** a proposed reporting change, **when** it would create a cycle, **then** the system rejects with a validation error.                         |
| S-ORG-04 | ORG-04           | **Given** a max-span constraint, **when** a manager would exceed it, **then** save fails or flags violation per product rule.                         |
| S-ORG-05 | ORG-05           | **Given** a committed baseline, **when** a scenario is created, **then** the scenario references baseline version and does not mutate it.             |


### DATA scenarios


| ID        | Related features | Scenario                                                                                                                                                                            |
| --------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-DATA-01 | DATA-01, DATA-02 | **Given** a valid ingest payload with external keys, **when** ingest runs, **then** entities are created with stable internal IDs and mappings.                                     |
| S-DATA-02 | DATA-02          | **Given** a row with a duplicate external key, **when** ingest runs, **then** dedupe rule applies and no silent duplicate scope is created.                                         |
| S-DATA-03 | DATA-02          | **Given** a row violating schema, **when** ingest runs, **then** the batch reports structured errors and does not partially corrupt baseline without explicit partial-apply policy. |
| S-DATA-04 | DATA-03          | **Given** the same ingest content run twice with idempotency, **when** processed, **then** entity counts are unchanged after the first successful application.                      |


### SCN scenarios


| ID       | Related features | Scenario                                                                                                                                             |
| -------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-SCN-01 | SCN-01, SCN-02   | **Given** a baseline, **when** a user creates a scenario and moves a subtree, **then** only the scenario copy changes.                               |
| S-SCN-02 | SCN-04           | **Given** a modified scenario, **when** diff is requested vs baseline, **then** the response lists structural changes with stable entity references. |
| S-SCN-03 | SCN-05           | **Given** two scenarios, **when** scored with the same weights, **then** ordering is deterministic for identical inputs.                             |
| S-SCN-04 | SCN-03, SCN-05   | **Given** parameters that violate constraints, **when** scored, **then** violations contribute to score or block “ready” per rule.                   |
| S-SCN-05 | SCN-06           | **Given** scenario A and B, **when** compared, **then** the UI or API returns a ranked or tabular comparison of key metrics.                         |


### REC scenarios


| ID       | Related features       | Scenario                                                                                                                                                                      |
| -------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-REC-01 | REC-01, REC-02, REC-03 | **Given** a scenario and constraints, **when** recommendation is requested, **then** a structured artifact is returned with at least one actionable suggestion and rationale. |
| S-REC-02 | REC-02, REC-05         | **Given** a mock ADK returning a fixed payload, **when** the recommendation service runs in CI, **then** output matches golden expectations.                                  |
| S-REC-03 | REC-04                 | **Given** a proposed recommendation, **when** a user accepts it, **then** state is persisted with timestamp and optional actor.                                               |
| S-REC-04 | REC-04                 | **Given** a proposed recommendation, **when** a user rejects it, **then** state is rejected and does not apply to baseline without a separate explicit merge operation.       |


### MON scenarios


| ID       | Related features | Scenario                                                                                                                                |
| -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| S-MON-01 | MON-01           | **Given** an organization, **when** a metric snapshot is submitted, **then** it stores with time and type and is retrievable by range.  |
| S-MON-02 | MON-02           | **Given** a decision event, **when** pre and post snapshots exist, **then** the system can compute a simple delta for selected metrics. |
| S-MON-03 | MON-03           | **Given** a planned structure and current structure, **when** drift is evaluated, **then** material differences surface as signals.     |


### API scenarios


| ID       | Related features | Scenario                                                                                                                                         |
| -------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| S-API-01 | API-01, API-02   | **Given** a malformed body, **when** POST ingest is called, **then** the API returns 4xx with a stable error shape.                              |
| S-API-02 | API-01           | **Given** a valid scenario id, **when** GET scenario is called, **then** the response matches the documented contract version.                   |
| S-API-03 | API-03           | **Given** a retried write with the same idempotency key, **when** the server processes it, **then** at-most-once side effects hold for that key. |


### UX scenarios


| ID      | Related features | Scenario                                                                                                                                              |
| ------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-UX-01 | UX-01, UX-05     | **Given** a logged-in user, **when** they open the baseline view, **then** data is loaded via API and reflects the latest successful ingest.          |
| S-UX-02 | UX-02, UX-05     | **Given** a scenario in draft, **when** the user saves edits, **then** diff and scores update without page-level service calls to the database.       |
| S-UX-03 | UX-03            | **Given** a pending recommendation, **when** the user accepts from the UI, **then** API updates REC state and the UI shows confirmation.              |
| S-UX-04 | UX-04            | **Given** monitoring data, **when** the user opens the monitoring view, **then** at least one comparative visualization or table is shown per MON-02. |


### PLT scenarios


| ID       | Related features | Scenario                                                                                                   |
| -------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| S-PLT-01 | PLT-01           | **Given** an unauthenticated client, **when** calling a protected API, **then** access is denied.          |
| S-PLT-02 | PLT-03           | **Given** a structural change, **when** committed, **then** an audit entry exists with who/when/what.      |
| S-PLT-03 | PLT-04           | **Given** a request id header, **when** logs are queried, **then** service and API logs can be correlated. |


### End-to-end (epic) scenarios


| ID       | Related features        | Scenario                                                                                                                                                        |
| -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-E2E-01 | DATA, ORG, SCN, API, UX | **Given** empty org, **when** user ingests baseline data and opens baseline view, **then** structure matches ingest.                                            |
| S-E2E-02 | SCN, REC, API           | **Given** baseline and scenario, **when** recommendation is requested and ADK returns success, **then** artifact is persisted and retrievable.                  |
| S-E2E-03 | REC, MON, UX            | **Given** an accepted recommendation and later metric snapshots, **when** monitoring runs, **then** user can see before/after or drift for the decision window. |


---

## Coverage checklist

Use this table to confirm the epic is “complete” for planning: every **P0** feature has at least one scenario; **P1** features have scenarios or explicit deferral to a follow-up sprint.


| Area | P0 features          | P0 scenario IDs (min.) |
| ---- | -------------------- | ---------------------- |
| ORG  | ORG-01–03, ORG-05–06 | S-ORG-01–03, S-ORG-05  |
| DATA | DATA-01–02           | S-DATA-01–03           |
| SCN  | SCN-01–02, SCN-04–05 | S-SCN-01–03            |
| REC  | REC-01–05            | S-REC-01–04            |
| MON  | MON-01               | S-MON-01               |
| API  | API-01–02            | S-API-01–02            |
| UX   | UX-01–03, UX-05      | S-UX-01–03             |
| E2E  | —                    | S-E2E-01–02            |


**P1 completion** for roadmap M3–M4: add S-DATA-04, S-SCN-04–05, S-MON-02–03, S-API-03, S-UX-04, S-E2E-03, plus PLT scenarios as auth and audit land.

---

## Document history


| Version | Date       | Notes                                                               |
| ------- | ---------- | ------------------------------------------------------------------- |
| 0.1.0   | 2026-04-11 | Initial feature catalog and scenarios for organization design epic. |


