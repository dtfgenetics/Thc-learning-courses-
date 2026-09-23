# Certification Validation Execution Layer

## Purpose

This is the execution layer for the remaining certification work after course construction and repository item-quality passes.

It does **not** replace the 420 encyclopedia, course content, assessment definitions, or existing review records. It coordinates the real-world evidence needed before a certification system can be treated as professionally validated and operationally ready.

## Current boundary

The canonical certification program is:

- 7 Technician I courses
- 8 Technician II courses
- 15 canonical certification courses total
- 13 conventional course finals
- Technician I Course 7 and Technician II Course 8 use integrated practical/capstone pathways rather than ordinary conventional finals

The repository may contain other educational or legacy course objects. They are not part of this validation registry unless they are explicitly added to the canonical Technician scope.

## Evidence gates

Each canonical course is tracked across eight distinct evidence gates:

1. exact-version human assessment review
2. pilot execution
3. item analysis
4. practical assessor calibration
5. accessibility / learner-UX human review
6. standard setting
7. secure operational form readiness
8. credential authorization

These states are intentionally separate. Completing one gate does not imply another gate has passed.

## Status meanings

- **prepared** — templates, protocols, queues, or structures exist; real execution is still required
- **in-progress** — human or field evidence collection has begun
- **evidence-complete** — required evidence is collected and checked, but formal approval may still be pending
- **approved** — designated human authority approved the exact current evidence/version
- **revision-required** — review found changes that must be made
- **not-applicable** — the gate does not apply to that course/path

## Required operating rule

Never convert a repository quality pass, owner content approval, CI success, generated report, or machine audit into a claim of human validation.

Human review, pilot statistics, assessor calibration, psychometrics, standard setting, secure operational assessment readiness, and credential authorization remain separately evidenced.

## Registry

The authoritative machine-readable registry is:

`registry/certification-validation-execution.json`

Validate/report it with:

- `npm run certification:validation-execution`
- `npm run certification:validation-execution:json`
- `npm run certification:validation-execution:check`

The check is structural. It confirms the canonical 15-course scope, the 13-final boundary, the two integrated-performance exceptions, the gate vocabulary, and required evidence fields. It does not fabricate completion evidence.

## Next evidence work

The next evidence-producing work should focus on:

- conducting exact-version human review of current conventional final definitions and current item versions;
- executing pilots under the existing course pilot protocols;
- importing pilot results into analyzable evidence records;
- calculating item difficulty, response distributions, missingness, discrimination/item-rest signals, and revision flags;
- running practical/capstone paired-scoring calibration and documenting agreement/disagreement;
- completing rendered accessibility and learner-UX review records;
- conducting and recording defensible standard-setting work;
- producing secure operational assessment forms and form-equivalence evidence;
- documenting credential authority, issuance, revocation, appeals, renewal, privacy/security, and production controls.

The registry should be updated only when real evidence changes a gate state.
