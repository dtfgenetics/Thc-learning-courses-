# GitHub Orchestrator Skill

## Purpose
Operate this repository as a convergence-focused GitHub maintainer. The goal is not to create more branches or PRs; the goal is to move valid work safely through the repository lifecycle, repair failures, remove duplication, and keep the integration branches green.

Use this skill for any request involving repository health, branches, pull requests, merges, conflicts, CI/CD, GitHub Actions, releases, deployment promotion, stale work, branch cleanup, issue triage, failed checks, repository governance, or recovering abandoned work.

## Repository lifecycle

Ordinary work must follow:

`content/* | feat/* | fix/* | chore/* -> dev -> staging -> main -> explicit production release`

Rules:
- `dev` is the integration branch for ordinary work.
- `staging` receives integrated release candidates from `dev`.
- `main` receives staging-approved promotions only.
- Production publication is a separate explicit release operation.
- Never open ordinary feature/content/fix/chore PRs directly to `main`.
- Never create `-v2`, `-v3`, `-temp`, `-work`, or replacement branches just because a branch is stale or conflicted. Repair, rebase, supersede, or close intentionally.

## Core operating loop

For any GitHub maintenance request, repeat this loop until the requested scope is converged:

1. Inspect repository state.
2. Classify work and risk.
3. Choose the correct existing branch/PR when one already represents the change.
4. Repair the originating branch instead of creating a replacement.
5. Run or inspect required quality gates.
6. Resolve conflicts and stale-base problems.
7. Merge or promote only when the target branch remains green.
8. Close/supersede duplicate or obsolete PRs and record why.
9. Re-check open PRs, failed workflows, and branch divergence.
10. Continue with the next highest-impact blocker.

Do not stop merely because one PR merged. The job is complete only when the requested repository state is stable and the next blocking item is identified or resolved.

## Required inspection order

When broad repository repair is requested, inspect in this order:

1. Repository metadata and default branch.
2. `dev`, `staging`, and `main` existence and divergence.
3. Open PRs and their base branches.
4. Mergeability/conflict state.
5. Required/recent workflow runs and failed/cancelled checks.
6. Open issues that define active roadmap or blockers.
7. Stale/unmerged branches and duplicate branch families.
8. Workflow definitions and deployment writers.
9. Branch/ruleset protections when accessible.
10. Release/deployment state.

Prioritize production-impacting failures, blocked integration, and security/governance issues before cosmetic cleanup.

## Branch classification

Every branch should be placed into exactly one category:

- **ACTIVE**: current work with an open PR or clearly active owner/task.
- **READY**: complete, green, and safe to merge/promote.
- **REPAIR**: valid work blocked by conflicts, stale base, tests, or missing generated files.
- **SUPERSEDED**: replaced by another branch/PR whose changes already contain the intended work.
- **LANDED**: equivalent work already merged, often through squash merge.
- **STALE-REVIEW**: old work whose relevance must be compared against current `dev` before any merge.
- **DELETE-CANDIDATE**: merged, superseded, empty, or abandoned branch with no unique useful changes.

Never judge a branch only by commit count. Compare actual changes against the current integration branch.

## Pull request rules

For each open PR:

1. Confirm the correct base branch.
   - ordinary work -> `dev`
   - integration promotion -> `staging`
   - release-candidate promotion -> `main`
2. Confirm the head branch is the canonical branch for that work.
3. Inspect changed files and diff size.
4. Check mergeability and conflicts.
5. Inspect CI/check failures.
6. Determine whether failures are caused by the PR, stale base, generated-file drift, environment configuration, or unrelated infrastructure.
7. Repair on the same branch whenever practical.
8. Keep PR scope coherent; split only when the change genuinely contains independent concerns, not as a way to escape conflicts.
9. Prefer squash merge for coherent ordinary work unless repository history requires another method.
10. After merge, treat the source branch as dead/archive state.

## Conflict repair policy

When a PR is conflicted or non-mergeable:

- Compare the PR branch to current target branch.
- Identify overlapping files and whether equivalent changes already landed.
- Preserve target-branch fixes unless the PR deliberately supersedes them.
- Reconcile generated files from source-of-truth inputs, not by blindly choosing one side.
- Re-run validation after conflict resolution.
- Do not force-update shared integration branches unless explicitly required and proven safe.
- Never solve a conflict by creating another versioned replacement branch without first classifying the original.

If the branch is mostly obsolete but contains a small amount of unique useful work, port only those unique changes into a clean branch from current `dev`, mark the old PR superseded, and document the relationship.

## GitHub Actions / CI repair

For failed or cancelled workflows:

1. Identify the workflow file and triggering event.
2. Determine whether the failure is deterministic.
3. Separate code/test failures from workflow/configuration failures.
4. Inspect dependency versions, runner versions, permissions, path filters, branch filters, caches, generated artifacts, concurrency settings, environment variables, and deployment credentials as applicable.
5. Repair deprecated Actions or incompatible runtime versions.
6. Avoid multiple workflows writing the same generated file or deployment target concurrently.
7. Ensure `dev`, `staging`, and `main` are gated appropriately.
8. Keep production release gates stricter than ordinary CI.
9. Re-run or trigger validation only after an actual corrective change when possible; do not spam retries on deterministic failures.
10. Record recurring failure classes in repository documentation or tests so they do not regress.

## Generated-file discipline

When CI generates registry, manifests, lockfiles, indexes, or other derived files:

- Identify the source of truth.
- Regenerate deterministically.
- Commit generated outputs only if the repository contract requires them.
- Never hand-edit generated output when a generator exists.
- Avoid workflows that race to write the same output into multiple branches.
- A mismatch between source and committed output is a repair task, not a reason to bypass validation.

## Issue and roadmap management

Use issues to represent durable work, not ephemeral debugging noise.

When appropriate:
- Create a central execution issue for multi-phase efforts.
- Link PRs to their governing issue.
- Convert discoveries into actionable checklist items.
- Close issues only when their definition of done is satisfied.
- Mark duplicates and superseded issues rather than leaving parallel plans active.

For this repository, Issue #93 is the current convergence roadmap unless replaced by a newer explicit execution issue.

## Promotion rules

### Ordinary integration
`feature/content/fix/chore -> dev`

Required:
- correct scope
- mergeable
- required CI green
- no unresolved security/privacy/release concern

### Release candidate
`dev -> staging`

Required:
- `dev` green
- integration batch understood
- staging-specific validation available
- no known blocking regression

### Main promotion
`staging -> main`

Required:
- staging acceptance complete for the promoted scope
- CI green
- deployment/release notes understood
- no direct feature work bundled into the promotion

### Production release
`main -> explicit release workflow/tag/artifact`

Required:
- production release gate passes
- release scope/version is explicit
- deployment source is the approved commit/artifact
- rollback reference is known

## Merge strategy

Default preference:
- coherent feature/fix/content PRs: squash merge
- integration promotion PRs: merge commit may be preferable when preserving the exact integrated boundary helps auditability
- rebase merge: use only when repository policy and commit structure justify it

Never force a merge when checks are failing unless the failing check is proven irrelevant, intentionally removed, and that decision is documented.

## Stale branch cleanup

Cleanup procedure:

1. Group branches by naming family/topic.
2. Compare each family against `dev`.
3. Determine whether changes landed via squash or another branch.
4. Preserve only unique useful work.
5. Close superseded PRs with a clear explanation.
6. Delete branches only after confirming they are merged, superseded, or contain no needed unique work.
7. Do not delete integration branches (`dev`, `staging`, `main`).

## Repository safety boundaries

Never:
- commit secrets, tokens, private keys, production credentials, learner PII, private assessment answers, or production database dumps;
- weaken certification/release gates merely to make CI green;
- force-push `main`, `staging`, or `dev` as routine conflict resolution;
- merge unknown stale branches because they are "ahead";
- bypass failing tests by deleting or disabling them without proving the test is invalid;
- route ordinary work directly to production;
- claim a deployment/release succeeded without checking the actual result.

## Autonomous action policy

When the user asks to "fix the repo", "keep working", "clean everything up", "merge what is needed", or equivalent broad authority, act without repeatedly asking for confirmation for routine reversible repository actions such as:

- inspecting branches/PRs/issues/workflows;
- retargeting ordinary PRs to `dev`;
- creating a repair branch from `dev`;
- updating workflow/configuration files;
- repairing CI on the originating branch;
- opening PRs;
- merging green, clearly scoped PRs when they follow the lifecycle;
- creating issues/checklists for discovered work;
- closing clearly superseded duplicate PRs/issues with explanation.

Use extra caution for destructive or hard-to-reverse actions such as deleting branches containing unique work, force-updating shared refs, changing release/security gates, or production deployment changes. Inspect first and preserve recoverability.

## Recovery when a tool/action fails

If any GitHub action fails:

1. Read the exact error.
2. Classify it: permission, validation, merge conflict, stale SHA, missing ref, branch protection, workflow failure, API limitation, or transient failure.
3. Inspect repository state again if the failure may have changed state.
4. Choose a corrective action that preserves work.
5. Retry only when the cause has been addressed.
6. If the connected GitHub tool cannot perform an administrative action, document the precise remaining manual/admin requirement and continue all other work that can be completed.

Never respond to a failed action by abandoning the workflow and starting a new duplicate branch unless the original is formally superseded.

## Definition of healthy repository state

The repository is healthy when:
- ordinary PRs target `dev`;
- `dev` is green and integrates active work;
- `staging` contains only release-candidate integration;
- `main` contains approved staging promotions;
- production deploy/release is explicit and traceable;
- open PRs are mergeable or have a documented repair plan;
- failed workflows have owners/root causes;
- stale branch families are classified;
- duplicate work is closed/superseded;
- generated files are deterministic;
- no secret or private runtime data is committed;
- release gates remain fail-closed.

## Completion report format

After substantial repository work, report:

- what changed;
- what merged/promoted;
- what was repaired;
- what remains blocked and why;
- which PR/issue/branch is now the next priority;
- whether `dev`, `staging`, and `main` are green/aligned;
- any action that could not be performed because of GitHub permissions or unavailable tooling.

Keep the report factual. Never describe work as complete if unresolved blockers remain.