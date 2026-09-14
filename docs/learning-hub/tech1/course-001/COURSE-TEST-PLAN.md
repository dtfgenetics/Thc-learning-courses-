# Course Test Plan — COURSE-LH-TECH1-001

## Assessment layers

1. **Lesson formative practice** — low-stakes learning practice embedded directly in canonical lesson rich blocks (scenario, activity, comparison, document, steps, remediation and related guided-practice structures).
2. **Six module tests** — currently 14 items each, immediate feedback, **84 formative items total**.
3. **Integrated course practical** — performance evidence across the workflow.
4. **Final course test** — 36-item summative development form mapped to all 12 course objectives.
5. **THC Cultivation Technician I credential examination** — separate secure assessment outside this public course package.

## Lesson-practice model

Course 1 lesson files already contain objective-aligned scenario and activity practice inside the instructional content. The optional `lesson.assessment` field in `schemas/lesson.schema.json` is a pointer to a dedicated assessment object. A `null` value therefore does **not** mean the lesson lacks formative practice.

Do not duplicate module-bank questions into a separate lesson bank merely to populate that pointer. Create a dedicated lesson assessment object only when it adds distinct instructional value beyond the embedded practice.

The machine-readable relationship between all 18 canonical lessons, their embedded practice and their cumulative module assessment is recorded in:

`docs/learning-hub/tech1/course-001/COURSE1-LESSON-PRACTICE-MAP.json`

This preserves a clean assessment hierarchy:

`lesson instruction + embedded practice -> module formative assessment -> integrated practical + course final -> separate credential assessment`

## Module-test intent

The six module tests emphasize application and routine workplace decisions rather than trivia. Distractors represent realistic errors: working around hazards, using memory instead of current instructions, crossing contamination boundaries, forcing inventory reconciliation, unauthorized repair, and rewriting records.

The expanded v1.2-aligned formative bank also samples dynamic hazard reassessment, pesticide-entry status, source-route-receiver contamination reasoning, stacked quarantine/hold/REI controls, instruction and identity conflicts, alternate escalation, split/merge genealogy, physical-versus-record disposition mismatch, stored-energy cues, recurring-fault timelines, late-entry integrity, and closed-loop handoff.

## Feedback rule

Embedded lesson practice may provide immediate instructional feedback and remediation cues. Module tests return rationale-based feedback after response/submission so they function as learning tools. Final course-test feedback is domain-level rather than an exposed answer key. The separate credential exam must not reuse the public course bank verbatim.

## Passing-score status

The current schema requires numeric percentages. Any 80% value in draft/module/final course assessments is a developmental threshold for the academic course, not an independently validated professional-certification cut score. Pilot results and standard-setting review should inform later operational credential thresholds.

## Review gates

Every credential-bearing or scored test item requires objective/competency alignment, source support, one defensible best answer, plausible distractors, accessible wording/presentation, bias/sensitivity review where relevant, and human assessment review before production credential use.

The current module-test counts describe the live bank; they are not maximums. Valid items may be added, revised, replaced, reorganized, or retired as the course changes. QA checks bank integrity and minimum quality floors rather than enforcing a fixed ceiling.
