# Course 1 Assessor Workflow Runtime

## Purpose

The Course 1 practical assessor runtime is the authorized operational layer for `PRACTICAL-LH-TECH1-001-WORKFLOW`. It records course-practical performance evidence. It does **not** issue the THC Cultivation Technician I credential and does not expose secure credential-exam material.

The public academic practical remains viewable without evaluator authorization. Evaluator authorization controls only the private roster, practical evidence review, official scoring, assignment ownership and evaluator notes.

## Evaluator queue

An evaluator with `evaluator:read` receives a Course 1 learner queue built from current Course 1 enrollments. The queue shows learner subject, enrollment state, practical state, score when available, critical-error count, follow-up state, reassessment target, evaluator assignment and timestamps.

Queue search, practical-status filtering and assignment filtering are performed by the server/database rather than only filtering the currently rendered browser page. The queue is paginated so larger cohorts can be handled without loading the entire roster into the learner-facing shell. Pagination is an operational retrieval control, not a curriculum/content ceiling.

Assignment filters include all assignments, assigned to the current evaluator, any assigned learner, and unassigned learners. Direct subject lookup remains available as an evaluator fallback.

## Evaluator assignment and ownership

Assignment is stored in `practical_evaluation_assignments`, separate from `performance_assessment_results` and practical `evidence_json`. This allows ownership to exist before any practical score/evidence record exists.

An evaluator with `evaluator:write` may claim an unassigned learner practical or release a practical they own. A claim cannot overwrite another evaluator's assignment. Saving an unassigned practical automatically attempts to claim it for the authenticated evaluator; if another evaluator wins ownership first, the save fails with a conflict instead of silently overwriting the assignment.

A practical assigned to another evaluator remains reviewable to an evaluator-authorized session but is read-only for scoring until ownership is changed. `admin:write` can explicitly reassign a practical or clear the assignment.

Evaluator identity always comes from the authenticated session. The browser cannot submit or override evaluator identity.

## Evidence-output review and storage boundary

The assessor form renders evidence outputs from the canonical practical definition rather than a hard-coded output count. The current practical defines seven outputs, but the runtime follows the practical object's evidence-output array so future additions, removals or reorganizations do not require an application-level count change.

For each canonical output, the evaluator can record `not-reviewed`, `received`, `verified`, or `needs-revision`, plus a controlled evidence reference and evaluator evidence note.

The Academy stores **references to evidence**, not copies of private learner files inside curriculum Git or learner-facing JSON. The controlled reference can point to an approved operational storage system, a controlled Drive/document object, an LMS artifact identifier, a packet/page, or another deployment-approved evidence locator. See `PRACTICAL-EVIDENCE-STORAGE.md`.

## Scoring and finalization

All canonical scoring domains are rendered from the published practical definition. The server independently validates each score against its domain maximum and calculates the official percentage. The browser cannot provide or override the authoritative score percentage or pass/fail result.

Finalization requires every canonical scoring domain. The current practical passes at the configured minimum percentage only when its configured critical-error rule is also satisfied.

`evaluator:read` can view the workspace; `evaluator:write` is required to claim/release owned work and save/finalize an official practical result.

## Remediation and reassessment state

The evaluator can track `none`, `remediation-assigned`, `remediation-in-progress`, `ready-for-reassessment`, `reassessment-scheduled`, or `closed`. A scheduled reassessment requires a target date.

A failed practical defaults to `remediation-assigned` when no alternative follow-up state is chosen. A passed practical defaults to `closed` and cannot be finalized with an active remediation/reassessment state.

The authenticated learner practical projection includes the controlled follow-up state and reassessment target date in addition to learner-facing feedback. It does not expose evaluator identity, private notes, detailed evidence references, assignment metadata, audit records or the full scoring payload.

## Equivalent reassessment

A finalized practical cannot be silently converted back into an editable draft. The evaluator must explicitly start an equivalent reassessment. Starting reassessment preserves the prior finalized result in controlled history, creates a new in-progress evaluation surface, clears new scoring/evidence entry, allows repeated in-progress saves without duplicating history, and requires the full canonical domain set again before finalization.

## Administrative reporting and export

`admin:read` can request the Course 1 practical report as JSON or CSV. The report includes operational fields needed for cohort management: learner subject, enrollment status, practical status, score, critical-error count, follow-up state, reassessment target, evaluator assignment and timestamps.

The administrative report intentionally excludes private evaluator notes and detailed evidence references. CSV uses the same privacy projection as JSON. Reporting does not create or alter credential eligibility.

`admin:write` may reassign or clear evaluator ownership. Assignment changes are separate from scoring and do not alter learner evidence by themselves.

## Persistence and audit

The authoritative result is stored in `performance_assessment_results`. Practical evidence, follow-up state and preserved revision history live in `evidence_json`. Evaluator ownership lives in `practical_evaluation_assignments`.

Evaluation saves create minimal audit events containing practical identity, version, saved status, score/critical-error summary and controlled follow-up state. Private evaluator notes and learner remediation text are not copied into audit metadata. Assignment operations are operational ownership events and should remain auditable without exposing learner evidence content.

Schema version `3` is required for the assignment table. Production readiness must fail when the deployed database has not applied the current runtime schema.

## Quality gates

The repository test chain covers server-side scoring and critical-error override, evidence-output normalization, follow-up validation, reassessment history, PostgreSQL parameterization, evaluator queue authorization, server-side queue pagination/filtering, ownership conflicts, administrator reassignment, JSON/CSV report privacy, learner follow-up projection, responsive/touch-sized assessor controls, safe DOM construction without `innerHTML`, schema-v3 readiness and production adapter requirements.

No Playwright dependency is used. Deterministic Node/static/API/persistence tests remain the project QA method.

## Extensibility rule

The assessor runtime must not introduce artificial curriculum ceilings. Scoring domains, evidence outputs, support guidance, practical structure, evidence-reference types, report formats and storage integrations may be revised or expanded. Runtime controls protect authorization, privacy and record integrity while continuing to render the current canonical definition dynamically.
