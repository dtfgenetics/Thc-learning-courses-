# Certification Toolkit

The certification toolkit is the orchestration layer for the repository's curriculum, assessment, credential, review, learner, platform, and release checks.

## Why it exists

The repository has many strong individual validators. Running them manually makes it easy to skip a gate, run checks in the wrong order, or give agents different definitions of "ready." The toolkit gives humans, CI, and automated workers one stable entrypoint.

## Usage

```bash
node scripts/certification-toolkit.mjs <mode>
```

Available modes:

- `author` — curriculum, schemas, knowledge base, occupational alignment, registry.
- `exam` — author checks plus performance assessment, item-bank, exam-form, and pilot readiness.
- `certify` — exam checks plus credential and review evidence-chain checks.
- `learner` — content plus academy UX, progress, accessibility, enrollment, and learner APIs.
- `platform` — runtime, API/security, database, persistence, RLS, and operational controls.
- `release` — all certification and platform gates plus staging/production readiness.
- `full` — every registered group; currently equivalent to the complete release validation set.

Flags:

```bash
--continue  # run all selected checks and report every failure
--json      # emit a machine-readable final summary
--list      # print registered modes and groups
```

Examples:

```bash
node scripts/certification-toolkit.mjs author
node scripts/certification-toolkit.mjs certify --continue
node scripts/certification-toolkit.mjs release --json
node scripts/certification-toolkit.mjs --list
```

## Recommended worker policy

1. Content workers run `author` before opening a PR.
2. Assessment workers run `exam` before opening a PR.
3. Credential/reviewer workers run `certify` before requesting final review.
4. UI/API workers run `learner` or `platform` based on scope.
5. The integration branch runs `release` before merge to production.
6. A failed gate is not bypassed by starting a new branch. Fix the failing branch, update it from the integration base, rerun the relevant mode, and only then merge.

## Output contract

Each check records its group, npm script name, exit status, duration, signal, and spawn error. The final summary includes total checks, pass/fail totals, failed script names, total duration, and whether every selected check executed.

The registry entry at `registry/certification-toolkit.json` is intended for CI, worker orchestration, dashboards, and future automation that needs to discover the supported certification workflows without parsing JavaScript.
