# GitHub Post-Push Cleanup Skill

## Purpose
Run immediately after every push, bot-generated commit, branch update, conflict repair, merge, or promotion. A successful push is not completion. The purpose is to converge the repository after the push and clean up all follow-on work that the push created or exposed.

## Trigger
Use this skill after:
- any commit pushed to a feature/content/fix/chore branch;
- a GitHub Actions bot commit;
- a conflict-resolution push;
- a PR retarget or branch update;
- a merge into `dev`, `staging`, or `main`;
- a promotion `dev -> staging` or `staging -> main`;
- a release-related commit/tag when observable.

## Post-push loop

1. Resolve the exact new head SHA.
2. Find the PR associated with the pushed branch, if any.
3. Confirm the PR targets the correct branch:
   - ordinary work -> `dev`
   - integration promotion -> `staging`
   - release-candidate promotion -> `main`
4. Inspect changed files/diff for accidental unrelated changes.
5. Check mergeability against the current target.
6. Inspect workflow runs tied to the new head SHA.
7. If a run fails, inspect jobs, steps, and logs; repair the root cause on the same branch and repeat this loop.
8. If CI generated or modified repository files, verify they are deterministic and expected; ensure bot changes did not introduce a loop or unrelated drift.
9. Inspect review threads/comments and address any newly relevant blockers.
10. Compare branch to target to detect whether the push duplicated already-landed work.
11. Merge when the PR is current, scoped, mergeable, and required checks are green.
12. After merge, inspect the target branch's new workflow run and verify it remains green.
13. Classify the merged source branch as LANDED/DELETE-CANDIDATE; never keep using it as a trunk.
14. Close or mark superseded duplicate PRs/issues made obsolete by the merge.
15. Re-check open PRs for incorrect base branches or new conflicts caused by the integration.
16. If `dev` is green and an intentional release candidate is ready, prepare/inspect `dev -> staging`; do not promote unrelated incomplete work automatically.
17. If `staging` is green and accepted for the intended scope, prepare/inspect `staging -> main`.
18. Never trigger production publication merely because `main` changed; production release remains explicit.

## Cleanup after merge

After a successful merge:
- verify the merge commit/result actually exists;
- inspect CI on the target branch;
- confirm generated registry/manifests match source;
- identify duplicate branches/PRs now made obsolete;
- update the governing issue/checklist where useful;
- verify no ordinary PR is still targeting `main` or `staging` incorrectly;
- verify no stale workflow run is being mistaken for the newest state;
- preserve unique work before marking branches for deletion.

## Cleanup after failed push/check

Do not create a `-v2`, `-v3`, `-temp`, or replacement branch merely because CI failed.

Instead:
1. inspect the exact failing run and current SHA;
2. repair the existing branch;
3. push the corrective commit;
4. rerun this post-push loop;
5. only supersede the branch when the original is fundamentally unsuitable and the relationship is documented.

## Bot/generated commits

When CI pushes generated output back to a branch:
- treat the bot commit as a new push and restart this loop from its SHA;
- verify the generated output is expected;
- verify the workflow does not continually retrigger itself;
- verify multiple PRs cannot race to overwrite the same generated state;
- verify the PR's checks correspond to the final bot-updated head, not the earlier human commit.

## Stop conditions

A push cycle is complete only when:
- the newest relevant SHA has been evaluated;
- its required checks are green or precisely externally blocked;
- the PR is correctly targeted and mergeability is understood;
- generated-file drift is resolved;
- review blockers are resolved or documented;
- merge/promotion was completed when safely eligible;
- post-merge target checks were inspected;
- duplicate/superseded work was classified;
- the next repository blocker is known.

Never report only `push succeeded` when follow-on GitHub work remains.