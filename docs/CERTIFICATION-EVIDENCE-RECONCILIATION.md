# Certification Evidence Reconciliation

## Purpose

This layer converts the certification validation registry from a planning checklist into a **live evidence-derived readiness view**.

The static registry defines the gates. The reconciliation report reads the current repository and determines what evidence actually exists for the exact current versions.

## Derived gates

Three gates are partially machine-verifiable from repository evidence:

### Exact-version human assessment review

For each of the 13 conventional finals, the reconciler checks:

- the current final definition version; and
- every current summative item version.

Only exact-version approved assessment reviews count. A prior-version approval does not satisfy the current object.

### Item analysis

For every current item in each conventional final, the reconciler looks for current-version pilot evidence.

- no current evidence -> `prepared`
- some current evidence -> `in-progress`
- complete current evidence for every current item -> `evidence-complete`

Human approval remains separate.

### Practical assessor calibration

For Technician I Course 7 and Technician II Course 8, the reconciler reads the exact required practical/capstone set from the current course objects and looks for current-version calibration evidence.

A performance assessment counts as complete only when a current calibration record is complete **and has zero unresolved critical-error disagreements**.

## Human-attested gates

The following gates require explicit human evidence records in `content/certification-gate-evidence/`:

- pilot execution
- accessibility / learner-UX human review
- standard setting
- secure operational form readiness
- credential authorization

The same evidence-record format may also be used to formally approve the three derived gates after their prerequisite evidence exists.

## Safety rule

An `approved` attestation for exact-version assessment review, item analysis, or practical calibration cannot override missing repository-verifiable prerequisite evidence. The reconciler rejects that leap and reports the underlying derived state.

This prevents a status file from turning incomplete evidence into a false approval.

## Commands

- `npm run certification:evidence:reconcile`
- `npm run certification:evidence:reconcile:json`
- `npm run certification:evidence:reconcile:check`
- `npm run certification:evidence:require-release-ready`
- `npm run certification:gate-evidence:validate`

The ordinary check fails only for structural/evidence-integrity defects. The strict release-ready command stays nonzero until every applicable gate for all 15 canonical courses is approved.

## Release meaning

A course is release-ready only when **every applicable evidence gate is approved**. `evidence-complete` is intentionally not treated as approval.

This report does not itself authorize credential issuance.
