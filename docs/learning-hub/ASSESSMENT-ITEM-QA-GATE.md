# Learning Hub Assessment Item QA Gate

## Purpose

This gate removes mechanical item-bank defects before a qualified human assessment reviewer evaluates validity, fairness, relevance, distractor quality, and occupational authenticity.

The gate applies to dedicated Learning Hub objects using `ASSESS-LH-*` and `ITEM-LH-*` IDs. It does **not** approve an item for production use.

## Automated failures

The checker fails when it finds:

- a Learning Hub bank without its matching course object;
- an orphaned item not assigned to a course assessment;
- an item assigned to more than one course assessment unintentionally;
- duplicate assessment item IDs;
- missing competency, objective, or controlled-reference IDs;
- an objective mapped outside the course ID family;
- exact duplicate stems after normalization;
- high-confidence near-duplicate stems when both stems are sufficiently long, similarly sized, and reach at least 0.90 token-bigram Dice similarity;
- duplicate answer choices after normalization;
- invalid keyed-answer indexes;
- overly short stems or rationales that are not review-ready;
- assessment `totalItems` values that disagree with listed item IDs;
- a Course 1 bank that falls below its controlled minimum baseline of 7 assessment definitions / 72 formative items / 36 summative items / 108 total items.

Near-duplicate detection is intentionally conservative. It compares normalized token bigrams only when both stems contain at least 10 tokens and 60 normalized characters and their token counts are within 80% of each other. This is designed to catch lightly rewritten copies while avoiding ordinary vocabulary overlap between questions on the same topic.

The minimum baseline is a quality floor, **not a content ceiling**. Course 1 currently exceeds that floor with 84 formative items and 36 summative items (120 public knowledge items total). Additional valid items may be added without changing the QA architecture.

## Human-review warnings

The checker reports but does not automatically reject:

- `all of the above` / `none of the above` patterns;
- absolute/cueing terms such as *always* or *never*;
- thin objective coverage;
- source-bank correct-answer position distribution.

Source-bank answer position is not a learner presentation rule. The Academy delivery layer shuffles formative choices and remaps the key, and summative assessment definitions can require choice randomization. Human review must still evaluate whether distractors are plausible and whether any wording gives away the keyed response.

## Human review remains mandatory

Passing this gate does not establish:

- content validity;
- reliability;
- absence of bias;
- appropriate cognitive demand;
- occupational/job-task authenticity;
- defensible cut scores;
- psychometric performance.

Those require technical/assessment review and pilot evidence.
