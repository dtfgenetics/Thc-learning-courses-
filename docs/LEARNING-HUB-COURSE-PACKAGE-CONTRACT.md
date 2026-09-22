# Learning Hub Certification Course Package Contract

**Version:** 1.0  
**Reference implementation:** `COURSE-LH-TECH1-001`  
**Purpose:** define a reusable, extensible minimum contract for professional Learning Hub course packages without imposing artificial content ceilings.

## Core principles

1. A course object is not complete merely because its ID, modules and test exist.
2. Academic course publication is separate from professional credential issuance.
3. Course content remains editable and extensible; counts are minimum quality baselines or current inventory, never maximums.
4. Human review, rendered accessibility review, pilot evidence, calibration, standard setting and final approvals must remain genuine human/evidence gates.
5. Public academic assessment content must remain separated from private secure operational credential examinations.
6. Each certification course must be a dedicated instructional package. Reused references or encyclopedia topics may support it, but they cannot replace its dedicated lessons, examples, practice, remediation, or assessment.
7. Certification tests must be built from the course's own controlled objectives and taught course material. No scored objective may exist only in an encyclopedia topic, blueprint, reference list, or question bank.

## Profile A — ordinary certification course

Courses such as Technician I Courses 2–6 use this profile.

### A1. Controlled course definition

Required:

- stable course ID and version;
- lifecycle/release status;
- title and meaningful description;
- credential-path mapping;
- intended audience;
- delivery modes;
- evidence policy;
- assessment policy;
- competencies;
- measurable course learning outcomes;
- `contentCeiling: null` or equivalent no-artificial-ceiling policy.

### A2. Resolvable instructional graph

Required:

- all referenced modules resolve;
- all module lesson references resolve;
- at least one course-specific occupational module;
- a dedicated course-specific lesson layer that teaches the required certification content directly;
- controlled course-specific objectives referenced by those lessons;
- enough explanation, examples, practice and feedback for the course to stand on its own;
- lesson-level source/evidence references where material claims are made;
- encyclopedia links only as optional supporting/deeper-study references, never as substitutes for required course instruction.

The number of modules/lessons/objectives may grow. Existing Technician I production slices currently use four dedicated applied lessons for Courses 2–6; that is a current minimum baseline, not a global course-size rule.

### A3. Complete learning loop

Every controlled course objective must have:

1. instruction;
2. applied practice;
3. scored academic assessment evidence;
4. remediation guidance;
5. equivalent reassessment guidance.

The Course 1 audit pattern is the reference behavior. Future generic tooling should enforce this relationship from machine-readable sources rather than fixed hand-maintained tables.

### A4. Learner application package

Required before gold-standard academic release:

- meaningful activities/workbook evidence appropriate to the course;
- scenario/application work that exercises decisions rather than recall only;
- field/job aids where they materially support transfer to practice;
- no decorative filler added merely to satisfy an asset count.

### A5. Certification-course assessment package

The course test is part of the dedicated certification-course package and must be derived from what the course actually teaches.

Required:

- distinct formative and summative evidence;
- no unintended item overlap between formative and summative forms;
- one defensible keyed answer per selected-response item;
- objective/competency mapping;
- explicit mapping from every scored objective/item family to dedicated course instruction where that objective is taught;
- no scored content that exists only in the 420 encyclopedia, a blueprint, or external reading;
- evidence references;
- item-purpose metadata;
- accessibility/accommodations metadata where supported by the runtime;
- explicit development/public-academic boundary;
- no claim that the course assessment is the secure credential examination.

Current Course 2–6 development banks are valid production slices but remain development/public-academic material until human review/pilot decisions support release.

### A6. Performance mapping

Where occupational competence cannot be established adequately by written evidence alone, the course must map to one or more observable practicals/capstone tasks. The mapping must preserve:

- observable criteria;
- role/authorization boundaries;
- critical-error rules where appropriate;
- evidence capture;
- remediation/reassessment boundaries;
- evaluator calibration/equivalence requirements at the credential layer.

### A7. Evidence and source dossier

Before gold-standard release, course-specific review must confirm:

- durable scientific claims trace to authoritative evidence;
- safety claims are current and appropriately scoped;
- jurisdiction/facility-specific rules are not presented as universal requirements;
- vendor-specific procedures are not mistaken for the underlying occupational competency;
- citations/references are sufficient for the claim strength used.

### A8. Visual/asset plan

Visuals are required when they materially improve instruction, not as a fixed image quota. Each published teaching visual must have:

- lesson/objective mapping;
- factual/copy review;
- accurate text alternatives;
- responsive behavior;
- public resolvable source;
- no unsupported safety/legal/authorization claims.

Replacement assets must not displace a reviewed production baseline until their QA is complete.

### A9. Instructor/remediation package

Before gold-standard release, provide course-appropriate:

- instructor guidance;
- objective-linked remediation;
- response/performance exemplars where useful;
- scenario variants or equivalent practice sources where useful;
- assessor guidance for performance evidence.

### A10. Human review queue

The current versioned course package must generate an authoritative queue covering, at minimum:

- scientific/technical lesson review;
- editorial/instructional review;
- assessment-definition review;
- scored academic item review;
- performance-assessment review where applicable;
- rendered accessibility/manual UX review;
- legal/compliance review.

Approval state must come from versioned human review records, never green CI alone.

### A11. Accessibility/manual learner UX

Machine checks support but do not replace rendered review. Gold-standard release preparation must include a WCAG 2.2 Level AA manual review packet covering the actual learner surface, keyboard operation, screen-reader use, focus, reflow/zoom, contrast, form/test behavior, visuals, responsive mobile/tablet/desktop layout and learner workflow.

### A12. Public deployment evidence

When a course is public, record:

- exact route;
- site repository/build/commit;
- deployment workflow/run evidence;
- authenticated readback where appropriate;
- fresh anonymous learner verification;
- broken-asset/navigation checks;
- truthful catalog/readiness wording.

A public course may be academically available while professional credential issuance remains unavailable.

## Profile B — integrated practice lab

Technician I Course 7 uses this profile. It must satisfy the same governance, accessibility, review and release-boundary principles, but it does not need a redundant ordinary course final when its controlled purpose is integrated readiness/performance preparation.

Required integrated-lab evidence includes:

- dedicated integrated lab module and objectives;
- applied lab lessons/stations;
- formative readiness assessment;
- mapping to all required practicals;
- capstone blueprint;
- critical-failure rules;
- evaluator evidence model;
- equivalent-form requirements;
- calibration/inter-rater protocol;
- retest/remediation rules;
- candidate evidence/retention requirements;
- explicit secure-form boundary.

## State vocabulary

Use states that distinguish what is actually known:

- `draft` — editable development source;
- `source-structure-complete-human-validation-open` — required machine-resolvable instructional/assessment source exists and passes structural checks, but package QA/human validation is not complete;
- `machine-package-complete-human-validation-open` — all identified machine-resolvable gold-standard package work is complete; only genuine human/pilot/calibration/standard-setting/approval gates remain;
- `human-approved-academic-release` — versioned academic course approval is complete;
- professional credential release states are controlled separately at the credential-program level.

Do not use “complete,” “certified,” “approved,” “accredited,” or “issuable” as shortcuts when the corresponding evidence does not exist.

## Deterministic validation

`scripts/audit-tech1-course-package-source.mjs` is the shared Technician I source-package audit for Courses 2–7. Course 1 retains its deeper finish audit as the reference implementation. Generic validators should expand as the package contract becomes more machine-readable, reducing Course-1-specific scripts over time without weakening existing gates.
