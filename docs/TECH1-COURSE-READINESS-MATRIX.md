# Technician I Course Readiness Matrix

**Program:** `CREDPROG-CULT-TECH-I-001 — THC Cultivation Technician I`  
**Audit date:** 2026-09-17  
**Package contract:** `docs/LEARNING-HUB-COURSE-PACKAGE-CONTRACT.md`  
**Machine reporter:** `scripts/report-tech1-course-package-readiness.mjs`  
**Credential machine registry:** `registry/technician-i-machine-layer.json`

## Current control state

All seven Technician I **source packages satisfy the machine source-package contract**. This is enforced by the program/package validation layer. Professional credential issuance remains blocked: machine completion is not human validation, pilot evidence, standard setting, security approval or release approval.

## Course readiness

| Course | Source/package state | Assessment/performance state | Learner assets | Remaining machine deployment work | Human/release gates |
|---|---|---|---|---|---|
| `COURSE-LH-TECH1-001` — Safety, Responsible Practice & Cultivation Workflows | Reference implementation; machine-resolvable package work complete | Published academic package + integrated practical | Full governed learner/instructor visual layer | Preserve verified public release evidence | Human credential validation remains open |
| `COURSE-LH-TECH1-002` — Plant Observation, Growth Stages & Crop Records | Source package complete; controlled course remains `draft`; fail-closed completion registry added | 12 formative items distributed 1/2/4/3/2 across objectives; 20 summative items exactly 4/objective; Practical A crosswalk + canonical assessor/calibration-validation packet | 10 governed assets; runtime delivery test covers all assets | CI confirmation; learner route/navigation/practice/assessment workflow QA; versioned review queue; fresh deployed responsive QA/readback and deployment evidence | technical/assessment/accessibility/practical/calibration/pilot/standard-setting/release approval open |
| `COURSE-LH-TECH1-003` — Environmental, Light & Sensor Fundamentals | Source package complete; `draft` | 12 formative + 20 summative; Practical A mapping | 6 governed/mirrored assets | deployed responsive QA/readback + deployment evidence | human/pilot/release gates open |
| `COURSE-LH-TECH1-004` — Water, Root Zone, Nutrition & Irrigation Fundamentals | Source package complete; `draft` | 12 formative + 24 summative with 2 formative + 4 summative per objective; Practical B | 7 governed assets | deployed responsive QA/readback + deployment evidence | human/practical/pilot/release gates open |
| `COURSE-LH-TECH1-005` — Propagation, Canopy, IPM Scouting & Crop Care | Source package complete; `draft` | 12 formative + 24 summative; Practicals C/D/E | 9 governed assets | deployed responsive QA/readback + deployment evidence | human/practical/pilot/release gates open; no pesticide/treatment authority |
| `COURSE-LH-TECH1-006` — Harvest, Postharvest, Traceability & Shift Handoff | Source package complete; `draft` v0.4.0 | 12 formative + 24 summative; Practical F | 8 learner-reachable repo assets; Course 6 Drive folder exists | individual Drive mirrors still pending; deployed responsive QA/readback + deployment evidence | human/practical/pilot/release gates open; no product-release authority |
| `COURSE-LH-TECH1-007` — Integrated Cultivation Technician Practice Lab | Integrated source package complete; `draft` | 12-item readiness bank (2 per objective), Practicals A–F, 200-point capstone; ordinary final intentionally `null` | governed reuse manifest across Courses 2–6 | deployed integrated-lab QA/readback + deployment evidence | practical/capstone validation, calibration/inter-rater, standard setting, privacy/security and release approval open |

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

1. finish Course 2 learner-route/navigation/practice/assessment runtime verification and then reuse the same deployment QA pattern for Courses 3–7;
2. generate fresh deployed responsive/manual learner-surface QA evidence for Courses 2–7;
3. perform anonymous public readback and record exact deployment build/SHA/routes only after successful deployment;
4. finish Course 6 individual Drive mirrors and update its asset registry with real file IDs only after successful uploads;
5. keep CI/release-readiness/status ledgers synchronized with exact current versions;
6. implement additional operational issuance components only behind approved decision/evidence stores—never by bypassing release gates.

## Human/evidence blockers that must remain open

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
- explicit final program release approval.

No generated text, green CI, synthetic pilot record, or assistant judgment may close those gates.

## Definition of done

The Technician I machine-build phase is complete when all seven source packages remain green, Courses 2–7 have fresh truthful public deployment evidence, Course 6 mirrors are reconciled, credential security boundaries remain intact, and the only unresolved work requires genuine human/pilot/security/standard-setting/release evidence.
