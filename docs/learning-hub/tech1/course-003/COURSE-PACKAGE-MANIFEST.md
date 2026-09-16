# Course Package Manifest — COURSE-LH-TECH1-003

**Course:** Environmental, Light & Sensor Fundamentals  
**Package state:** machine package under active completion; human validation and deployment evidence remain open  
**Date:** 2026-09-16

## Canonical source

- `content/courses/COURSE-LH-TECH1-003.json`
- dedicated module: `content/modules/MOD-LH-TECH1-003-MONITORING.json`
- dedicated lessons:
  - `content/lessons/LESSON-LH-TECH1-003-01.json`
  - `content/lessons/LESSON-LH-TECH1-003-02.json`
  - `content/lessons/LESSON-LH-TECH1-003-03.json`
  - `content/lessons/LESSON-LH-TECH1-003-04.json`
- controlled objectives: `LO-LH-TECH1-003-01` through `LO-LH-TECH1-003-05`
- formative assessment: `content/assessments/ASSESS-LH-TECH1-003-M01.json`
- summative academic assessment: `content/assessments/ASSESS-LH-TECH1-003-FINAL.json`
- performance mapping: `PRACTICAL-TECH1-A`
- development crosswalk: `registry/course3-practical-a-crosswalk.json`

## Learner/visual source

- visual registry: `visuals/COURSE3-ASSET-REGISTRY.json`
- six produced Course 3 learner assets are registered;
- four embedded instructional visuals;
- two downloadable practice worksheets;
- learner paths live under `/assets/course3/`;
- source files live under `apps/web/public/assets/course3/`;
- controlled Google Drive mirror records are stored in the registry.

The crosswalk readiness metadata was corrected on 2026-09-16 to reflect the already-existing learner asset layer instead of incorrectly reporting it as unbuilt.

## Current package artifacts

| Artifact | Status | Purpose |
|---|---|---|
| `OBJECTIVE-COVERAGE.md` | present | objective → instruction → practice → assessment → remediation/performance alignment |
| `LEARNER-MATERIALS.md` | present | applied learner activities, practice-sheet use and integrated Course 3 scenario |
| `EVIDENCE-DOSSIER.md` | present | source roles, claim boundaries and human evidence-review scope |
| `instructor/INSTRUCTOR-GUIDE.md` | present | facilitation, misconceptions, assessment use and course boundaries |
| `instructor/OBJECTIVE-REMEDIATION-MATRIX.md` | present | objective-specific corrective coaching, fresh practice and equivalent reassessment |
| `accessibility/COURSE3-RENDERED-ACCESSIBILITY-UX-REVIEW.md` | prepared / not approved | rendered WCAG 2.2 AA and learner-UX review packet |
| `FINAL-HUMAN-REVIEW-WORKLIST.md` | present / gates open | technical, instructional, assessment, practical, visual, accessibility, pilot and release work |
| `COURSE-PACKAGE-MANIFEST.md` | present | package control surface |
| `assets/` | present | course package asset/reference material |

## Assessment/objective repository verification

Current Course 3 source contains 32 distinct scored question objects: 12 formative plus 20 summative. Repository inspection on 2026-09-16 found formative objective coverage of **2 / 2 / 3 / 2 / 3** across objectives 01–05 and no Course 3 question objects with an empty `references` array. The existing Course 3 test requires at least four summative items for every objective, at least 18 of 20 final items at apply/analyze/evaluate/create level, and a balanced answer-key distribution.

The canonical strict learning-loop command is:

```bash
node scripts/audit-learning-hub-objective-coverage.mjs --course=COURSE-LH-TECH1-003 --require-complete-learning-loop --require-balanced-assessment
```

## Practical A support boundary

Course 3 reuses the shared Practical A performance task; it does not create a conflicting second practical. `registry/course3-practical-a-crosswalk.json` maps all five objectives to real Practical A tasks, scoring categories, expected evidence and deliverables. The shared Practical A assessor/validation development package created for the Technician I pathway may be used as the administration/calibration framework, but Course 3 human reviewers must still confirm that its environmental/light/sensor mappings are appropriate.

Practical A remains development work. Mapping is not calibration, inter-rater evidence, pilot evidence, validated standard setting or credential approval.

## Runtime delivery contract

`apps/web/server.mjs` now uses a constrained generic learner-asset route for `/assets/course<number>/<svg-file>`, so Course 3 uses the same runtime contract as Course 2 rather than needing a special-case route. Course 3's production test must verify every produced registry asset through the real Academy HTTP handler before the machine package is considered complete.

## Machine work still required

1. Extend `scripts/test-tech1-course3.mjs` to verify every produced Course 3 asset through the actual Academy runtime, including accessible SVG metadata.
2. Add the strict Course 3 learning-loop/balanced-assessment command to CI after the current package/remediation source is committed.
3. Confirm the complete repository test/quality workflow passes on the final Course 3 source.
4. Perform responsive rendered QA on the deployed learner surface.
5. Generate/verify review queue records against exact source versions.
6. Record truthful deployment evidence only after fresh anonymous public readback succeeds.

## Human/evidence gates that remain open

- subject-matter/technical review;
- instructional-design review;
- assessment-definition/item review;
- Practical A evaluator calibration and performance validation;
- visual technical review;
- rendered accessibility/manual UX approval;
- real learner pilot evidence;
- applicable standard-setting/decision-rule approval;
- academic release approval.

No machine artifact may mark these complete on behalf of a reviewer.

## Release boundary

Course 3 remains `draft`. Completion of this package can advance machine readiness, but it does not authorize professional Technician I credential issuance.
