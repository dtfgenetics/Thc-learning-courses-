# Course Package Manifest — COURSE-LH-TECH1-007

**Course:** Integrated Cultivation Technician Practice Lab  
**Profile:** integrated performance / capstone course  
**Package state:** machine governance package substantially complete; public route readback verified; exact build identity, responsive/manual QA and validation/release evidence open  
**Date:** 2026-09-18

## Canonical source

- `content/courses/COURSE-LH-TECH1-007.json`
- dedicated module: `content/modules/MOD-LH-TECH1-007-LAB.json`
- four integrated lessons: `LESSON-LH-TECH1-007-01` through `LESSON-LH-TECH1-007-04`
- six integrated objectives: `LO-LH-TECH1-007-01` through `LO-LH-TECH1-007-06`
- formative readiness assessment: `content/assessments/ASSESS-LH-TECH1-007-M01.json`
- integrated lab plan: `registry/technician-i-integrated-lab-plan.json`
- practicals: A–F under `docs/academy-v2/practicals/`
- capstone: `CAPSTONE-TECH1-SHIFT-001`

## Assessment profile

Course 7 intentionally has `finalAssessment: null`. It does not need a conventional course-final exam because its credential-relevant profile is integrated performance.

Machine expectations:

- 12-item readiness assessment remains formative;
- readiness items never become `purpose: credential`;
- all six practical definitions resolve;
- each practical remains a 100-point development blueprint with current target 80;
- capstone remains a 200-point development blueprint with current target 160;
- critical-failure rules, form-security controls and evaluator controls remain explicit;
- secure/live credential form approval remains false until real release evidence exists.

## Package artifacts

| Artifact | State |
|---|---|
| `OBJECTIVE-PERFORMANCE-CROSSWALK.md` | present |
| `INTEGRATED-LAB-LEARNER-PACKET.md` | present |
| `INTEGRATED-EVIDENCE-DOSSIER.md` | present |
| `REMEDIATION-RETEST-MATRIX.md` | present |
| `assessor/CAPSTONE-ASSESSOR-GUIDE.md` | present |
| `assessor/CAPSTONE-CALIBRATION-VALIDATION-PACKET.md` | present / evidence open |
| `CANDIDATE-EVIDENCE-RETENTION-PRIVACY-DRAFT.md` | present / governance approval open |
| `accessibility/COURSE7-INTEGRATED-LAB-ACCESSIBILITY-UX-REVIEW.md` | prepared / not approved |
| `FINAL-HUMAN-REVIEW-WORKLIST.md` | present / gates open |
| `COURSE-PACKAGE-MANIFEST.md` | present |

## Controlled critical-failure rules

The integrated lab plan currently defines five development critical failures that block acceptance of affected credential evidence pending remediation/reevaluation:

- safety;
- identity/genealogy;
- data integrity;
- authority boundary;
- active hold/release.

The final validity and operation of these rules remain subject to human review, pilot evidence and credential decision-rule approval.

## Security controls

- secure credential forms public: false;
- live credential form approved: false;
- credential-mode hints allowed: false;
- equivalent forms required;
- pilot double-scoring required;
- candidate evidence retention/privacy approval required.

## Machine-complete definition for Course 7

Course 7 machine work is complete when:

1. source graph resolves;
2. readiness bank resolves and remains formative;
3. all six practical definitions resolve;
4. capstone blueprint resolves to 200 points;
5. critical-failure/form/evaluator/retest controls resolve;
6. package artifacts above exist;
7. capstone source language matches controlled critical-failure governance;
8. candidate-evidence privacy/retention draft exists;
9. secure credential mode remains fail-closed;
10. deterministic tests enforce these boundaries.

## Remaining machine work

- confirm CI passes the shared Courses 3–7 learner-runtime regression and versioned Course 7 review-queue check;
- complete deployed responsive/manual integrated-lab QA;
- record the exact deployment build/source SHA for the already verified public course, lesson and readiness-check routes;
- preserve fail-closed secure credential-form boundaries while correcting any learner-surface defects.

## Human/evidence gates still open

- technical/occupational review;
- instructional/assessment review;
- practical validation A–F;
- capstone validation;
- evaluator calibration/inter-rater evidence;
- controlled pilot evidence;
- form-equivalence evidence;
- accessibility/accommodation approval;
- standard setting/decision-rule approval;
- privacy/security/retention approval;
- secure-form approval;
- final program release approval.

## Credential boundary

A machine-complete Course 7 package is not a validated professional credential. Issuance must remain disabled until the program-level release gates are actually approved.
