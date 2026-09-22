# Technician I Course Readiness Matrix

**Program:** `CREDPROG-CULT-TECH-I-001 — THC Cultivation Technician I`  
**Audit date:** 2026-09-18  
**Package contract:** `docs/LEARNING-HUB-COURSE-PACKAGE-CONTRACT.md`  
**Machine reporter:** `scripts/report-tech1-course-package-readiness.mjs`  
**Credential machine registry:** `registry/technician-i-machine-layer.json`

## Current control state

All seven Technician I **source packages satisfy the machine source-package contract**. This is enforced by the program/package validation layer. The project owner has approved completed academic course material for publication. External review, pilot, calibration, and standard-setting evidence must remain truthfully labeled when absent, but they are not publication prerequisites for owner-approved academic course content. Professional credential issuance remains separately fail-closed where secure operational assessment, identity, evidence, signing, or decision controls are not yet verified.

## Course readiness

| Course | Source/package state | Assessment/performance state | Learner assets | Remaining machine deployment work | Human/release gates |
|---|---|---|---|---|---|
| `COURSE-LH-TECH1-001` — Safety, Responsible Practice & Cultivation Workflows | Production-released owner-approved academic package | Published academic package + integrated practical | Full governed learner/instructor raster visual layer | Preserve verified public release evidence | Academic release complete; external validation not claimed |
| `COURSE-LH-TECH1-002` — Plant Observation, Growth Stages & Crop Records | Published owner-approved academic package; machine completion verified | 12 formative items distributed 1/2/4/3/2 across objectives; 20 summative items exactly 4/objective; Practical A crosswalk + canonical assessor/calibration-validation packet | 10 governed assets; learner routes and server-side formative grading verified in repository tests | Public course/lesson/assessment readback verified; exact deployment build/source SHA and manual responsive QA remain | technical/assessment/accessibility/practical/calibration/pilot/standard-setting validation open; academic publication complete |
| `COURSE-LH-TECH1-003` — Environmental, Light & Sensor Fundamentals | Published owner-approved academic package; machine completion verified | 12 formative + 20 summative; Practical A mapping | 6 governed/mirrored assets | Public course/lesson/assessment readback verified; shared learner-runtime regression added; exact build/source SHA and manual responsive QA remain | academic publication complete; external validation not claimed |
| `COURSE-LH-TECH1-004` — Water, Root Zone, Nutrition & Irrigation Fundamentals | Published owner-approved academic package; machine completion verified | 12 formative + 24 summative with 2 formative + 4 summative per objective; Practical B | 7 governed assets | Public course/lesson/assessment readback verified; shared learner-runtime regression added; exact build/source SHA and manual responsive QA remain | human/practical/pilot/credential-validation gates open |
| `COURSE-LH-TECH1-005` — Propagation, Canopy, IPM Scouting & Crop Care | Published owner-approved academic package; machine completion verified | 12 formative + 24 summative; Practicals C/D/E | 9 governed assets | Public course/lesson/assessment readback verified; shared learner-runtime regression added; exact build/source SHA and manual responsive QA remain | human/practical/pilot/credential-validation gates open; no pesticide/treatment authority |
| `COURSE-LH-TECH1-006` — Harvest, Postharvest, Traceability & Shift Handoff | Published owner-approved academic package v0.4.0; machine completion verified | 12 formative + 24 summative; Practical F | 8 learner-reachable repo assets + 8/8 verified Drive mirrors | Public course/lesson/assessment readback verified; shared learner-runtime regression added; exact build/source SHA and manual responsive QA remain | human/practical/pilot/credential-validation gates open; no product-release authority |
| `COURSE-LH-TECH1-007` — Integrated Cultivation Technician Practice Lab | Published owner-approved academic practice-lab package; machine completion verified | 12-item readiness bank (2 per objective), Practicals A–F, 200-point capstone; ordinary final intentionally `null` | governed reuse manifest across Courses 2–6 | Public course/lesson/readiness-check readback verified; shared learner-runtime regression added; exact build/source SHA and manual responsive QA remain | practical/capstone validation, calibration/inter-rater, standard setting, privacy/security and credential-release approval open; academic publication complete |

## Course 2 control layer now established

Course 2 now has a dedicated fail-closed completion registry at `registry/course2-completion-status.json`. It distinguishes machine-verifiable source/package evidence from open human/evidence gates instead of treating file presence as course completion.

The current Course 2 machine evidence includes:

- four applied course-specific lessons and five controlled objectives;
- distinct 12-item formative and 20-item summative academic banks;
- formative coverage on every objective and exactly four summative items per objective;
- objective-linked corrective coaching, return-to-practice and equivalent reassessment guidance;
- Practical A objective crosswalk verified against the actual practical document;
- canonical Practical A assessor guide and calibration/validation packet;
- ten governed learner assets delivered through the Academy runtime;
- evidence dossier, accessibility/manual-UX review packet and human-review worklist;
- strengthened `scripts/test-tech1-course2.mjs` that requires the package artifacts and fail-closed state.

None of that claims that the course, practical, evaluators, cut score or professional credential has received the required human/empirical approval.

## Course 7 integrated controls

Course 7 enforces the intended integrated-performance profile:

- six objectives with exactly two readiness items each;
- all six 100-point practical development blueprints;
- 200-point integrated shift capstone with provisional 160 development target;
- five controlled credential-blocking critical failures: safety, identity/genealogy, data integrity, authority, active hold/release;
- equivalent-form requirement;
- remediation before retest and affected-domain reevaluation after critical failure;
- pilot double scoring and evaluator calibration requirements;
- candidate evidence retention/privacy draft;
- integrated accessibility/accommodation packet;
- secure credential forms remain non-public and unapproved.

## Credential machine layer

The following machine-resolvable credential artifacts exist and are registry-controlled:

- `registry/technician-i-jta-competency-crosswalk.json` — 13 JTA domains mapped to program competencies, courses, Practicals A–F and capstone;
- `registry/technician-i-machine-layer.json` — authoritative machine-layer artifact/security registry;
- `registry/technician-i-integrated-lab-plan.json` — practical/capstone blueprint and critical-failure/form/evaluator controls;
- `registry/technician-i-release-evidence.json` — fail-closed release gates;
- `content/assessments/ASSESS-CRED-TECH1-001.json` — public credential blueprint with zero operational secure items;
- `docs/academy-v2/credential/tech1/SECURE-ASSESSMENT-STORE-CONTRACT.md`;
- `docs/academy-v2/credential/tech1/EQUIVALENT-SECURE-FORM-RULES.md`;
- `docs/academy-v2/credential/tech1/CANDIDATE-RETEST-ACCOMMODATION-APPEAL-SECURITY-DRAFT.md`;
- Course 7 candidate evidence retention/privacy draft;
- `docs/academy-v2/credential/tech1/ISSUANCE-VERIFICATION-WORKFLOW.md`;
- deterministic `scripts/test-tech1-machine-layer.mjs` and release-readiness tests.

The API already provides read-only public credential verification with security/failure-path tests and persistent credential status-transition infrastructure. New Technician I issuance remains intentionally disabled until an approved private assessment/evidence decision system and release approvals exist.

## Remaining machine work

The remaining work that machines can truthfully perform is narrower:

1. confirm CI passes the shared Courses 3–7 learner-runtime regression and the Course 2 learner-runtime controls;
2. complete deployed responsive/manual learner-surface QA evidence for Courses 2–7;
3. identify and record exact deployment build/source SHA for the already verified public routes;
4. keep versioned review-queue, completion-status, deployment-evidence and release-readiness ledgers synchronized with exact current versions;
5. implement additional operational issuance components only behind approved decision/evidence stores—never by bypassing release gates.

## External/credential evidence that must remain truthfully labeled

- formal JTA SME/employer validation;
- human technical/curriculum review;
- human assessment review;
- rendered/manual accessibility approval;
- controlled learner/item pilots;
- Practical A–F validation;
- integrated capstone validation;
- evaluator qualification/calibration and inter-rater evidence;
- final credential blueprint weights;
- approved private operational item bank and assessment store;
- equivalent secure-form evidence;
- formal standard setting/final cut scores and critical-failure decision rules;
- approved candidate privacy/retention policy;
- credential issuance workflow/security approval;
- versioned credential issuance authorization where a professional credential is actually issued. Academic publication may use project-owner approval.

No generated text, green CI, synthetic pilot record, or assistant judgment may fabricate external validation, pilot, psychometric, calibration, accreditation, or security evidence. Those evidence states are distinct from project-owner approval to publish academic course content.

## Definition of done

The Technician I machine-build phase is complete when all seven source packages remain green, Courses 2–7 have fresh truthful public deployment evidence, Course 6 mirrors are reconciled, credential security boundaries remain intact, and the only unresolved work requires genuine human/pilot/security/standard-setting/release evidence.
