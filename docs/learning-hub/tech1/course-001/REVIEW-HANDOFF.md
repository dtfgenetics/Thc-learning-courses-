# Course 1 Review and Improvement Handoff

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`  
**State:** public-facing, editable, and under continuous improvement

## Purpose

Course 1 has deterministic curriculum, schema, registry, learner-web, accessibility-regression, and Learning Hub item-bank checks available. These checks help identify structural and mechanical defects while scientific, instructional, assessment, accessibility, and compliance review can continue alongside normal editing and publication.

## Review inventory

At the current Course 1 bank size, the review tooling can organize **166 review tasks** when no prior review notes exist:

| Lane | Current tasks |
|---|---:|
| Lesson scientific review | 18 |
| Lesson editorial review | 18 |
| Assessment-definition review | 7 |
| Formative module-test item review | 84 |
| Summative final-course item review | 36 |
| Integrated performance-assessment review | 1 |
| Course accessibility review | 1 |
| Course legal/compliance review | 1 |
| **Current total** | **166** |

These counts are generated from the current course package and are not review-task ceilings. Adding, replacing, retiring, or reorganizing lessons, items, assessments, or other reviewable objects should change the queue dynamically rather than require the course to stay at a historical count.

These tasks are optional quality-improvement work. No lane blocks another lane, and no task blocks editing or public learner access.

## Generate the optional queue

```bash
npm run review:lh:course1
```

The queue is scoped to Course 1 objects and can be used as a checklist for further improvement.

## Suggested review areas

### Scientific and boundary review

Review the 18 canonical lessons for factual accuracy, source scope, occupational boundaries, and current evidence. Apply corrections directly as they are identified.

### Editorial and instructional review

Review clarity, vocabulary, examples, learner sequence, workload, misconceptions, and consistency across the learner modules. Editorial work may happen before, during, or after scientific review.

### Assessment review

Review the 7 assessment definitions, all 84 current formative items, all 36 final-course items, and the integrated practical. Focus on one-best-answer defensibility, distractor quality, cognitive demand, fairness, occupational authenticity, and objective coverage. The formative bank may continue to expand; review scope should follow the live bank rather than a fixed item count.

### Accessibility review

Review the rendered learner experience, workbook/job aids, practice interactions, assessment presentation, and practical materials for keyboard operation, screen-reader compatibility, zoom/reflow, contrast, readable structure, and equivalent access.

## Review notes

Optional review observations may be stored in `content/reviews/` using `schemas/review-record.schema.json`. Notes are editable metadata and may be revised, replaced, reorganized, or removed as the project evolves.

Review notes do not approve, reject, lock, publish, unpublish, or otherwise control course content.

## Continuous improvement

Learner data, pilot observations, item analysis, assessor calibration, accessibility findings, source updates, and standard-setting work may all be used to improve Course 1 over time. None of these activities prevents the course from remaining public or editable.
