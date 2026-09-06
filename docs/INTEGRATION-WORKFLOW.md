# THC Academy Integration Workflow

This repository uses a controlled landing and promotion path so parallel agents can contribute without bypassing quality gates or creating competing trunks.

## 1. Work channels

Use one short-lived branch per coherent change, created from current `dev` unless a repair/supersession procedure documents otherwise:

- `content/<topic>` for curriculum, references, claims, lessons, objectives, modules, courses, and assessment items.
- `feat/<topic>` for new schemas, scripts, runtime contracts, credentialing features, and substantial tooling.
- `fix/<topic>` for defects, broken references, CI failures, merge repairs, and regressions.
- `chore/<topic>` for documentation, maintenance, dependency-free cleanup, and repository governance.

Do not create `-v2`, `-v3`, `-temp`, `-work`, or replacement branches merely because a branch is stale or conflicted. Repair the canonical branch when practical. If old work is too stale to repair safely, compare it against current `dev`, port only unique useful changes onto a clean branch, and mark the original PR/branch as superseded.

## 2. Integration branches

The permanent branch lifecycle is:

`content/* | feat/* | fix/* | chore/* -> dev -> staging -> main -> explicit production release`

- `dev` is the ordinary integration trunk. Normal feature/content/fix/chore PRs target `dev`.
- `staging` contains integrated release candidates promoted from `dev`.
- `main` receives validated promotions from `staging` only in the ordinary lifecycle.
- Merging to `main` does not publish certification content. Production publication remains a separate explicit release operation.

Do not use `dev -> main` as an ordinary shortcut. Urgent exceptions must be explicit, documented, and reconciled back through the lifecycle.

## 3. Correct landing locations

Source-of-truth material belongs in these paths:

- `content/competencies/` — measurable competencies.
- `content/learning-objectives/` — objectives mapped to competencies.
- `content/lessons/` — structured learner-facing instruction.
- `content/claims/` — scientific claims with evidence mapping.
- `content/references/` — scientific/source records.
- `content/assessments/` — assessment blueprints and assessment definitions.
- `content/questions/` — item-bank source objects. Production items must not expose secure answer data to a public client.
- `content/reviews/` — immutable human review records matching `schemas/review-record.schema.json`.
- `content/modules/`, `content/courses/`, `content/programs/` — curriculum composition.
- `content/credentials/` — credential definitions and eligibility requirements, never learner records or signing secrets.
- `registry/` — machine-readable curriculum/release state and publication gates.
- `schemas/` — data contracts.
- `scripts/` and `tests/` — validation, deterministic checks, and regression coverage.
- `openapi/` — public API contracts.
- `docs/` — human-readable policy and architecture; documentation never substitutes for executable gates.
- `skills/` — reusable agent workflows for Academy production and repository operations.

## 4. Curriculum publication path

Credential-bearing curriculum moves through this content lifecycle independently of Git branch promotion:

`draft -> scientific review -> editorial review -> approved -> published`

Assessment items use the assessment lifecycle documented in `ITEM-BANK-REVIEW.md` and must reach `active` before they count toward production item-pool depth.

Human review records are evidence of approval. Setting a registry boolean or changing an object status without the corresponding review record is not approval.

## 5. Pull-request gates

### Ordinary work -> `dev`

Every ordinary change lands through a PR to `dev` and must pass the complete required quality gate for its current head SHA. A failing gate is repaired on the same branch whenever practical. Do not open replacement PRs merely to escape a failed check or conflict.

### `dev` -> `staging`

Promote only an understood, green integration state. The promotion PR must contain integrated work rather than new feature edits. Staging validation must pass before the release-candidate cycle is considered complete.

### `staging` -> `main`

Promote only after staging validation/acceptance for the included scope. The main-target PR must pass current required checks before merge.

The validation suite covers, among other repository-specific checks:

- curriculum validation and referential integrity;
- deterministic registry generation and drift detection;
- development exam-form generation;
- credential eligibility, issuance, and public verification tests;
- review and item-bank readiness;
- learner web/runtime/API regression coverage;
- staging/operational readiness checks.

## 6. Post-push and post-merge convergence

A successful push is not completion. After each push, bot-generated commit, conflict-resolution push, merge, or promotion:

1. identify the newest SHA;
2. verify the relevant PR still targets the correct branch;
3. inspect workflow runs tied to that SHA;
4. inspect failed jobs/steps/logs when applicable;
5. verify generated-file and dependency-lock stability;
6. re-check mergeability/review blockers;
7. after merge, verify the target branch's own push validation;
8. classify the source branch as landed/archival and continue to the next blocker.

Use `skills/github-orchestrator/SKILL.md` and `skills/github-post-push-cleanup/SKILL.md` for repository execution. Use the specialist Actions, branch/PR surgery, and promotion skills when their failure class applies.

## 7. Production release gate

Merging to `main` does not make content production-ready. Production curriculum is released only through the explicit `academy-*` release tag or production release workflow.

The release workflow runs the complete test suite and then `npm run release:check`. The release check fails closed unless:

- the registry is no longer draft and `publicationReady` is true;
- every configured publication gate is true;
- the mapped course is published;
- the final assessment is active, approved, or published;
- every mapped lesson is published;
- each mapped lesson/version has approved scientific and editorial review records;
- any additional pathway-specific release requirements pass.

Do not weaken these gates simply to obtain a green release.

## 8. Merge and cleanup discipline

- Prefer squash merge for coherent ordinary feature/content/fix/chore PRs.
- Promotion PRs may use merge commits to preserve exact integration boundaries.
- After an ordinary PR is merged, its source branch is archival/dead; do not resume it as a trunk.
- Before reconciling an old branch, compare actual content against current `dev` and verify whether equivalent work already landed through squash or another PR.
- Never merge stale work merely because it appears ahead by commit count.
- Close duplicate/superseded PRs with a recorded reason.
- Delete branches only after confirming they contain no needed unique work and tooling/permissions make deletion safe.

## 9. Agent rules

Parallel agents must:

1. start ordinary new work from current `dev`;
2. use the correct work channel and source-of-truth directory;
3. target ordinary PRs to `dev`;
4. use promotion PRs for `dev -> staging -> main`;
5. avoid changing publication/review/security gates without evidence and an explicit reason;
6. keep secure runtime data, learner PII, private keys, credentials, and production assessment secrets out of Git;
7. repair CI failures on the originating branch whenever practical;
8. run post-push cleanup after every repository write;
9. merge only after required checks for the current head pass;
10. treat merged branches as archival, not as trunks;
11. continue to the next actionable repository blocker instead of stopping after a single successful merge.
