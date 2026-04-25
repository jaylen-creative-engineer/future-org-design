# AI Agent Workflow Reference

Use this workflow for all implementation tasks in this repository.

## Primary objective

Maintain alignment between code, roadmap, and the `docs/lat.md` knowledge graph while delivering modular, testable increments.

## Mandatory workflow

### 0) Git baseline (main + task branch)

Before writing code for a substantive task:

- Fetch and fast-forward local **`main`** from **`origin/main`** (see **`.cursor/rules/branch-work-scope.mdc`** for exact commands).
- Create or update a **task-scoped** branch from that tip (`<scope>/<short-kebab-description>`). Do not pile unrelated work onto a stale branch without rebasing onto current `main` first.

If the user names a different base branch, treat that branch the same way: fetch and fast-forward from `origin` before branching.

### 1) Pre-change knowledge graph review

Before writing code (after step 0):

- Read `docs/lat.md/lat.md` (graph index).
- Read relevant domain pages linked from the index.
- Extract constraints and assumptions for the target change.
- Confirm the change aligns with:
  - prescriptive org design
  - closed-loop value chain
  - continuous redesign principles

### 2) Technical plan before implementation

For each task:

- Write a compact plan with:
  - scope
  - affected modules
  - interfaces/contracts
  - test strategy
- Prefer modular boundaries:
  - domain service
  - repository/data adapter
  - API route handler
  - UI consumer

### 3) Build in testable segments

Order of operations:

1. Implement or update service contracts.
2. Add or update tests (unit/integration/functional).
3. Implement service logic.
4. Integrate persistence.
5. Expose through API routes.
6. Connect experience layer last.

### 4) Post-change validation

After code changes:

- Run required tests for touched modules.
- Validate failure paths and edge cases.
- Confirm no cross-layer leakage (UI -> DB direct coupling).

### 5) Knowledge graph update

After successful changes:

- Update affected `docs/lat.md` graph pages with:
  - new architecture decisions
  - service boundaries
  - API contract changes
  - newly learned constraints
- Add or update cross-links between related graph pages.
- Keep entries concise and sourceable.

## Agent prompt template

Use this prompt when starting a new task with an AI coding agent:

```text
You are implementing a change in future-org-design.

Follow this process strictly:
0) Sync local main from origin/main and work on a task-scoped branch (see .cursor/rules/branch-work-scope.mdc).
1) Read docs/lat.md/lat.md and relevant linked knowledge graph pages before coding.
2) Produce a short technical plan with modular, testable segments.
3) Implement service/database changes first with functional validation tests.
4) Expose functionality via Next.js API routes.
5) Build/modify the experience layer only after service and API contracts are stable.
6) After implementation, update relevant knowledge graph files in docs/lat.md to reflect architecture and workflow changes.

Tech stack assumptions:
- Framework: Next.js (TypeScript, App Router)
- Agent harness: Google ADK

Output requirements:
- Keep domain logic decoupled from API/UI.
- Include tests for each changed capability.
- Document any new assumptions and follow-up tasks.
```

## Interactive validation CLI pattern (for agent reuse)

Use this project pattern when adding validation CLIs for behavior/workflow checks.

### Why

- Reuse the same application/domain call paths that APIs and tests use.
- Provide an onboarding + validation surface for integration-like scenarios.
- Support both interactive TTY sessions and non-interactive CI/IDE execution.

### Required structure (split entry)

- `scripts/cli/entry.ts`
  - Minimal imports only.
  - Loads dotenv (`.env`, then `.env.local`, quiet mode).
  - Parses flags (`--help`, `--smoke`, `--demo`, `--mode=...`).
  - Dynamically imports `batch.ts` for non-interactive flags.
  - Refuses interactive mode when `!process.stdin.isTTY` with clear guidance.
  - Dynamically imports `interactive.ts` only for TTY interactive runs.
- `scripts/cli/batch.ts`
  - No static Inquirer/zx imports.
  - Implements:
    - `runHelp()`
    - `runSmoke()` (fast create/read wiring check)
    - `runGuidedDemoBatch()` (longer scripted path with JSON envelopes)
- `scripts/cli/interactive.ts`
  - Owns prompt dependencies (`@inquirer/prompts`) and optional tooling (`zx`).
  - Exposes `startInteractive()`.
  - Presents top-level menu + validation workflows.

### Runtime conventions

- Script form:
  - `node ./node_modules/tsx/dist/cli.mjs ./scripts/cli/entry.ts`
- Avoid:
  - `NODE_OPTIONS=--import tsx` when launching with `tsx/dist/cli.mjs` (prevents double loader registration).
- Prefer full JSON envelopes for CLI output (`ok`, `data`, `error`) to align with API/test assertions.

### Flag contract

- `--help`: usage + TTY guidance + loader warning.
- `--smoke`: non-TTY safe fast validation.
- `--demo`: non-TTY safe guided scripted flow.
- no flags: TTY-only interactive menus.

