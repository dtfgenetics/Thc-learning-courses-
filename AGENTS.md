# Repository agent guidance

## Repository boundary

`dtfgenetics/Thc-learning-courses-` is a **single-purpose THC Academy / certification repository**.

It owns only work directly required to build, test, review, operate, and release the learning/certification system, including:

- curriculum, programs, courses, modules, lessons, activities, simulations, and practicals;
- competencies, objectives, occupational/job-task mappings, prerequisites, and learning pathways;
- question banks, quizzes, exams, assessments, rubrics, pilot/quality evidence, and protected assessment delivery;
- credentials/certificates, eligibility, issuance logic, competency transcripts, public verification, and related employer-facing evidence;
- learner enrollment, progress, completion, assessment-attempt, portfolio/performance evidence, and persistence/API/UI needed for those education/credential workflows;
- scientific/evidence references, review records, schemas, registries, validation, accessibility of Academy learning surfaces, staging, release, and rollback controls directly required for the Academy;
- repository/CI/branch tooling needed to safely maintain this repository.

Do **not** add or maintain unrelated DTF website, WordPress, genetics/shop, game, GrowLens, Grow Doc, general dtfseeds.com site-audit, site-wide Lighthouse, or cross-portfolio visual/debug tooling here. Those belong in their owning repositories, primarily `dtfgenetics/Thc` for the dtfseeds.com production/site/game integration layer.

Before adding a new subsystem, ask one test: **Is this required to teach, assess, track, verify, or issue the Academy credential?** If not, do not put it in this repository.

Run `npm run scope:validate` before broader validation. The scope guard must fail if known site/game/tool ownership paths are reintroduced.

## Academy work

For THC Academy curriculum, occupational roles, course/module/lesson content, question banks, assessments, practicals, simulations, credentials, learner progress, employer-facing credential evidence, or requests to continue/expand the Academy, use:

`skills/thc-academy-builder/SKILL.md`

## Repository operations

For this repository's branches, pull requests, merges, conflicts, CI/CD, GitHub Actions, stale branches, release promotion, cleanup, or Academy deployment flow, use:

`skills/github-orchestrator/SKILL.md`

Ordinary work must reach `dev` through a feature/content/fix/chore branch and pull request. Do not push ordinary commits directly to `dev`, `staging`, or `main`, even when server-side branch protection is absent.

Use specialist repository skills when appropriate:

- GitHub Actions failures: `skills/github-actions-doctor/SKILL.md`
- conflicts/stale branches/PR reconciliation: `skills/github-branch-pr-surgery/SKILL.md`
- `dev -> staging -> main` Academy release promotion: `skills/github-release-promotion-manager/SKILL.md`
- post-write convergence: `skills/github-post-push-cleanup/SKILL.md`

After any repository write, verify the newest SHA, CI, PR targeting, mergeability, generated-file drift, review blockers, target health, and duplicate/superseded work before considering the cycle complete.

## QA policy

Routine Academy QA uses deterministic Node-based tests, schema/content validation, assessment/credential tests, API/persistence tests, accessibility checks for Academy learner surfaces, and staging/release verification directly related to certification. Do not add a browser automation framework to the routine Academy toolchain.

Do not run or own a site-wide dtfseeds.com QA program from this repository. Site-wide route crawling, game/tool QA, visual regression across the whole site, and Lighthouse auditing belong in `dtfgenetics/Thc`.
