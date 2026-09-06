# GitHub Branch / PR Surgery Skill

## Purpose
Repair difficult branch and pull-request states while preserving unique work and preventing branch proliferation.

Use for merge conflicts, stale branches, wrong PR bases, duplicate PRs, superseded work, squash-landed branches, large mixed PRs, missing commits, branch divergence, or non-mergeable changes.

## Operating sequence
1. Identify canonical target (`dev`, `staging`, or `main`).
2. Inspect PR metadata, head SHA, base SHA, changed filenames, and diff.
3. Compare the branch against the current target and relevant merged PRs.
4. Classify the branch: ACTIVE, READY, REPAIR, SUPERSEDED, LANDED, STALE-REVIEW, DELETE-CANDIDATE, or QUARANTINE.
5. Retarget ordinary PRs to `dev` when appropriate.
6. Preserve unique useful changes; discard only work proven redundant/obsolete.
7. Resolve conflicts from source-of-truth intent, not by blindly choosing ours/theirs.
8. Regenerate derived files instead of manually merging them.
9. Repair on the same canonical branch whenever practical.
10. Push, then invoke post-push cleanup.
11. Merge only after current-head checks and review state are acceptable.
12. Close superseded duplicates with an explanation linking the canonical replacement/landed work.

## Duplicate-branch rule
Do not create `-v2`, `-v3`, `-temp`, `-work`, `-clean`, or similar escape branches merely because work is stale or conflicted.

A clean replacement branch is allowed only when:
- the original contains mostly obsolete history;
- unique changes have been identified explicitly;
- porting those unique changes is safer than repairing the old branch;
- the original PR is marked superseded with the relationship documented.

## Stale/squash detection
Commit-count divergence is not proof of unique work. Compare actual file changes against the target and merged PRs. A branch whose work landed by squash may appear unmerged by ancestry while containing no unique changes.

## Large PR handling
Split a PR only if it contains genuinely independent deliverables that can be validated separately. Do not split solely to evade conflicts or failing checks.

## Safety
Never force-push `dev`, `staging`, or `main` as routine repair. Never delete potentially unique work before comparison. Quarantine suspicious branches until understood.

## Completion standard
Branch/PR surgery is complete when the canonical work is on the correct lifecycle path, unique work is preserved, duplicates are explicitly classified, and the active PR is mergeable or has one precise remaining blocker.