# THC Academy Integration Workflow

This repository uses a single landing path for curriculum, assessment, credentialing, and release work so parallel agents can contribute without bypassing quality gates.

## 1. Work channels

Use one short-lived branch per coherent change:

- `content/<topic>` for curriculum, references, claims, lessons, objectives, modules, courses, and assessment items.
- `feat/<topic>` for new schemas, scripts, runtime contracts, credentialing features, and substantial tooling.
- `fix/<topic>` for defects, broken references, CI failures, merge repairs, and regressions.
- `chore/<topic>` for documentation, maintenance, dependency-free cleanup, and repository governance.

Do not create `-v2`, `-v3`, `-temp`, or replacement branches merely because a branch is stale. Update or supersede the existing change intentionally and record that decision in the PR.

## 2. Correct landing locations

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

## 3. Promotion path

Credential-bearing curriculum moves through this sequence:

`draft -> scientific review -> editorial review -> approved -> published`

Assessment items use the assessment lifecycle documented in `ITEM-BANK-REVIEW.md` and must reach `active` before they count toward production item-pool depth.

Human review records are evidence of approval. Setting a registry boolean or changing an object status without the corresponding review record is not approval.

## 4. Pull-request gate

Every change lands through a PR to `main` and must pass the complete `npm test` suite. This covers:

- curriculum validation and referential integrity;
- development exam-form generation;
- deterministic credential eligibility tests;
- test credential issuance and verification;
- public verification privacy regression tests;
- review-readiness reporting;
- item-bank-readiness reporting.

A failing gate is repaired on the same branch. Do not open replacement PRs to escape a failed check.

## 5. Production release gate

Merging to `main` does not make content production-ready. Production curriculum is released only through an explicit `academy-*` release tag or the production release workflow.

The release workflow runs the complete test suite and then `npm run release:check`. The release check fails closed unless:

- the registry is no longer draft and `publicationReady` is true;
- every configured publication gate is true;
- the mapped course is published;
- the final assessment is active, approved, or published;
- every mapped lesson is published;
- each mapped lesson/version has approved scientific and editorial review records.

Additional domain-specific gates may be added without weakening these baseline requirements.

## 6. Merge and cleanup discipline

Prefer squash merge for coherent PRs so `main` remains readable. After a PR is merged, its branch is considered dead; do not resume work on it unless intentionally reopening the exact change. New work starts from current `main`.

Before reusing or reconciling an old branch, compare it with current `main` and verify whether its changes already landed through a squash merge. Never merge a stale branch simply because it appears ahead by commit count.

## 7. Agent rules

Parallel agents must:

1. start from current `main`;
2. use the correct work channel and landing directory;
3. avoid changing publication/review gates without evidence;
4. keep secure runtime data, learner data, private keys, and production assessment secrets out of Git;
5. repair CI failures on the originating branch;
6. merge only after the required checks pass;
7. treat merged branches as archival, not as trunks.
