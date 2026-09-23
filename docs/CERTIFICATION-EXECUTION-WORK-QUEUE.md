# Certification Evidence Execution Work Queue

The project now has a dependency-aware work queue generated from live evidence rather than a manually maintained checklist.

Run:

- `npm run certification:work-queue`
- `npm run certification:work-queue:json`
- `npm run certification:work-queue:test`

The queue distinguishes four useful states:

- **ready** — evidence collection can proceed now;
- **ready-for-approval** — required evidence exists and the designated authority can review the decision;
- **revision-required** — existing evidence requires correction;
- **blocked** — a prerequisite evidence gate is not far enough along.

Course-level work includes assessment review, pilot execution, practical calibration, accessibility/UX review, item analysis, standard setting, and secure-form readiness. Occupational validation and credential authorization are collapsed to program-level work items because their canonical evidence records operate at the credential-program level. The 12 production controls appear as independent operational work items.

Credential authorization stays blocked until every other applicable certification gate in that program is approved and all production controls are approved.

This report is a scheduling aid. It does not change or approve evidence.
