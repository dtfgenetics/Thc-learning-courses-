# Course 1 Controlled Human Review Handoff

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`  
**State:** build-side complete; formal human review and pilot gates open

## Why this handoff exists

Course 1 has passed deterministic curriculum, schema, registry, learner-web, accessibility-regression, and Learning Hub item-bank checks. Those checks remove structural/mechanical defects; they do not replace qualified review of scientific accuracy, instructional clarity, assessment validity, accessibility, or legal/compliance boundaries.

## Controlled review inventory

When there are no prior Course 1 review records, the course-scoped queue contains **154 tasks**:

| Lane | Tasks |
|---|---:|
| Lesson scientific review | 18 |
| Lesson editorial review | 18 |
| Assessment-definition review | 7 |
| Formative module-test item review | 72 |
| Summative final-course item review | 36 |
| Integrated performance-assessment review | 1 |
| Course accessibility review | 1 |
| Course legal/compliance review | 1 |
| **Total** | **154** |

Editorial lesson review is intentionally blocked until scientific review of that exact lesson version is approved.

## Generate the queue

```bash
npm run review:lh:course1
npm run review:lh:course1:check
```

The queue is generated only from Course 1 objects. It does not mix Course 1 summative items with secure THC Cultivation Technician I credential-exam items.

## Recommended review order

### Phase 1 — scientific and boundary review

1. Review the 18 canonical lessons for factual accuracy and source scope.
2. Complete the course legal/compliance review, focusing on occupational-safety, pesticide, access-control, equipment-authority, recordkeeping, and jurisdiction-neutral traceability boundaries.
3. Request corrections before proceeding when the evidence or role boundary is wrong.

### Phase 2 — editorial/instructional review

After each lesson's scientific approval, review clarity, vocabulary, examples, learner sequence, workload, misconceptions, and whether the expanded learner module preserves the approved scientific meaning.

### Phase 3 — assessment review

1. Review the 7 assessment definitions.
2. Review all 72 formative items.
3. Review all 36 final course-test items.
4. Review `PRACTICAL-LH-TECH1-001-WORKFLOW`, both candidate forms, the assessor guide, and the critical-error rules.
5. Mechanical QA passing does not approve an item; reviewers still judge one-best-answer defensibility, distractor quality, cognitive demand, fairness, and occupational authenticity.

### Phase 4 — accessibility review

Review the rendered learner experience, workbook/job aids, practice interactions, assessment presentation, and practical materials using the Course 1 review packet. Manual keyboard, screen-reader, zoom/reflow, contrast, and accommodation checks remain required.

## Recording real reviews

Review outcomes must use immutable version-specific records in `content/reviews/` conforming to `schemas/review-record.schema.json`. Use real reviewer IDs and timestamps. Valid results are `approved`, `changes-requested`, or `rejected`.

Do not pre-create approval records. If an object changes after review, the changed version requires a new review record.

## After review

Human review completion does not by itself make the course production-ready. Remaining gates include practical assessor calibration, controlled learner pilot evidence, assessment-item behavior analysis, standard-setting/cut-score review, correction of pilot findings, and a final versioned release approval.
