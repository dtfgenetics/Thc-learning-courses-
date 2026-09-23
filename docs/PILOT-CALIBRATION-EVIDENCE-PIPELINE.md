# Pilot and Practical Calibration Evidence Pipeline

## Purpose

This pipeline turns private, participant-level pilot and assessor-calibration results into de-identified aggregate evidence that can be stored in the certification repository.

It does not manufacture pilot evidence. Real response/scoring data must come from actual pilot or calibration activity.

## Knowledge-item pilot aggregation

Private input is supplied to:

`npm run pilot:aggregate -- --input <private-results.json> [--complete] [--write]`

Each response record includes:

- pseudonymous `participantId`
- exact `itemId` and `itemVersion`
- `correct`
- selected choice / omission
- response time
- normalized `totalScore`
- optional normalized `restScore`
- optional response-time anomaly flag

When `restScore` is supplied for every response to an item, discrimination is calculated as **point-biserial item-rest correlation**. This is preferred because correlating the item with a total score that includes that same item can inflate the relationship. If item-rest score is unavailable, the existing total-score point-biserial is retained and labeled explicitly.

Only aggregate evidence is written to `content/pilot-evidence/`. Participant-level responses stay outside the public repository.

## Practical / capstone assessor calibration

Private paired ratings are supplied to:

`npm run calibration:aggregate -- --input <private-paired-ratings.json> [--complete] [--write]`

Required input fields:

- `assessmentId`
- exact `assessmentVersion`
- `calibrationId`
- `analystId`
- `ratings[]`

Each rating records a common `sampleId`, `assessorId`, total score, domain scores, and critical-error decision. At least one sample must be independently scored by at least two assessors.

The aggregator computes:

- number of samples, assessors, and assessor-pair comparisons
- exact total-score agreement
- mean absolute total-score difference
- critical-error agreement
- unresolved critical-error disagreement count
- per-domain exact agreement
- per-domain mean absolute score difference

The resulting de-identified record is stored under `content/calibration-evidence/` only when `--write` is used.

## Validation

Run:

- `npm run pilot:validate`
- `npm run calibration:validate`
- `npm run calibration:readiness`
- `npm run schema:validate`

Calibration evidence is version-locked to the current practical/capstone object. Evidence from an older rubric/assessment version cannot silently satisfy the current version.

## Interpretation boundary

Agreement statistics are calibration evidence, not automatic authorization. A high agreement value does not prove construct validity, fairness, occupational validity, or defensible certification use.

Any disagreement on a critical-error decision must be reviewed and resolved by the designated human authority before operational use. Changes to rubric wording, scoring anchors, task conditions, or critical-error definitions require version control and may require renewed calibration.
