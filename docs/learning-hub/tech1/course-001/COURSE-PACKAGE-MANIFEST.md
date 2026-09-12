# Course Package Manifest — COURSE-LH-TECH1-001

## Publication model

Course 1 is a public-facing learner course and remains continuously editable. Content, assessments, examples, sources, visuals, job aids, and UX may be revised whenever improvements are identified.

Review notes, pilot evidence, calibration work, and validity studies are quality-improvement inputs. They do not block editing, learner visibility, or continued publication.

## Canonical curriculum objects

- 1 course object
- 6 module objects
- 18 canonical lesson objects
- 12 controlled course learning objectives
- 6 primary competency areas
- external reference objects and evidence dossier
- 1 course pilot plan for optional evidence collection

## Current lesson-depth snapshot

The 18 canonical lessons currently total **945 estimated minutes (15.75 hours)** before separate module tests, the integrated practical, and the final course assessment.

This duration is a descriptive snapshot of the current lesson versions, not a seat-time cap, publication gate, or restriction on adding/revising content.

The current canonical lessons use richer instructional structures including evidence-backed explanations, visuals, comparisons, process/decision tables, multiple applied scenarios where appropriate, practical learner artifacts, remediation cues, controlled-document models, and explicit evidence/authorization boundaries. Future revisions may add, reorganize, replace, or remove instructional blocks when supported by better evidence or learning design.

## Learner instruction

- 6 expanded learner modules
- 18 canonical learner lessons rendered from structured lesson objects
- student workbook with **12 applied activities**, including 4 deeper challenge labs for status stacking, traceability events, recurring equipment faults/servicing boundaries, and late-entry/closed-loop handoff
- expanded workbook form/templates supporting pathway reconstruction, status-control matrices, transformation/event records, fault timelines, and handoff cross-checks
- **6 expanded field-ready operational job aids**, each mapped to Course 1 objectives and workbook practice
- learner-facing field-reference index covering when to use each aid and how to combine them during multi-problem situations
- field-reference production specification for mobile, print, accessibility, visual hierarchy and version maintenance
- searchable **Field References** surface in the Academy learner runtime
- module-level and lesson-level quick-access links to the aligned field reference
- targeted field-reference remediation links after an incorrect lesson-practice response
- responsive reference cards with print/save mode and mobile touch targets
- responsive learner shell with a sticky desktop course outline, compact mobile outline control, readable lesson measure, touch-sized lesson/practice controls, and single canonical formative-practice rendering
- authenticated Course 1 card status showing official **course final** and **course practical** evidence separately from lesson checkmarks
- authenticated learner-facing Course 1 final workflow with start/resume, restored saved responses, per-item autosave, server-side scoring and domain-level results
- explicit learner-facing boundary between the public Course 1 final and the separate THC Cultivation Technician I credential examination
- public academic **Course 1 practical** learner surface available without authentication
- practical learner surface includes preparation steps, five workflow stages, current evidence outputs, the 100-point scoring model, critical-error boundaries, support resources, responsive mobile layout and print mode
- private assessor-recorded practical status is shown only when authenticated and remains separate from the public academic practical content
- learner-safe assessor feedback/remediation, controlled follow-up state, and reassessment target date can be projected into the authenticated practical status without exposing private evaluator notes, evaluator identity, assignment metadata, or the detailed evidence payload
- canonical practical-to-runtime synchronization audit prevents the learner practical view from drifting away from the published practical object
- retrieval/spaced-practice schedule
- visual/accessibility production plan
- rendered objective-aligned lesson practice with shuffled choices and rationale feedback
- lesson-level guided activities producing additional simulated workplace artifacts
- integrated multi-stage Technician I shift simulation in Lesson 18
- learner-facing integrated practical with staged mid-shift event injects while preserving the controlled evidence-output and competency framework

The six current field references cover hazard response/PPE/HazCom; biosecurity/sanitation/status control; controlled work instructions/authority; traceability/event genealogy/reconciliation; equipment readiness/operator-care boundaries/fault escalation; and data integrity/record correction/shift handoff.

Workbook, practical and field-reference counts describe the current package and are not maximums. Additional guided labs, field references, role-specific variants, translated/accessibility formats, artifacts, or equivalent practice formats may be added or reorganized as the course improves.

The field-reference learner runtime is a navigation and remediation aid. Opening or printing a field reference does not create assessment, practical, completion, or credential evidence.

The Course 1 card reads official learner evidence from the named course final assessment and linked course practical only. It does not treat lesson percentage as course completion, does not substitute for Technician I credential evidence, and does not invent an overall course-complete or credential-eligible state.

The Course 1 practical framework itself is public academic content. Authentication is only used to add the learner's private assessor-recorded result and learner-safe follow-up to that public study view; no evaluator identity, assignment metadata, private notes, or detailed practical evidence payload is exposed by the learner runtime.

## Instructor/assessor support

- expanded instructor guide with module facilitation, coaching, accessibility, evidence-boundary, and remediation rules
- **12-objective remediation matrix** mapping misconceptions, diagnostic prompts, targeted practice, and equivalent reassessment
- **response exemplar set** contrasting weak versus stronger workplace reasoning and records
- **18 instructor scenario variants** for guided practice, oral questioning, remediation, and equivalent reassessment
- remediation record template capturing objective, misconception, targeted practice, learner evidence, and equivalent reassessment
- source/evidence boundaries
- retrieval/spaced-practice guidance aligned to the remediation model
- accessibility delivery requirements
- practical assessor guide
- practical calibration protocol
- equivalent practical Candidate Forms A and B
- role-gated **Practical Assessor Workspace** available only when evaluator capability is authorized
- server-side paginated Course 1 evaluator queue with learner search, practical-status filtering, assignment filtering, and direct authorized learner lookup
- evaluator ownership stored separately from practical evidence, allowing an evaluator to claim unassigned work or release work they own without altering learner evidence
- administrator-controlled reassignment/clear-assignment path for operational workload management
- evaluator assignment claim, release, set, and clear operations recorded through minimal audit events without learner evidence payloads
- all practical scoring domains rendered from the canonical published practical definition, with score bounds enforced again by the server
- canonical critical-error checklist with server-side critical-error override of the point score
- dynamic practical evidence-output review with controlled status, evidence reference, and evaluator note fields driven by the canonical practical rather than a permanent output count
- evidence references point to approved controlled storage; learner evidence files are not copied into curriculum Git or public learner JSON; see `PRACTICAL-EVIDENCE-STORAGE.md`
- separate private evaluator notes and learner-facing feedback/remediation fields
- controlled remediation/reassessment state plus optional reassessment target date
- save-in-progress support plus explicit confirmation before finalizing an official practical result
- explicit equivalent-reassessment workflow preserving finalized revision history before a new in-progress evaluation can be created
- server-calculated practical status and score written to the authoritative `performance_assessment_results` record rather than accepted from browser-supplied status fields
- prior finalized practical revisions preserved in controlled evidence history when an authorized replacement evaluation is recorded
- practical-evaluation writes create a minimal audit event without copying private evaluator notes into audit metadata
- evaluator identity comes from the authenticated evaluator session and cannot be supplied or overridden by the browser
- administrative Course 1 practical report available as privacy-bounded JSON or CSV for cohort operations
- schema version 3 assignment persistence in `practical_evaluation_assignments`, separate from practical result/evidence records
- review packet for optional quality review

Instructor-resource counts describe the current support package, not content ceilings. Additional misconception patterns, exemplars, scenario variants, prompts, scoring guidance, assessor support, evidence-reference types, storage integrations, reports, or remediation methods may be added or reorganized when they preserve the controlled objectives, privacy rules, and evidence boundaries.

## Course assessment

- lesson retrieval checks embedded in instruction
- 6 formative module tests × 14 items = **84 formative items**
- 1 integrated practical with analytic rubric/critical-error rules
- 1 final course assessment = **36 summative items**
- total public Course 1 knowledge-test item inventory = **120 items**
- current final-assessment runtime builds its form from the assessment's controlled item list rather than an application-level fixed item count
- final item/choice presentation may be randomized deterministically per attempt while scoring remains against immutable canonical item versions
- learner responses are stored in the learner attempt record; correct-answer keys and rationales are not returned in the live final-assessment payload
- final submission is scored server-side and returns score/pass status plus competency/domain results consistent with the configured post-attempt domain-level feedback mode
- practical finalization requires a complete set of canonical domain scores; passing requires both the configured point threshold and the configured critical-error rule

The 84/36/120 counts are the current published inventory, not content ceilings. Additional valid items may be added, retired, replaced, or reorganized as objectives, evidence, instructional depth, and pilot findings evolve. Automated QA enforces minimum quality baselines and internal consistency rather than freezing the bank at an exact size.

The public course assessments are separate from the THC Cultivation Technician I certification examination. The learner final runtime resolves only a summative course assessment explicitly included in the published Course 1 release; it does not accept an arbitrary credential-assessment identifier from the learner browser.

## Remediation evidence model

A missed item or weak performance should not trigger an automatic same-item retry. Course 1 remediation is objective-linked:

1. identify the controlled objective and learner reasoning/performance gap;
2. diagnose the misconception before reteaching;
3. assign the smallest useful lesson/workbook/exemplar practice;
4. require active learner-generated evidence;
5. reassess using a changed but equivalent context;
6. record the result when a controlled remediation record is appropriate.

Successful remediation means the learner can apply the objective in a new context. Viewing the correct answer or rereading a page is not sufficient evidence by itself. The learner final therefore returns domain-level performance and remediation direction without exposing the answer key after submission.

For the integrated practical, authorized evaluators may record learner-facing remediation separately from private evaluator notes. The learner can also see the controlled follow-up state and reassessment target when applicable. Equivalent reassessment can replace a finalized result while preserving previous finalized snapshots in evaluation history.

## Operational reporting and evidence storage

Evaluator assignment is an operational workflow state, not credential evidence. It is stored separately from the practical result so ownership can be assigned before an evaluation exists and changed without rewriting the learner's scoring evidence.

Practical evidence files remain in approved controlled storage. The evaluator record stores references/locators to those files or artifacts. The curriculum repository and public learner runtime do not become a private learner-file store.

Administrative Course 1 practical reporting may include learner subject, enrollment status, practical status, score, critical-error count, follow-up state, reassessment target, evaluator assignment and timestamps. JSON and CSV reporting intentionally omit private evaluator notes and detailed evidence references.

## Ongoing validity improvement

The project may continue to collect and use:

- learner performance data;
- item difficulty and discrimination observations;
- usability feedback;
- reviewer comments;
- practical-assessor calibration observations;
- accessibility findings;
- source updates;
- standard-setting analysis;
- version-to-version change records.

Internal planning may target 50 usable responses per knowledge item, with 30 usable responses as a preliminary analysis threshold. These are project research targets, not universal validity requirements and not publication gates.

Statistics, reviews, and pilot findings should guide revisions. They do not automatically activate, retire, lock, approve, reject, or prevent editing of content.

## Current status

The Course 1 learner package is public-facing and structurally testable. Source verification, learner/instructor materials, assessment banks, practical forms, learner practice, field-ready reference aids, learner-facing field-reference navigation/remediation, responsive learner navigation, official course-level evidence status, authenticated final-assessment start/resume/autosave/scoring, public academic practical viewing, private practical-result projection, trusted role-gated practical evaluation, server-side evaluator queue pagination, assignment ownership, learner-safe follow-up/reassessment state, practical evidence references, revision history, administrator reporting/export, objective-linked remediation support, and supporting evidence materials are present.

The course should continue to improve as new evidence, learner data, accessibility findings, technical review, or better instructional design becomes available. No review or pilot state makes the content immutable.
