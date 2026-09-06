# GitHub Orchestrator Skill

## Purpose
Operate this repository as a convergence-focused GitHub maintainer. The goal is to safely complete as much repository work as possible without multiplying branches, bypassing gates, or leaving avoidable blockers behind.

Use this skill for repository health, branches, pull requests, merges, conflicts, GitHub Actions, CI/CD, releases, deployment promotion, stale work, branch cleanup, issue triage, failed checks, rulesets, repository governance, code-review recovery, or abandoned work.

## Repository lifecycle

Ordinary work follows:

`content/* | feat/* | fix/* | chore/* -> dev -> staging -> main -> explicit production release`

Rules:
- `dev` is the ordinary integration branch.
- `staging` is for integrated release candidates.
- `main` receives staging-approved promotion only.
- production publication is a separate explicit operation.
- do not open ordinary feature/content/fix/chore PRs directly to `main`.
- do not create `-v2`, `-v3`, `-temp`, `-work`, or replacement branches merely because a branch is stale or conflicted.

## Mission completion standard

For broad instructions such as `fix the repo`, `keep working`, `merge what is needed`, or `clean everything up`, continue through the highest-impact actionable work until one of these conditions is true:

1. the requested scope is converged and healthy;
2. remaining work requires unavailable permissions, credentials, external infrastructure, or a human-only decision;
3. remaining work is destructive/irreversible enough that preserving recoverability takes priority.

Do not stop simply because one PR merged or one error was fixed.

## Core operating loop

Repeat:

1. Inspect current state.
2. Classify risk and ownership.
3. Reuse the canonical existing branch/PR when possible.
4. Repair the originating work instead of spawning a replacement.
5. Run or inspect relevant checks.
6. Resolve mergeability and stale-base problems.
7. Merge/promote only when target integrity is preserved.
8. Close or mark superseded duplicate work.
9. Re-check branch divergence, PRs, workflows, issues, rules, and release state.
10. Move immediately to the next highest-impact blocker.

## Required inspection order

For broad maintenance:

1. repository metadata and default branch;
2. `dev`, `staging`, `main` existence and divergence;
3. open PRs and base branches;
4. mergeability/conflicts;
5. CI/check runs and failed/cancelled jobs;
6. active issues/roadmaps;
7. stale/unmerged branches and duplicate branch families;
8. workflow definitions, generated-file writers, and deployment writers;
9. rulesets/branch protections when accessible;
10. release/deployment state;
11. security-sensitive repository configuration visible to the agent;
12. repository documentation that may contradict actual workflow.

Prioritize production-impacting failures, blocked integration, data/security risks, and workflow corruption before cosmetic cleanup.

## Capability map

Use every available GitHub capability that helps converge the repository. Typical actions include:

### Read/inspect
- repository metadata and permissions;
- branches and refs;
- commit comparisons and changed files;
- PR metadata, diffs, file patches, review threads, reviews, comments, and reactions;
- issues, labels, assignees, milestones, and comments;
- workflow runs, jobs, steps, logs, and artifacts;
- workflow/repository files;
- commits, statuses, tags, releases, rulesets, and branch-protection information when exposed;
- generated artifacts required for diagnosis.

### Write/repair
- create and update files;
- create branches from known safe bases;
- update non-shared branch refs when required;
- create, retarget, edit, draft/undraft, label, review, comment on, or close PRs;
- merge eligible PRs;
- create/update/close issues;
- rerun failed workflow jobs after root cause repair;
- update CI workflow configuration;
- repair generated-file drift;
- maintain agent/skill documentation;
- create promotion PRs `dev -> staging -> main`.

### Admin-limited work
If rulesets, branch protection, repository settings, environment secrets, Actions permissions, deployment environments, webhooks, or other administrative controls cannot be changed through available tooling, inspect and document the precise needed setting. Continue all non-blocked work instead of stopping the project.

Never claim an admin control was changed unless the actual GitHub result confirms it.

## Branch classification

Every branch gets one status:

- **ACTIVE** — current valid work.
- **READY** — green and safe to integrate.
- **REPAIR** — valid work blocked by conflict/check/staleness.
- **SUPERSEDED** — replaced by another implementation.
- **LANDED** — equivalent work already integrated.
- **STALE-REVIEW** — old work requiring comparison before use.
- **DELETE-CANDIDATE** — merged/superseded/empty/abandoned and no unique needed changes.
- **QUARANTINE** — potentially dangerous, unknown, secret-bearing, or production-affecting branch needing careful review.

Never classify only from commit counts or branch names. Compare actual content against `dev` and relevant merged work.

## Pull-request operating procedure

For every open PR:

1. verify correct base (`dev`, `staging`, or `main`);
2. inspect changed filenames and diff scope;
3. verify the head is the canonical branch for the task;
4. inspect mergeability;
5. inspect CI/check state tied to the current head SHA;
6. inspect review threads/comments where they exist;
7. identify whether failures come from code, stale base, workflows, generated files, environment, dependencies, or unrelated infrastructure;
8. repair the same branch whenever practical;
9. split only when independent concerns genuinely need separate review;
10. merge only after required checks and unresolved risks are addressed;
11. after merge, treat the source branch as archival/dead unless a documented reason says otherwise.

Do not trust an old green run after the PR head changes. Re-evaluate checks against the current head SHA.

## Merge strategy

Default:
- ordinary coherent feature/fix/content PR: squash merge;
- integration promotion PR: merge commit may be preferable to preserve the exact promotion boundary;
- rebase merge: only when policy/history makes it useful.

Before merge:
- verify expected head SHA where supported;
- confirm required checks refer to that head;
- confirm no unresolved review/request-changes state blocks the PR;
- confirm the base branch has not moved in a way that invalidates prior validation.

Never force a failing merge merely because the PR is desired.

## Conflict and stale-base repair

When a PR is conflicted/non-mergeable:

1. compare target vs head;
2. identify overlapping files and changes already landed;
3. preserve newer target fixes unless intentionally superseded;
4. reconstruct generated outputs from sources, not conflict-marker guesses;
5. port only unique useful changes when most of a stale branch is obsolete;
6. validate the repaired result;
7. document supersession if a clean replacement is truly necessary.

Do not create a replacement branch merely to escape a conflict.

## GitHub Actions doctor

For every failed/cancelled workflow:

1. locate the run tied to the affected commit/PR;
2. enumerate failed jobs;
3. inspect failed job steps;
4. fetch logs for the actual failing job;
5. classify root cause:
   - source/test regression;
   - generated-file drift;
   - dependency/lockfile mismatch;
   - runner/runtime incompatibility;
   - deprecated/incompatible Action;
   - permissions/token scope;
   - event/branch/path filter mistake;
   - cache/artifact issue;
   - missing environment variable/secret;
   - deployment/environment issue;
   - concurrency/cancellation race;
   - flaky/transient external failure;
6. make a corrective change when deterministic;
7. rerun only the failed job/run after root cause is addressed when supported;
8. inspect the rerun outcome;
9. add regression coverage or documentation for recurring failures.

Do not repeatedly rerun deterministic failures without changing the cause.

## Workflow architecture rules

- CI must cover `dev`, `staging`, and `main` appropriately.
- production release workflows remain stricter than ordinary validation.
- avoid workflows that write the same generated file concurrently.
- generated artifacts should have one clear source of truth.
- use concurrency groups deliberately; cancellation must not corrupt required state.
- pin or deliberately version critical Actions/runtime dependencies consistent with repo policy.
- minimize write permissions; grant only what a workflow needs.
- workflows should not silently mutate unrelated source files.
- if a workflow bot commits generated output, verify that behavior cannot trigger loops/races across branches.

## Generated-file discipline

For registries, manifests, indexes, lockfiles, generated docs, or similar files:

1. identify source inputs;
2. run/reason from the canonical generator;
3. verify deterministic output;
4. commit generated output only where repository contract requires it;
5. never hand-edit output when a generator exists;
6. resolve drift at the source;
7. ensure multiple agents/workflows cannot race to rewrite it.

## Branch governance and rulesets

The desired server-enforced model is:

### `dev`
- ordinary PR target;
- require quality checks before merge;
- block force pushes/deletion;
- prefer PR-based changes.

### `staging`
- accept integrated promotion from `dev`;
- require quality/staging checks;
- block direct ordinary feature work;
- block force pushes/deletion.

### `main`
- accept promotion from `staging` only by policy;
- require production-relevant checks/review where practical;
- block force pushes/deletion;
- keep release publication separate.

If GitHub rulesets/branch protections are absent or cannot be changed with available tools, record this as a governance blocker and continue enforcing the lifecycle operationally through PR routing and CI.

## Issue and roadmap management

Use issues for durable work:
- create central execution issues for multi-phase work;
- link PRs to governing issues;
- turn discoveries into actionable checklist entries;
- close only when definition of done is met;
- mark duplicate/superseded work clearly;
- avoid parallel issues that represent the same active plan.

For this repository, Issue #93 is the current convergence roadmap unless explicitly superseded.

## Review handling

When review feedback exists:

1. inspect submitted reviews and inline threads;
2. distinguish required changes from optional comments;
3. repair valid findings on the current branch;
4. respond with what changed when useful;
5. resolve threads only when the underlying concern is actually addressed;
6. do not dismiss legitimate reviews solely to enable merge.

## Promotion rules

### Ordinary integration
`feature/content/fix/chore -> dev`

Require:
- coherent scope;
- mergeable state;
- current required CI green;
- no unresolved security/privacy/release concern.

### Release candidate
`dev -> staging`

Require:
- green `dev`;
- understood integration batch;
- staging validation/smoke plan;
- no known blocking regression.

### Main promotion
`staging -> main`

Require:
- staging acceptance for promoted scope;
- green checks;
- release/deployment effect understood;
- no ordinary feature work sneaked directly into promotion.

### Production release
`main -> explicit release workflow/tag/artifact`

Require:
- explicit scope/version;
- release gate passes;
- approved commit/artifact known;
- rollback reference known;
- post-release verification of deployed version/state.

## Release and deployment management

Before release:
- inspect release workflow and tag conventions;
- verify expected commit and version;
- verify required tests/release checks;
- verify migration implications and rollback path;
- confirm environment-specific configuration is outside Git where required.

After release/deploy:
- verify actual result rather than inferring success from trigger creation;
- verify release/tag points to expected commit;
- verify deployed curriculum/app/API version where observable;
- inspect failed deployment workflow logs when present;
- preserve a rollback reference/manifest.

## Stale branch cleanup

Procedure:

1. group by topic/naming family;
2. compare each branch to `dev` and related merged PRs;
3. detect squash-landed equivalents;
4. preserve unique useful work;
5. close superseded PRs with explanation;
6. mark deletion candidates only after unique-work check;
7. never delete `dev`, `staging`, or `main`;
8. preserve suspicious/unknown branches in QUARANTINE until understood.

## Security and privacy boundaries

Never:
- commit secrets, tokens, private keys, signing keys, production credentials, learner PII, assessment answer secrets, or production database dumps;
- print secrets into PRs/issues/logs;
- weaken release/certification/security gates merely to make CI green;
- force-push integration branches as routine repair;
- merge unknown stale work because it is ahead;
- disable failing tests without proving they are invalid;
- claim a release/deployment is successful without checking actual state.

When possible, inspect workflow permissions and suspicious file changes for accidental secret exposure. If exposure is suspected, stop propagating the value and flag credential rotation/revocation as an external/admin requirement.

## Dependency and supply-chain maintenance

When dependency/workflow updates are involved:
- inspect lockfile changes;
- avoid unreviewed broad dependency churn during unrelated fixes;
- verify runtime compatibility;
- check deprecated Action/runtime usage;
- retain reproducible installs;
- ensure build/test behavior stays deterministic;
- isolate security-critical dependency upgrades when they require focused validation.

## Failure recovery matrix

When an action fails, classify and respond:

- **404/missing ref**: re-check repo/ref/path and whether work already moved/deleted.
- **409/conflict**: compare heads, repair branch, retry after reconciliation.
- **422 validation**: inspect exact GitHub validation message; correct base/head/state/input.
- **stale SHA**: fetch current blob/head/PR SHA and retry with fresh expected state.
- **branch protection/ruleset**: inspect policy; follow required PR/check/review path.
- **permission denied**: identify exact admin/write capability missing; continue other work.
- **workflow failure**: inspect jobs/steps/logs before retry.
- **cancelled run**: determine whether concurrency or superseding commit caused it; validate newest commit instead.
- **transient external failure**: retry narrowly after confirming it is actually transient.
- **API/tool limitation**: use another safe available GitHub operation where possible; otherwise document the precise manual/admin step.

Never react to a tool failure by abandoning the original work and creating an unexplained duplicate branch.

## Autonomous action policy

With broad user authority, perform routine reversible work without repeatedly asking:
- inspection/triage;
- PR retargeting to the correct integration branch;
- branch creation from a known safe base for genuinely new coherent work;
- CI/workflow/file repair;
- review-thread resolution after actual fixes;
- rerunning repaired failed jobs;
- opening PRs;
- merging clearly safe green PRs that follow lifecycle;
- promotion PR creation;
- issue/checklist updates;
- closing clearly superseded duplicate PRs/issues with explanation.

Use additional caution before:
- deleting branches containing potentially unique work;
- force-updating shared refs;
- weakening security/release gates;
- changing production deployment behavior;
- actions whose rollback is unclear.

## Self-audit before declaring completion

Before reporting a major maintenance task complete, re-check:

- open PR list and target branches;
- mergeability of remaining active PRs;
- newest CI status for affected branches/commits;
- `dev`, `staging`, `main` divergence;
- failed/cancelled recent workflows;
- duplicate/superseded work;
- roadmap issue state;
- ruleset/protection status if relevant;
- release/deployment state if touched;
- whether any claimed write actually succeeded.

## Healthy repository definition

Healthy means:
- ordinary PRs target `dev`;
- `dev` is green and is the active integration trunk;
- `staging` contains release candidates only;
- `main` contains approved promotions;
- release/deploy is explicit and traceable;
- open PRs are mergeable or have documented repair plans;
- failed workflows have known causes/actions;
- stale branch families are classified;
- duplicate work is closed/superseded;
- generated files are deterministic;
- no secret/private runtime data is committed;
- release gates remain fail-closed;
- server-side branch protections/rulesets are present where possible, or their absence is tracked.

## Completion report

Report:
- what changed;
- what merged/promoted;
- what failed and was repaired;
- remaining blockers and exact reasons;
- next highest-priority branch/PR/issue;
- `dev`/`staging`/`main` status;
- admin/tool limitations that still require external action.

Keep reports factual. Never call the repository fully complete while known blockers remain.