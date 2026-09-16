# Course Package Manifest — COURSE-LH-TECH1-002

**Course:** Plant Observation, Growth Stages & Crop Records  
**Package state:** machine package under active construction; human validation open  
**Date:** 2026-09-15

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
| `accessibility/COURSE2-RENDERED-ACCESSIBILITY-UX-REVIEW.md` | prepared / not approved | manual WCAG 2.2 AA and learner-UX review packet |
| `FINAL-HUMAN-REVIEW-WORKLIST.md` | present / gates open | real SME, ID, assessment, practical, accessibility, pilot and release gates |
| `assets/` | present | Course 2 package assets/reference material |

## Source/package checks already supported

- `scripts/audit-tech1-course-package-source.mjs` — shared development-source structure audit for Technician I Courses 2–7.
- `scripts/report-tech1-course-package-readiness.mjs` — cross-course package-signal report added 2026-09-15.
- `docs/TECH1-COURSE-READINESS-MATRIX.md` — cross-course control surface.

## Machine work still required for Course 2

1. Build deterministic item-level objective coverage counts from all 32 dedicated question objects.
2. Complete explicit controlled remediation/reassessment rules rather than relying only on instructor guidance.
3. Complete/validate the Course 2 → Practical A performance crosswalk and assessor package.
4. Verify every public Course 2 asset path and downloadable worksheet through the actual learner-serving runtime.
5. Wire/verify the complete Course 2 learner surface using the canonical lesson objects and registered assets.
6. Run responsive/static/runtime QA appropriate to the project.
7. Generate/verify review queue records against exact source versions.
8. Record release/deployment evidence only after an actual public build exists and fresh anonymous readback succeeds.

## Human/evidence gates that remain open

- subject-matter/technical review;
- instructional-design review;
- assessment-definition/item review;
- Practical A assessor/performance review;
- rendered accessibility/manual UX approval;
- real learner pilot evidence;
- applicable standard-setting/decision-rule approval;
- academic release approval.

No machine artifact may mark these complete on behalf of a reviewer.

## Release boundary

Course 2 remains `draft`. The public-academic course package and the professional Technician I credential are separate states. Completion of this package does not by itself authorize professional credential issuance.
