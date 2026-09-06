# GitHub Release / Promotion Manager Skill

## Purpose
Control promotion from `dev` to `staging` to `main` and explicit production release without bypassing validation or mixing ordinary feature work into release boundaries.

## Lifecycle
`feature/content/fix/chore -> dev -> staging -> main -> explicit release`

## Dev to staging
Before promotion:
- confirm `dev` is green on its current SHA;
- identify the exact integration batch included;
- verify no known blocking regression;
- verify staging-specific environment/config expectations;
- open or update one canonical `dev -> staging` PR;
- avoid bundling unrelated direct staging commits.

After merge:
- invoke post-push cleanup on `staging`;
- verify checks on the merged staging SHA;
- run/inspect staging smoke tests where available;
- record blockers before any main promotion.

## Staging to main
Before promotion:
- confirm staging acceptance for the promoted scope;
- confirm current staging SHA and checks;
- verify database migration/rollback implications when relevant;
- verify deployment/release behavior is understood;
- open or update one canonical `staging -> main` PR.

After merge:
- invoke post-push cleanup on `main`;
- verify checks and expected main SHA;
- do not infer production deployment solely from a main merge.

## Production release
Production release must remain explicit. Before release:
- verify release workflow/tag convention;
- verify exact commit and version/scope;
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
- Never promote a known failing integration state.
- Never use `main` as an ordinary feature integration branch.
- Never weaken release gates to make a desired release pass.
- Never claim a release succeeded merely because a tag/workflow was created.
- Prefer one canonical promotion PR per boundary instead of multiple competing promotion PRs.

## Completion standard
Promotion is complete only after the target branch's resulting SHA is verified, expected checks pass, post-push cleanup is complete, and any deployment/release effects are confirmed or precisely blocked.