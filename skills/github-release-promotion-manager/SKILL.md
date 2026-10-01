# GitHub Release / Promotion Manager Skill

## Purpose
Control integration to canonical `main` and explicit production release without bypassing validation or reviving quarantined branch history.

## Current lifecycle
`short-lived feature/content/fix/chore branch -> main -> explicit production release`

Legacy `dev` and `staging` are quarantined. They are not ordinary integration or promotion targets unless a dedicated reconciliation change explicitly restores that model after proving it safe.

## Work branch to main
Before integration:
- confirm the work branch was created from a current validated `main` baseline;
- identify the exact scope included;
- verify no known blocking regression;
- compare changed files for unrelated or cross-session contamination;
- run the narrow relevant tests and inspect current-head CI;
- target one focused PR at `main`.

After merge:
- invoke post-push cleanup on `main`;
- verify checks on the merged `main` SHA;
- verify generated registries/manifests remain deterministic;
- do not infer production deployment solely from a `main` merge.

## Legacy branch reconciliation
For useful work found on `dev`, `staging`, or another stale branch:
- compare actual file content and commit intent against current `main`;
- classify changes as already landed, obsolete/conflicting, or uniquely useful;
- create a fresh branch from current `main`;
- port only the uniquely useful pieces;
- run current tests and open a focused PR to `main`;
- never merge stale history wholesale merely to restore ancestry.

## Production release
Production release must remain explicit. Before release:
- verify release workflow/tag convention;
- verify exact `main` commit and version/scope;
- run/inspect required production release checks;
- preserve rollback reference;
- ensure secrets/environment configuration are outside Git.

After release:
- verify actual workflow/deployment result;
- verify release/tag points to the intended commit;
- verify deployed version/state where observable;
- inspect failed deployment job logs if release is unhealthy;
- document exact unresolved infrastructure/admin blocker if verification cannot be completed.

## Rules
- Never integrate a known failing state.
- Never use legacy `dev` or `staging` as an ordinary work target while they are quarantined.
- Never weaken release gates to make a desired release pass.
- Never claim a release succeeded merely because a tag/workflow was created.
- Prefer one focused PR per work session and an exact validated `main` SHA for release.

## Completion standard
Integration or release work is complete only after the resulting target SHA is verified, expected checks pass, post-push cleanup is complete, and any deployment/release effects are confirmed or precisely blocked.
