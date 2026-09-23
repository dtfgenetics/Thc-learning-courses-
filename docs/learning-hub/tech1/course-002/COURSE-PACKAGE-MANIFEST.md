# Course Package Manifest — COURSE-LH-TECH1-002

**Course:** Plant Observation, Growth Stages & Crop Records  
**Package state:** owner-approved published academic package; professional validation and manual accessibility evidence remain open  
**Date:** 2026-09-22

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
- fail-closed completion registry: `registry/course2-completion-status.json`

## Learner/visual source

- visual registry: `visuals/COURSE2-ASSET-REGISTRY.json`
- 10 owner-approved production WebP Course 2 learner assets are registered;
- 7 embedded instructional visuals;
- 3 downloadable practice worksheets;
- public learner source paths live under `apps/web/public/assets/course2/`;
- legacy SVG provenance mirrors are recorded by the visual registry; production WebP Drive mirroring is not yet claimed.

The asset registry remains authoritative for exact asset IDs, lesson/objective mappings, public paths, source paths and Drive mirror IDs.

## Package artifacts now present

| Artifact | Status | Purpose |
|---|---|---|
| `OBJECTIVE-COVERAGE.md` | present | objective → instruction → practice → assessment/performance alignment and open gaps |
| `ASSESSMENT-COVERAGE-REPORT.md` | present | item-level formative/summative objective distribution and assessment-quality boundary |
| `LEARNER-MATERIALS.md` | present | applied learner activities, worksheets, integrated scenario and assessment boundary |
| `EVIDENCE-DOSSIER.md` | present | course-specific source roles, verification notes, claim boundaries and open review work |
| `instructor/INSTRUCTOR-GUIDE.md` | present | facilitation, misconception, remediation and development scoring guidance |
| `instructor/OBJECTIVE-REMEDIATION-MATRIX.md` | present | objective-specific corrective coaching, fresh practice and equivalent reassessment guidance |
| `assessor/PRACTICAL-A-ASSESSOR-GUIDE.md` | present / development | standardized administration, scoring evidence, irregularity, accommodation and remediation guidance without implying validation |
| `assessor/PRACTICAL-A-CALIBRATION-VALIDATION-PACKET.md` | present / evidence pending | controlled plan and blank evidence record for technical review, calibration, pilot, standard setting, fairness and operational approval |
| `accessibility/COURSE2-RENDERED-ACCESSIBILITY-UX-REVIEW.md` | prepared / not approved | manual WCAG 2.2 AA and learner-UX review packet |
| `FINAL-HUMAN-REVIEW-WORKLIST.md` | present / gates open | real SME, ID, assessment, practical, accessibility, pilot and release gates |
| `registry/course2-completion-status.json` | fail-closed control | authoritative distinction between machine-built evidence, remaining machine work and genuine human/evidence gates |
| `COURSE-PACKAGE-MANIFEST.md` | present | controlled package inventory and remaining work |
| `assets/` | present | Course 2 package assets/reference material |

## Source/package checks already supported

- `scripts/audit-tech1-course-package-source.mjs` — shared development-source structure audit for Technician I Courses 2–7.
- `scripts/report-tech1-course-package-readiness.mjs` — cross-course package-signal report.
- `scripts/audit-learning-hub-objective-coverage.mjs` — reusable item-level objective/instruction/practice/assessment/remediation audit; supports strict learning-loop and balanced-assessment modes.
- `scripts/test-course2-practical-crosswalk.mjs` — proves all five Course 2 objectives map to real Practical A tasks, scoring categories, expected evidence and deliverables while validation gates remain open.
- `scripts/test-tech1-course2.mjs` — checks Course 2 package-artifact presence, objective-specific remediation/reassessment sections, item-level formative/summative objective coverage, reference-backed items, applied/analyze summative demand, answer-key balance, Practical A crosswalk, fail-closed completion state and all 10 governed assets through the real Academy HTTP server.
- `scripts/test-course2-visual-registry.mjs` — verifies the governed Course 2 visual registry.
- `apps/web/server.mjs` — learner-asset delivery uses constrained `/assets/course<number>/<raster-file>` routes so governed course asset folders share a consistent runtime contract.
- `.github/workflows/validate.yml` — push/PR quality workflow runs the complete `npm test` suite; `npm test` includes `tech1:course2:test`.
- `docs/TECH1-COURSE-READINESS-MATRIX.md` — cross-course control surface.

## Assessment/objective repository verification

The current Course 2 source contains 32 distinct scored question objects: 12 formative plus 20 summative. All assessed items are required by the deterministic tests to retain evidence references.

Current item-level objective distribution:

| Objective | Formative | Summative | Total |
|---|---:|---:|---:|
| `LO-LH-TECH1-002-01` | 1 | 4 | 5 |
| `LO-LH-TECH1-002-02` | 2 | 4 | 6 |
| `LO-LH-TECH1-002-03` | 4 | 4 | 8 |
| `LO-LH-TECH1-002-04` | 3 | 4 | 7 |
| `LO-LH-TECH1-002-05` | 2 | 4 | 6 |
| **Total** | **12** | **20** | **32** |

Every controlled objective therefore has both formative and summative academic evidence, and the current 20-item summative form is evenly distributed at four items per objective. This proves structural coverage only; human item-quality review, pilot evidence and standard-setting decisions remain open.

## Remaining machine-quality work for Course 2

1. Keep the Course 2 regression and complete repository audit suite green after content changes.
2. Preserve the already verified learner-facing course, lesson and assessment readback/build identity.
3. Perform deployed responsive/manual accessibility and learner-surface QA across supported layouts.
4. Generate or refresh versioned review-queue/packet records when exact source versions change.
5. Expand instructional visuals, examples and learner practice where review identifies a real need.

## Human/evidence gates that remain open

- subject-matter/technical review;
- instructional-design review;
- assessment-definition/item review;
- Practical A technical approval, assessor calibration/inter-rater evidence and performance validation;
- rendered accessibility/manual UX approval;
- real learner/item/practical pilot evidence;
- applicable standard-setting/decision-rule approval;
- professional credential release approval.

No machine artifact may mark these complete on behalf of a reviewer.

## Publication and authority boundary

Course 2's controlled course, dedicated module and dedicated lessons are published for owner-approved academic use. That academic publication must not be interpreted as technical validation, practical validation, credential approval or professional credential issuance. Professional validation and issuance remain governed by the fail-closed credential evidence layer.

## Release boundary

Course 2 is published as academic training material. Completion of this package does not by itself authorize professional credential issuance.
