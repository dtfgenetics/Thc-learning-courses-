# THC Academy Integration Workflow

This repository uses a controlled landing and promotion path so parallel agents can contribute without creating competing trunks, while keeping curriculum authoring continuously editable until the requested Academy scope is complete.

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
- `content/reviews/` — optional immutable review/audit history; these records never freeze later authoring.
- `content/modules/`, `content/courses/`, `content/programs/` — curriculum composition.
- `content/credentials/` — credential definitions and eligibility requirements, never learner records or signing secrets.
- `registry/` — machine-readable curriculum/release state and publication gates.
- `schemas/` — data contracts.
- `scripts/` and `tests/` — validation, deterministic checks, and regression coverage.
- `openapi/` — public API contracts.
- `docs/` — human-readable policy and architecture; documentation never substitutes for executable checks.
- `skills/` — reusable agent workflows for Academy production and repository operations.

## 4. Continuous curriculum authoring

The Academy remains in continuous authoring until the project owner declares the intended curriculum/catalog scope complete.

- Course, module, lesson, activity, practical, assessment, and item-bank source objects may be expanded or corrected at any time.
- Version bumps must not require a replacement approval record merely to land an authoring change.
- Existing review records are immutable historical evidence. A later edit may make a record stale without making the edit invalid.
- Structural integrity, source/reference resolution, assessment-answer validity, secure answer boundaries, runtime/API behavior, and deterministic regression tests remain mandatory while authoring.
- Content-depth reports identify the next material to expand; readiness reports describe later release work but do not grant permission to author.
- Never declare substantive content/catalog expansion complete because a single batch or course is internally complete. Completion means the requested Academy scope is actually built.

The project owner performs final judgment after the build is substantially complete and may request corrections at any point. Corrections land in canonical source objects and derived registries/reports are regenerated from those sources.

## 5. Pull-request gates

### Ordinary work -> `dev`

Every ordinary change lands through a PR to `dev` and must pass the authoring-safe quality suite for its current head SHA. A failing structural, content-integrity, security, or runtime check is repaired on the same branch whenever practical. Incomplete staging, release, review, pilot, signing, or production infrastructure must not block a valid authoring change.

### `dev` -> `staging`

Promote only an understood, green integration state after the intended release candidate scope is selected. The promotion PR contains integrated work rather than new feature edits. Staging-specific checks run here rather than on ordinary authoring PRs.

### `staging` -> `main`

Promote after staging validation for the included scope. The main-target PR must pass current promotion checks before merge.

The authoring suite covers, among other repository-specific checks:

- curriculum validation and referential integrity;
- deterministic registry generation;
- course-depth and item-bank diagnostics;
- development exam-form generation;
- credential logic and privacy projections;
- learner web/runtime/API regressions;
- deterministic accessibility checks;
- persistence/security contracts that can be verified without production infrastructure.

## 6. Post-push and post-merge convergence

A successful push is not completion. After each push, bot-generated commit, conflict-resolution push, merge, or promotion:

1. identify the newest SHA;
2. verify the relevant PR still targets the correct branch;
3. inspect workflow runs tied to that SHA;
4. inspect failed jobs/steps/logs when applicable;
5. verify generated-file and dependency-lock stability;
6. re-check mergeability and actual code/content blockers;
7. after merge, verify the target branch's own push validation;
8. classify the source branch as landed/archival and continue to the next blocker.

Use `skills/github-orchestrator/SKILL.md` and `skills/github-post-push-cleanup/SKILL.md` for repository execution. Use the specialist Actions, branch/PR surgery, and promotion skills when their failure class applies.

## 7. Production release gate

Merging to `main` does not make content production-ready. Production curriculum is released only through the explicit `academy-*` release tag or production release workflow after the project owner selects a release scope.

The release workflow runs `npm run test:release` and then `npm run release:check`. Release-only checks may enforce publication status, staging readiness, source completeness, credential configuration, security boundaries, operational controls, and other conditions that should not constrain ongoing authoring.

Release checks must never be moved back into ordinary `dev` authoring merely to make release governance easier. Conversely, ordinary authoring checks must not be weakened for malformed JSON, broken references, wrong assessment keys, insecure learner payloads, runtime regressions, or other real defects.

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
4. keep authoring open until the requested catalog/content scope is complete;
5. never invent or require approval evidence merely to permit an edit;
6. keep secure runtime data, learner PII, private keys, credentials, and production assessment secrets out of Git;
7. repair CI failures on the originating branch whenever practical;
8. run post-push cleanup after every repository write;
9. merge only after required authoring checks for the current head pass;
10. treat merged branches as archival, not as trunks;
11. continue to the next actionable content/platform blocker instead of stopping after a single successful merge.
