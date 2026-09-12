# Course 1 Assessor Workflow Runtime

## Purpose

The Course 1 practical assessor runtime is the authorized operational layer for `PRACTICAL-LH-TECH1-001-WORKFLOW`. It records course-practical performance evidence. It does **not** issue the THC Cultivation Technician I credential and does not expose secure credential-exam material.

The public academic practical remains viewable without evaluator authorization. Evaluator authorization controls only the private roster, practical evidence review, official scoring and evaluator notes.

## Evaluator queue

An evaluator with `evaluator:read` receives a Course 1 learner queue built from current Course 1 enrollments. The queue shows:

- learner identity subject used by the Academy identity adapter;
- enrollment state;
- practical state (`not-recorded`, `in-progress`, `passed`, `failed` or `voided`);
- recorded score when finalized;
- critical-error count;
- remediation/reassessment follow-up state;
- reassessment target date when one is set;
- evaluation timestamps.

The browser can search and filter the authorized queue without exposing that roster to learner roles. Direct subject lookup remains available as a fallback for an authorized evaluator.

The persistence query resolves the practical record for the current published practical version. Queue size is an operational retrieval concern, not a curriculum/content ceiling.

## Evidence-output review

The assessor form renders evidence outputs from the canonical practical definition rather than a hard-coded output count. The current practical defines seven outputs, but the runtime follows the array in the practical object so future additions, removals or reorganizations do not require an application-level count change.

For each canonical output, the evaluator can record:

- `not-reviewed`;
- `received`;
- `verified`;
- `needs-revision`;
- a controlled evidence reference/locator;
- an evaluator evidence note.

References identify the evidence used for evaluation; they are not a substitute for the evidence itself and should not contain secrets or unrelated personal information.

## Scoring and finalization

All canonical scoring domains are rendered from the published practical definition. The server independently validates each score against its domain maximum and calculates the official percentage. The browser cannot provide or override the evaluator identity, authoritative score percentage, or pass/fail result.

Finalization requires every canonical scoring domain. The current practical passes at the configured minimum percentage only when its configured critical-error rule is also satisfied.

Evaluator identity comes from the authenticated evaluator session. `evaluator:read` can view the workspace; `evaluator:write` is required to save or finalize an official practical result.

## Remediation and reassessment state

The evaluator can track a learner through the following workflow states:

- `none`;
- `remediation-assigned`;
- `remediation-in-progress`;
- `ready-for-reassessment`;
- `reassessment-scheduled`;
- `closed`.

A scheduled reassessment requires a target date. These states organize the course-practical workflow; they do not represent credential eligibility or credential issuance.

A failed practical defaults to `remediation-assigned` when the evaluator does not choose another follow-up state. A passed practical defaults to `closed` and cannot be finalized with an active remediation/reassessment state.

## Equivalent reassessment

A finalized practical cannot be silently converted back into an editable draft. The evaluator must explicitly start an **equivalent reassessment**.

Starting reassessment:

1. preserves the prior finalized result in controlled history;
2. creates a new in-progress practical evaluation record;
3. clears the visible reassessment scoring/evidence-entry surface so the new result is based on new equivalent evidence;
4. allows the reassessment to be saved in progress;
5. requires the full canonical domain set again before finalization.

Repeated saves of the in-progress reassessment do not duplicate the preserved finalized history. When the reassessment is finalized, the server calculates the new official result while retaining the previous finalized revision snapshots.

## Private versus learner-facing information

Evaluator records distinguish:

- **private evaluator notes**, available only through evaluator-authorized views;
- **learner feedback/remediation**, which may be projected into the authenticated learner practical status;
- detailed domain/evidence-output records, which remain evaluator evidence and are not returned in the learner course-evidence projection.

The learner projection must not expose evaluator identity, private evaluator notes, evaluator evidence references, audit records or the full scoring evidence payload.

## Persistence and audit

The authoritative result is stored in `performance_assessment_results`. Practical evidence, follow-up state and preserved revision history live in `evidence_json` so the current evidence model can expand without imposing a fixed content-field count in the relational schema.

Each evaluator save creates a minimal audit event containing the practical identity, practical version, saved status, score/critical-error summary and controlled follow-up state. Private evaluator notes and learner remediation text are not copied into audit metadata.

## Quality gates

The normal repository test chain covers:

- server-side domain scoring and critical-error override;
- evidence-output normalization against the canonical practical;
- remediation/reassessment state validation;
- explicit reassessment history preservation;
- PostgreSQL parameterization and audit privacy;
- evaluator roster authorization;
- learner-role denial from evaluator routes;
- browser anti-forgery behavior;
- learner evidence privacy;
- responsive/touch-sized assessor controls;
- safe DOM construction without `innerHTML`;
- production persistence-adapter requirements.

No Playwright dependency is used for this workflow. Deterministic Node/static/API/persistence tests remain the project QA method.

## Extensibility rule

The assessor runtime must not introduce artificial curriculum ceilings. Scoring domains, evidence outputs, support guidance and practical structure are controlled by the canonical practical content and may be revised or expanded. Runtime validation should protect integrity and authorization while continuing to render the current canonical definition dynamically.
