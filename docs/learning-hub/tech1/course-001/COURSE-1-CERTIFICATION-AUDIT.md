# Course 1 Certification-Path Audit

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`  
**Credential path:** THC Cultivation Technician I  
**Audit scope:** learner curriculum, canonical objects, assessments, grader, practical, visuals, workbook/job aids, instructor support, source traceability, accessibility, learner UX, publication consistency, and credential boundary.  
**Audit basis:** current `course1-grader-content-depth` working branch. This branch contains unmerged grader/content improvements and must pass the full repository gate before it is treated as production state.

## Executive finding

Course 1 has enough instructional material to function as a serious professional foundational course. The main remaining gap is not the absence of a curriculum skeleton; it is academic consolidation and quality hardening. The strongest content is spread across canonical JSON lessons, six learner module guides, workbook/practical materials, job aids, instructor resources, evidence/source documentation, and runtime code. Several of those surfaces are not yet synchronized at the same professional standard.

The course should not be considered fully established until the learner-facing course guide, canonical metadata, assessment-bank depth, grader/practical rubric, source presentation, visual/document examples, accessibility review, and publication/status consistency are completed and protected by automated QA.

## Current package inventory

- 1 published Course 1 object
- 6 published module objects
- 18 canonical published lessons
- 12 course learning objectives
- 6 primary competencies
- 945 estimated lesson minutes / 15.75 hours before separate tests and practical work
- 6 module tests with 14 formative items each = 84 formative items
- 36-item public Course 1 final
- 120 public Course 1 knowledge-test items total
- 1 integrated 100-point practical
- 12 workbook activities plus workbook templates
- 6 field/job aids plus a field-reference index
- 14 produced instructional SVG assets on the current working branch; asset system remains expandable with no maximum count
- instructor guide, 12-objective remediation matrix, response exemplars, scenario variants, remediation record, practical assessor guide and calibration protocol
- learner Course Record, completion transcript/data export, evaluator workflow and admin operations/reporting

## Strengths already at a professional level

### Curriculum architecture

The six-module sequence is coherent and job-role appropriate: safety; biosecurity; controlled work and authority; traceability/inventory/waste; equipment readiness/operator care; records/handoff/integration. Each module has three canonical lessons and a module assessment. Module 6 intentionally integrates all six competencies.

### Applied learning

The course consistently asks learners to produce workplace-like evidence rather than only read text. The workbook includes hazard briefs, movement maps, controlled-instruction reviews, traceability/reconciliation packets, equipment fault reports, record corrections, handoffs, status-stack challenges, split/merge genealogy, recurring-fault timelines, and late-entry/closed-loop handoff work.

### Integrated practical

The practical is one of the strongest components. It uses staged event injects, changing conditions, seven evidence outputs, defined authority boundaries, critical-error rules, and connected safety/biosecurity/traceability/equipment/data-integrity decisions rather than disconnected stations.

### Instructor/remediation support

Instructor support is substantial: facilitation guide, objective-level remediation matrix, exemplar responses, scenario variants, remediation record, practical assessor guide, and calibration protocol. This is a stronger support layer than many early course builds.

### Evidence boundaries

The evidence dossier correctly distinguishes regulatory sources, voluntary standards, university-extension guidance, and transferred quality/human-factors models. It repeatedly warns against presenting general guidance as universal cannabis law.

### Public-course / credential boundary

The learner course final and course practical are clearly separated from the secure Technician I credential examination and credential decision process. This separation should remain intact.

## Priority gaps

## P0 — Working branch consistency and test integrity

1. Finish and test Course Grader v2 regression coverage for weighted scoring, partial-credit multiple response, numeric tolerance/range scoring, objective results, competency floors, scoring-version pinning, malformed responses, replay/resume behavior and privacy/non-disclosure.
2. Update practical-grader regression tests to the new rubric/evidence rules before merge.
3. Update the assessor UI so the evaluator is not asked to enter raw points without seeing the canonical behavioral anchors, domain minimum, derived performance level and evidence requirements.
4. Update the practical assessor guide to match the new four-level rubric (`strong`, `competent`, `developing`, `insufficient`). The existing guide still uses strong/partial/weak language.
5. Update learner final-result UI to show the newly available objective results, failed competency-floor information and targeted remediation. The API now exposes more information than the learner result screen renders.
6. Run the complete repository quality gate on the exact branch head before opening/merging the PR.

## P0 — Publication/status consistency

The public course, modules, lessons, assessments and practical are published, but the 12 Course 1 objective records and six primary competency records retain older internal draft statuses. Unlike assessment-item validation states, these are learner-curriculum definitions and should be normalized to the public academic model.

Do **not** solve this by bulk-activating question-bank items. Question validation lifecycle and public curriculum publication are separate concerns.

Several documents also retain obsolete pre-publication wording. Examples include describing the course final/practical as development instruments, referring to draft module/final assessments, or saying source checks happen before a lesson is promoted beyond draft. These documents should describe continuous quality improvement without implying the learner course is unpublished.

## P1 — First-class academic course guide / syllabus

Course 1 lacks a single authoritative learner-facing syllabus/course guide. Add one and surface it in the Academy UI. It should include:

- course description and scope;
- intended audience;
- prerequisites/recommended preparation;
- all 12 learner-facing outcomes in plain language;
- six-module course map;
- estimated workload and how the estimate should be interpreted;
- required/supplied materials and technical requirements;
- learning activities and workbook expectations;
- module-test, course-final and practical structure;
- grading model and competency-floor rule;
- completion requirements;
- retake/remediation/reassessment policy;
- academic integrity / authentic-work expectations;
- accessibility and accommodation process;
- learner support and how to get help;
- source/evidence policy;
- privacy expectations for learner/practical evidence;
- explicit statement that academic Course 1 completion is not the Technician I credential.

## P1 — Canonical course metadata is too thin

The current canonical course schema/object carries little more than identity, status, modules, competencies and final assessment. Professional course metadata currently lives in scattered Markdown. Extend the course schema/object so the authoritative model can carry at least description, audience, prerequisites, outcomes/objective IDs, workload estimate, practical link, completion model, assessment/grading policy reference, accessibility/support references and learner-guide reference.

The UI should derive the Course Guide from controlled course metadata rather than hand-copying the same policy in multiple places.

## P1 — Assessment-bank depth / equivalent forms

The published final uses 36 controlled items. The assessment itself declares a target of 12 bank items per competency, which implies a much deeper target bank than the current final item list. Current form construction shuffles the same listed items; it does not yet select a genuinely equivalent form from a larger blueprint-balanced pool.

Next assessment work should:

- expand the summative bank substantially across all 12 objectives and six competencies;
- create multiple equivalent items for high-consequence objectives;
- preserve applied/analyze-level emphasis;
- add additional document/image/data interpretation stimuli;
- use realistic distractors based on known failure modes;
- implement blueprint-balanced item selection instead of only shuffling one fixed 36-item set;
- prevent recent-item repetition on immediate reassessment where possible;
- keep the public course bank separate from the secure credential bank;
- add item-performance analytics once real response volume exists;
- never claim psychometric validity before sufficient evidence exists.

The 84 formative items are a solid base but should also grow as new misconceptions and scenario variants are identified.

## P1 — Practical grader and assessor reliability

The practical has a strong scenario/evidence structure, but the operational scorer must fully enforce the new anchored rubric. Completion work should include:

- visible behavioral anchors for every domain;
- domain minimums and overall minimum;
- required evidence review before finalization;
- verified required evidence for a passing decision where configured;
- documented context for every critical-error finding;
- domain/evidence linkage or assessor observation justification;
- calibration exemplars for weak, borderline, competent and strong performances;
- second-rater/adjudication workflow for calibration samples or disputed cases;
- grader/rubric version stored with the decision;
- inter-rater/calibration reporting as data accumulates.

## P1 — Visual and document-example depth

The working branch now has 14 produced instructional SVGs and covers the previously weak Lesson 9 and Lesson 16 visual gaps. Visual production should continue because several lessons still share one primary asset and much of the course relies on abstract document/status reasoning.

Highest-value additional asset families:

- annotated mock SDS/label decision example;
- room-status / quarantine / hold / REI status-card set;
- controlled SOP + work-order conflict example;
- authorization/escalation role matrix;
- traceability split/merge/event ledger example;
- inventory/waste discrepancy record example;
- out-of-service tag + equipment readiness example;
- before/after controlled record correction example;
- late-entry audit-trail example;
- strong versus weak shift handoff example;
- seven practical evidence-output exemplars with learner-safe annotations;
- module overview maps showing how lessons connect.

These should be accessible instructional objects, not decoration. There should be no artificial maximum asset count.

## P1 — Learner bibliography and source traceability

The evidence dossier is strong internally, but the learner experience needs a professional bibliography/reference surface that resolves `REF-*` identifiers into usable source information. Provide title, issuing organization, publication/update date, link where public, source type, how Course 1 uses it, and the instructional/legal boundary.

Also maintain source-review dates and a change workflow for superseded evidence. The Evidence Dossier's remaining pre-publication language should be rewritten for continuous review of published content.

## P2 — Module-specific content expansion

### Module 1 — Safety

Strong base. Expand applied practice around electrical/water interactions, emergency alarms/evacuation, CO2-enrichment boundaries, heat stress, ergonomics/repetitive work, ladders/work at height, respiratory/allergy reporting, incident/near-miss reporting and task reassessment after conditions change. Avoid turning the course into specialized safety certification.

### Module 2 — Biosecurity

Strong source-route-receiver logic. Expand incoming plant/material intake, quarantine entry/exit lifecycle, gowning/tool/cart transition examples, sanitation verification evidence, recontamination after cleaning, biosecurity breach containment, and stronger visual pathway exercises. Keep detailed diagnosis/IPM treatment in the later plant-health specialist curriculum.

### Module 3 — Controlled work / authority

Strong authority-boundary content. Expand document-control lifecycle, superseded-copy handling, work-order/SOP conflict cases, role/approval matrix practice, planned exception versus unplanned deviation, deviation handoff, and basic change-control awareness without making Technician I the approver.

### Module 4 — Traceability / inventory / waste

Strong identity and reconciliation foundation. Expand split/merge/transformation events, sample chain-of-custody concepts, controlled downtime/recovery, event-ledger examples, label replacement/reprint controls, waste/disposition evidence chains and jurisdiction-neutral placeholders that point learners back to local rules.

### Module 5 — Equipment care

Strong servicing-boundary teaching. Expand readiness/calibration-status awareness, preventive-maintenance awareness versus operator care, out-of-service tagging, sensor/controller plausibility checks, abnormal noise/heat/vibration/leak observations, fault recurrence and clearer examples of when an operator check crosses into servicing.

### Module 6 — Records / handoff / integration

Strongest integration module. Expand electronic audit-trail/shared-identity risks, controlled transcription/damaged-record handling, late-entry examples, structured read-back/check-back patterns, weak-versus-strong handoff examples, and additional multi-event integrated cases that require reprioritization.

## P2 — Learner support / academic experience

Add or surface:

- Course 1 glossary/quick terminology index;
- study plan / recommended pacing;
- pre-course orientation and optional diagnostic check;
- assessment preparation guide that explains format without revealing keys;
- FAQ / common learner errors;
- technical requirements and troubleshooting guidance;
- accessibility/accommodation information in the learner UI;
- clear support/escalation channel for course questions;
- version/change summary so learners can see meaningful course revisions.

## P2 — Accessibility and delivery verification

The accessibility plan is good, but professional completion requires both automated and human verification. Continue deterministic checks and add documented manual review for keyboard flow, screen-reader reading order, zoom/reflow, contrast, form errors, tables, SVG alternatives, print output and alternative presentation of visual assessment stimuli where the visual itself is not the competency.

If video/audio is added later, captions/transcripts become mandatory production requirements.

## P2 — Duplicate-content drift

Course 1 currently has both 18 canonical structured lesson objects and six substantial learner module Markdown guides. Clarify the relationship:

- either make module guides intentionally authored study guides with a defined scope different from canonical lesson content; or
- generate/synchronize them from canonical objects.

Do not allow two parallel learner sources to diverge silently on policy, source, grading or safety language.

## Documentation inconsistencies found during this audit

- `VISUAL-ACCESSIBILITY-PLAN.md` still says the core set contains 12 visuals while the working registry now contains 14 produced assets.
- `README.md` still describes the course assessment/practical as development instruments despite public publication.
- `COURSE-TEST-PLAN.md` contains draft/development/activation language that no longer matches the published learner-course state.
- `EVIDENCE-DOSSIER.md` says source maintenance occurs before promotion beyond draft; published content instead needs an ongoing review rule.
- practical assessor documentation still needs to match the new four-level anchored runtime rubric.

## Recommended execution order

1. Make the current grader/practical branch internally consistent and fully tested.
2. Normalize Course 1 objective/competency publication status without touching assessment-item validation status.
3. Create the authoritative Course Guide/Syllabus and extend canonical course metadata.
4. Add the objective → lesson → formative practice → final → practical alignment audit.
5. Expand the summative bank and implement true blueprint-balanced equivalent forms.
6. Finish practical rubric/evidence/calibration workflow and assessor UI.
7. Expand high-value instructional visuals and annotated document/evidence examples.
8. Add learner bibliography/source surface and source-review maintenance data.
9. Close the module-specific depth gaps above.
10. Add learner glossary/study/support/accessibility surfaces.
11. Run an end-to-end learner/instructor/assessor/admin QA pass and the complete repository test suite.
12. Merge the exact green head and use Course 1 as the production template for Course 2.

## Definition of an established Course 1

Course 1 can be treated as the production academic template when:

- every canonical curriculum object has a consistent public academic lifecycle state;
- the Course Guide and canonical metadata describe the whole learning contract;
- all 12 objectives are visibly aligned to instruction, formative practice, final evidence and practical evidence where appropriate;
- the written grader and practical grader have deterministic, versioned, adversarially tested decision rules;
- equivalent final forms can be assembled from a sufficiently deep controlled bank;
- practical scoring uses observable anchored evidence and calibrated assessor guidance;
- learner references/bibliography are usable rather than raw internal IDs;
- visual/document assets adequately support the decision-heavy material and remain extensible;
- accessibility and learner support are part of the course experience, not only internal documentation;
- public academic completion remains separate from the secure Technician I credential decision;
- the exact merged code/content head passes the complete repository quality gate.
