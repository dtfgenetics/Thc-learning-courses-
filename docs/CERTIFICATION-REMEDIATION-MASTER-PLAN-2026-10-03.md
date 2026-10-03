# Certification Remediation Master Plan — 2026-10-03

## Purpose

This is the execution map for converting the existing THC Academy course and credential codebase into a coherent certification system without mixing it with the separate 420-topic Encyclopedia.

The plan treats the current 15-course Technician curriculum as frozen canonical scope:
- Technician I: 7 courses
- Technician II: 8 courses

New core Technician courses are not added unless an approved job/task-analysis change demonstrates a genuine occupational gap.

## Program model

### Layer A — THC Academy education certificates

The 15 canonical courses are the instructional pathway. Academic completion proves completion/mastery of the identified THC Academy curriculum.

Education certificate readiness requires:
- canonical course package;
- complete learner-facing lessons;
- references/provenance;
- applied exercises and worked examples;
- instructional visuals;
- accessible presentation;
- lesson progress persistence;
- course-owned assessments;
- academic completion evidence.

Academic certificate completion does not equal professional certification.

### Layer B — professional personnel certifications

Technician I and Technician II professional credentials are independent occupational competence decisions.

Professional certification requires:
- approved JTA/occupational analysis;
- competency and blueprint validation;
- approved eligibility model;
- secure operational exam bank/forms;
- real pilot data;
- psychometric/item analysis;
- practical/capstone calibration;
- formal standard setting;
- accessibility and accommodation validation;
- candidate governance;
- production security/persistence/signing evidence;
- exact-version credential authorization.

## Workstream 1 — Canonical/public synchronization

### Problem
The publishing/integration repository can lag the canonical certification repository and expose stale course status or old source SHAs.

### Required work
1. Pin public Technician I/II publication manifests to the current approved canonical course snapshot.
2. Derive public catalog availability from release evidence rather than manually maintained stale labels where practical.
3. Add a cross-repository drift gate:
   - source repository;
   - exact source SHA;
   - course release IDs;
   - canonical course/version set;
   - publication status.
4. Fail release when a public page claims a state contradicted by canonical evidence.
5. Verify anonymous visitor routes after cache purge.

### Completion evidence
- public manifests point to reviewed current source SHA;
- all 15 canonical course roots and released lessons resolve;
- public status agrees with source release objects;
- no Encyclopedia object is counted as a certification course.

## Workstream 2 — 284-lesson instructional-depth normalization

### Goal
Move from “lesson file exists” to “lesson teaches a usable professional skill.”

### Required lesson pattern
Every lesson should contain, where applicable:
1. purpose/outcome;
2. measurable objectives;
3. controlled vocabulary;
4. mechanism/process explanation;
5. observation/evidence;
6. measurement method and units;
7. worked example;
8. realistic scenario;
9. common failure modes/misconceptions;
10. decision/escalation boundary;
11. verification step;
12. practical/SOP/job connection;
13. references with applicability limits;
14. assessment coverage;
15. related lesson/tool links;
16. visual contract and alt text.

### Priority order
1. Safety/biosecurity/traceability lessons with credential-critical claims.
2. Measurement-heavy environment/light/water/root-zone lessons.
3. IPM/diagnostic lessons.
4. Harvest/postharvest/quality lessons.
5. Technician II troubleshooting/coordination lessons.
6. Remaining lessons with low worked-example or visual coverage.

### Completion evidence
Generate a machine-readable matrix for all 284 lessons with columns:
- lesson ID/version;
- objectives;
- direct sources;
- worked example;
- scenario;
- measurement/calculation;
- practical linkage;
- visual count/roles;
- assessment mapping;
- accessibility review;
- human scientific review;
- human assessment review;
- release state.

## Workstream 3 — instructional visual coverage

### Goal
Use visuals for teaching, not decoration.

### Visual roles
- anatomy/system diagram;
- measurement geometry;
- sensor/sampling placement;
- workflow/process;
- comparison plate;
- decision tree;
- fault/differential diagram;
- before/after sequence;
- timeline;
- data interpretation chart;
- practical simulation evidence.

### Required work
1. Audit each lesson for concepts that materially benefit from visual explanation.
2. Reuse approved visual systems where scientifically appropriate.
3. Produce missing course-specific graphics.
4. Record asset ID, source/evidence boundary, alt text, placement, version, and approval state.
5. Verify mobile/desktop readability and no text baked into unreadably small raster layouts.

### Completion evidence
No major instructional concept is left with a decorative placeholder where a scientific/decision visual is needed.

## Workstream 4 — assessment system

### Course assessment
Maintain the current behavior:
- learner marks answers independently;
- choices persist;
- timer persists;
- grading occurs only after submission;
- server/system grading;
- no answer leakage before submission;
- course/assessment/item versions are immutable in attempt evidence;
- approved accommodations can modify access conditions, including time, without altering the scoring standard.

### Professional credential examination
Keep separate from course finals.

Required operational path:
1. JTA-approved blueprint.
2. Private secure item bank.
3. Multiple equivalent forms.
4. exposure tracking;
5. quarantine/compromise workflow;
6. pilot administration;
7. item analysis;
8. form-level reliability/equivalence evidence;
9. formal standard setting;
10. governance adoption of passing rule.

Public repository questions are never silently promoted into operational credential forms.

## Workstream 5 — job/task analysis and occupational validation

### Goal
Make the professional credential originate from the job, not from the lesson inventory.

### Panel composition target
Recruit a representative panel including:
- working cultivation technicians;
- senior technicians;
- cultivation managers/head growers;
- IPM/plant-health personnel;
- irrigation/environment personnel;
- propagation personnel;
- harvest/postharvest/QA;
- compliance/traceability personnel;
- employers/hiring managers.

### Data to collect
For each task:
- performed by role?;
- frequency;
- importance;
- consequence of error;
- level of independence;
- entry-level vs advanced;
- required knowledge/skill;
- jurisdiction/facility dependency.

### Outputs
- validated Technician I JTA;
- validated Technician II JTA;
- task/competency weights;
- minimum competence description;
- blueprint revision;
- documented panel composition and conflict controls.

## Workstream 6 — practical and capstone validation

### Technician I
Retain Practicals A–F and integrated cultivation-shift capstone.

### Technician II
Retain the advanced diagnostic/performance set and integrated senior-technician capstone.

### Required work
1. freeze exact rubric versions for pilot;
2. assessor training;
3. independently double-score common samples;
4. compute agreement evidence;
5. review critical-failure disagreements;
6. revise ambiguous anchors;
7. repeat calibration after material rubric changes;
8. standard-set practical thresholds.

### Rule
Critical safety, identity, integrity, authority, and hold failures remain non-compensatory unless an approved governance revision changes that decision model.

## Workstream 7 — candidate governance

### Separate processes required
- application/eligibility;
- accommodations;
- retest/remediation;
- appeals;
- complaints;
- security incidents;
- candidate misconduct;
- assessor conflicts;
- credential corrections;
- suspension/revocation;
- record/privacy requests.

### Required additions
1. Separate complaint records from appeals.
2. Impartiality/conflict-of-interest register.
3. assessor/reviewer conflict declaration.
4. documented candidate handbook.
5. privacy/legal approval of retention and candidate-data policies.
6. operational escalation and decision-authority matrix.

## Workstream 8 — AI governance

### Goal
Comply with the program’s human-review standard and modern personnel-certification expectations.

For credential-bearing material record:
- AI contribution classification;
- object/version;
- generation/revision date;
- human reviewer;
- review domain;
- approval decision/date.

AI may assist drafting and analysis but may not independently make final credential, revocation, appeal, accommodation, cut-score, operational form, or assessor-authorization decisions.

## Workstream 9 — accessibility

### Required work
1. Target WCAG 2.2 AA for public learner and assessment interfaces.
2. Complete keyboard and screen-reader workflows.
3. Verify focus, labels, errors, contrast, zoom/reflow, reduced motion, and responsive tables/diagrams.
4. Preserve entered answers across recoverable authentication/session events.
5. Support approved extended-time arrangements without changing assessment content/scoring.
6. Complete manual accessibility approval for all 15 course packages and assessment surfaces.

## Workstream 10 — credential lifecycle

### Required states
Support:
- active;
- expiring;
- renewed;
- expired;
- suspended;
- revoked;
- superseded.

Do not invent a renewal interval before governance approval.

Prepare the system to support continuing competence through approved combinations of:
- continuing education;
- occupational practice;
- update modules;
- reassessment;
- re-examination.

Education certificates and professional certifications may use different lifecycle rules.

## Workstream 11 — credential issuance and portability

### Existing foundation
The repo already supports signed credential payloads, verification IDs, private learner linkage, and public verification projection.

### Required completion
1. production issuer identity;
2. managed signing/key custody;
3. key rotation/compromise process;
4. deployed revocation status persistence;
5. backup/restore and monitoring;
6. private secure assessment store;
7. privacy/legal approval;
8. optional Open Badges 3.0 / verifiable credential export after the core credential is authorized.

## Workstream 12 — operational release gate

A professional credential must remain non-issuable until all required exact-version evidence is approved.

Release must fail closed for missing:
- JTA validation;
- SME/employer validation;
- assessment review;
- accessibility approval;
- practical/capstone validation;
- pilot evidence;
- assessor calibration;
- secure form/store approval;
- standard setting;
- candidate-governance approval;
- privacy/legal approval;
- production security controls;
- credential authorization.

## Execution sequence

### Wave 1 — structural correction
- [x] Define certificate vs professional-certification governance.
- [ ] Synchronize public source pins/status to canonical source.
- [ ] Add complaint/impartiality/AI-provenance/continuing-competence data contracts.
- [ ] Produce current 284-lesson gap matrix.

### Wave 2 — content normalization
- [ ] Repair highest-risk lesson gaps.
- [ ] Complete worked examples/scenarios.
- [ ] Complete visual-production gaps.
- [ ] Complete cross-links/tools/SOP integration.
- [ ] Run scientific/assessment/accessibility review queues.

### Wave 3 — occupational validation
- [ ] Execute Technician I JTA.
- [ ] Execute Technician II JTA.
- [ ] Adopt competency/blueprint revisions.
- [ ] Define approved eligibility pathways.

### Wave 4 — pilot and calibration
- [ ] Build private operational development item bank.
- [ ] Run candidate pilot.
- [ ] Analyze items/forms.
- [ ] Run practical/capstone assessor calibration.
- [ ] Revise exact versions as evidence requires.

### Wave 5 — standards and authorization
- [ ] Formal written-exam standard setting.
- [ ] Practical/capstone standard setting.
- [ ] Final candidate-governance/privacy/security approvals.
- [ ] Validate production signer/store/persistence.
- [ ] Exact-version credential authorization.

### Wave 6 — release
- [ ] Enable professional credential issuance.
- [ ] Verify certificate generation and public verification.
- [ ] Publish candidate handbook and policies.
- [ ] Monitor outcomes, security incidents, complaints, appeals, and item exposure.
- [ ] Schedule maintenance/revalidation cycle.

## Definition of “finished”

The courses are academically finished when all 15 course packages and 284 lessons satisfy the instructional, assessment, visual, accessibility, and public-runtime gates.

The professional certifications are finished only when real occupational, pilot, calibration, standard-setting, security, privacy, and authorization evidence exists and the production release gate authorizes issuance.

A passing CI suite alone is never evidence that the professional credential is valid.
