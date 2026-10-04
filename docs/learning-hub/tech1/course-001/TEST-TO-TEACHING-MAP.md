# Test-to-Teaching Map — COURSE-LH-TECH1-001

**Course:** Safety, Responsible Practice & Cultivation Workflows  
**Assessment:** `ASSESS-LH-TECH1-001-FINAL`  
**Updated:** 2026-09-22

## Rule

Every scored Course 1 objective must be taught and practiced inside the dedicated Course 1 package. The 420 Encyclopedia and external references may support deeper study and source accuracy, but they cannot substitute for required certification instruction.

Course 1 has 12 controlled objectives and 18 canonical lessons. Because this course is larger than the later four-lesson packages, its objective-to-lesson map is **derived directly from the canonical lesson objects** rather than duplicated as a second manually maintained static table.

## Canonical provenance controls

The machine source of truth is:

`scripts/audit-course1-objective-coverage.mjs`

For every `LO-LH-TECH1-001-*` objective, that audit requires:

- at least one canonical `LESSON-LH-TECH1-001-*` lesson that declares the objective;
- applied practice inside mapped teaching;
- Course 1 scored knowledge items mapped to the objective;
- the scored items to be referenced by a Course 1 assessment definition;
- complete corrective coaching, return-to-practice and reassessment guidance.

The audit emits the resolved `instructionLessons`, `practiceLessons`, scored-item counts and remediation state for all 12 objectives. This derived mapping is preferable to a copied static list because it changes automatically when the canonical lesson-objective relationships change.

## Final-assessment boundary

`ASSESS-LH-TECH1-001-FINAL` is explicitly marked:

- `courseDerivedAssessment: true`;
- `encyclopediaSubstitutionAllowed: false`;
- `untaughtMaterialAllowed: false`;
- `teachingProvenanceMode: derived-from-canonical-course-lessons`.

The final remains separate from the secure Technician I professional credential examination.

## Raster stimulus boundary

Course 1 final-test image stimuli use deployed PNG/WebP/JPEG learner assets only. Retired SVG compatibility/provenance files are not valid production assessment stimuli.

## Change control

When a Course 1 objective, lesson, scored item or final-assessment stimulus changes:

1. run `node scripts/audit-course1-objective-coverage.mjs`;
2. run `node scripts/check-course1-final-assessment.mjs`;
3. confirm the changed scored concept is still taught and practiced in Course 1;
4. confirm any image stimulus resolves to a deployed raster learner asset;
5. reopen the relevant human instructional/assessment review for the changed version.

This map documents instructional provenance. It does not claim psychometric validation, standard setting, evaluator calibration, or professional credential release.
