# Course Package Manifest — COURSE-LH-TECH1-002

**Course:** Plant Observation, Growth Stages & Crop Records  
**Package state:** machine package substantially built; human validation and deployment evidence remain open  
**Date:** 2026-09-16

## Canonical source

- `content/courses/COURSE-LH-TECH1-002.json`
- dedicated module: `content/modules/MOD-LH-TECH1-002-OBSERVATION.json`
- dedicated lessons:
  - `content/lessons/LESSON-LH-TECH1-002-01.json`
  - `content/lessons/LESSON-LH-TECH1-002-02.json`
  - `content/lessons/LESSON-LH-TECH1-002-03.json`
  - `content/lessons/LESSON-LH-TECH1-002-04.json`
- controlled objectives: `LO-LH-TECH1-002-01` through `LO-LH-TECH1-002-05`
- formative assessment: `content/assessments/ASSESS-LH-TECH1-002-M01.json`
- summative academic assessment: `content/assessments/ASSESS-LH-TECH1-002-FINAL.json`
- performance mapping: `PRACTICAL-TECH1-A`
- development crosswalk: `registry/course2-practical-a-crosswalk.json`
- crosswalk source test: `scripts/test-course2-practical-crosswalk.mjs`

## Learner/visual source

- visual registry: `visuals/COURSE2-ASSET-REGISTRY.json`
- 10 produced Course 2 learner assets are registered;
- 7 embedded instructional visuals;
- 3 downloadable practice worksheets;
- public learner source paths live under `apps/web/public/assets/course2/`;
- controlled Drive mirror is recorded by the visual registry.

The asset registry remains authoritative for exact asset IDs, lesson/objective mappings, public paths, source paths and Drive mirror IDs.

## Package artifacts now present

| Artifact | Status | Purpose |
|---|---|---|
| `OBJECTIVE-COVERAGE.md` | present | objective → instruction → practice → assessment/performance alignment and open gaps |
| `LEARNER-MATERIALS.md` | present | applied learner activities, worksheets, integrated scenario and assessment boundary |
| `EVIDENCE-DOSSIER.md` | present | course-specific source roles, verification notes, claim boundaries and open review work |
| `instructor/INSTRUCTOR-GUIDE.md` | present | facilitation, misconception, remediation and development scoring guidance |
| `instructor/OBJECTIVE-REMEDIATION-MATRIX.md` | present | objective-specific corrective coaching, fresh practice and equivalent reassessment guidance |
| `assessor/PRACTICAL-A-ASSESSOR-GUIDE.md` | present / development | standardized administration, scoring evidence, irregularity, accommodation and remediation guidance without implying validation |
| `assessor/PRACTICAL-A-CALIBRATION-VALIDATION-PACKET.md` | present / evidence pending | controlled plan and blank evidence record for technical review, calibration, pilot, standard setting, fairness and operational approval |
| `accessibility/COURSE2-RENDERED-ACCESSIBILITY-UX-REVIEW.md` | prepared / not approved | manual WCAG 2.2 AA and learner-UX review packet |
| `FINAL-HUMAN-REVIEW-WORKLIST.md` | present / gates open | real SME, ID, assessment, practical, accessibility, pilot and release gates |
| `COURSE-PACKAGE-MANIFEST.md` | present | controlled package inventory and remaining work |
| `assets/` | present | Course 2 package assets/reference material |

## Source/package checks already supported

- `scripts/audit-tech1-course-package-source.mjs` — shared development-source structure audit for Technician I Courses 2–7.
- `scripts/report-tech1-course-package-readiness.mjs` — cross-course package-signal report.
- `scripts/audit-learning-hub-objective-coverage.mjs` — reusable item-level objective/instruction/practice/assessment/remediation audit; supports strict learning-loop and balanced-assessment modes.
- `scripts/test-course2-practical-crosswalk.mjs` — proves all five Course 2 objectives map to real Practical A tasks, scoring categories, expected evidence and deliverables while validation gates remain open.
- `scripts/test-tech1-course2.mjs` — checks the Course 2 source package and now starts the real Academy HTTP server to verify every produced Course 2 learner SVG is delivered from its controlled `/assets/course2/` path with SVG content type and accessible `<title>`/`<desc>` metadata; it also rejects invalid course directories and missing assets.
- `apps/web/server.mjs` — learner-asset delivery now uses a constrained `/assets/course<number>/<svg-file>` route instead of a Course-1-only route, so future governed course asset folders can use the same runtime contract.
- `.github/workflows/validate.yml` — push/PR quality workflow runs the complete `npm test` suite; `npm test` includes `tech1:course2:test`.
- `docs/TECH1-COURSE-READINESS-MATRIX.md` — cross-course control surface.

## Assessment/objective repository verification

Current Course 2 source contains 32 distinct scored question objects: 12 formative plus 20 summative. Repository inspection on 2026-09-16 found all 32 objects carrying reference fields. Summative coverage is four items for each of the five Course 2 objectives; formative coverage is distributed across all five objectives. The canonical deterministic audit remains `scripts/audit-learning-hub-objective-coverage.mjs` and must continue to pass in strict learning-loop/balanced-assessment mode whenever the bank changes.

## Machine work still required for Course 2

1. Confirm the current CI run passes the updated Course 2 runtime regression and complete repository audit suite.
2. Run/retain the strict objective learning-loop audit after any assessment, objective or remediation change.
3. Verify responsive learner rendering and interaction behavior on the deployed learner surface, not just source files.
4. Generate/verify review queue records against the exact source versions used for human review.
5. Perform fresh anonymous public readback after deployment and record truthful release/deployment evidence.

## Human/evidence gates that remain open

- subject-matter/technical review;
- instructional-design review;
- assessment-definition/item review;
- Practical A technical approval, assessor calibration/inter-rater evidence and performance validation;
- rendered accessibility/manual UX approval;
- real learner pilot evidence;
- applicable standard-setting/decision-rule approval;
- academic release approval.

No machine artifact may mark these complete on behalf of a reviewer.

## Publication and authority boundary

Course 2's learner-facing public-release record may publish academic learner material without changing the controlled course object's `draft` authority state. That public projection must not be interpreted as technical validation, credential approval or professional credential issuance. The controlled package remains authoritative for governance and validation state.

## Release boundary

Course 2 remains `draft` in the controlled course source. Completion of this package does not by itself authorize professional credential issuance.
