# GitHub Actions Doctor Skill

## Purpose
Diagnose and repair GitHub Actions failures without creating duplicate branches or retry loops. Use this skill when checks are failed, cancelled, stuck, missing, flaky, outdated, misconfigured, or blocking integration/promotion.

## Operating sequence
1. Identify the exact PR/head SHA or branch SHA being validated.
2. Fetch workflow runs tied to that SHA.
3. Inspect jobs, failed steps, and logs.
4. Classify the failure before changing anything.
5. Repair the root cause on the canonical branch.
6. Push the fix.
7. Invoke the post-push cleanup skill.
8. Re-check the newest run tied to the newest SHA.
9. Rerun only failed jobs when the failure is genuinely transient or after a fix.
10. Record recurring failure classes in tests/docs/workflow safeguards.

## Failure classes
- source/test regression;
- stale-base or merge conflict;
- generated-file drift;
- dependency or lockfile mismatch;
- Node/runtime/runner incompatibility;
- deprecated or invalid Action version;
- permissions/token scope;
- branch/path/event filter mistake;
- cache/artifact corruption;
- missing environment variable or secret;
- deployment/environment configuration;
- concurrency cancellation race;
- workflow recursion/self-mutation loop;
- flaky/transient external service;
- GitHub/API limitation.

## Rules
- Never spam reruns on deterministic failures.
- Never disable a valid failing test merely to obtain green CI.
- Never weaken production/release gates to fix ordinary CI.
- Prefer least-privilege workflow permissions.
- Ensure workflow mutations cannot create infinite commit loops.
- Generated files must be rebuilt from canonical sources.
- A cancelled old run is not a blocker when a newer head SHA has superseded it; validate the newest head.
- If a workflow should have triggered but did not, inspect branch filters, event filters, workflow location on the base branch, permissions, and whether the current PR base is correct.

## Completion standard
Actions work is complete only when the current relevant head SHA has the expected checks, deterministic failures are fixed, transient failures are appropriately retried, and no known workflow-level blocker remains.