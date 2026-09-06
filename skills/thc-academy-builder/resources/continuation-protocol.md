# Continuation and recovery protocol

Use this when the user says "continue", "next", "keep working", "do what is needed", "finish this", asks where the project stands, or asks to recover from fragmented parallel work.

## 1. Resolve the active milestone from repository state

Inspect, in order:

1. open PRs most directly related to THC Academy;
2. recent commits on those branches;
3. issue comments/handoffs for Codex/Work;
4. relevant production/performance plans;
5. `main` to confirm what is already merged.

Do not ask the user to repeat information that the repository answers.

## 2. Prefer convergence

If an open PR already owns the workstream, continue it. Do not create a replacement branch because:

- the branch is old;
- CI generated a commit;
- a merge conflict appeared;
- another agent changed the registry;
- the scope expanded.

Repair/rebase/reconcile the existing work unless it is genuinely obsolete or superseded.

## 3. Choose the next unfinished production block

Examples:

- role exists but content missing -> write job-practice units;
- units exist but bank is thin -> add question/scenario batches;
- content/bank exist but no practical -> build practicals/rubrics;
- practicals exist but no integrated performance -> build capstone;
- source exists but credential not wired -> implement eligibility/transcript/portfolio/public verification;
- credential complete -> merge, then start the next role/specialist from `main`;
- repo architecture exists but live Academy experience is weak -> improve learner flow/UI after protecting curriculum/runtime integrity.

## 4. Parallel-agent coordination

When Codex, Work, GitHub Actions, or another agent is active:

- preserve their commits;
- communicate shared IDs/paths through the relevant issue/PR;
- avoid parallel duplicate objects;
- use machine-readable production plans as handoff contracts;
- update issue comments when scope materially changes.

## 5. Generated registry collision

A common pattern is:

1. content questions are committed;
2. Actions regenerates `registry/curriculum.json`;
3. the branch head moves;
4. a locally prepared commit becomes non-fast-forward.

Correct response:

- fetch latest head;
- recreate the intended tree/commit with the bot commit as parent;
- preserve generated registry changes;
- update ref without force.

Never solve this by overwriting the automation.

## 6. Milestone closure

Before moving to the next dependent credential:

- confirm relevant CI/tests;
- update PR scope/counts;
- merge the complete milestone if mergeable and appropriate;
- create the next branch from current `main`.

This branch lifecycle is part of the project's reliability strategy.

## 7. When research is the next step

Research only when it will change the build: current job tasks, employer requirements, competitor programs, standards, scientific evidence, regulation, or technology. Convert the result into repo changes or production briefs in the same workstream whenever possible.
