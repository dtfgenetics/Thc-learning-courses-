# Certification Final Human Review Queue

**Scope:** all 13 conventional canonical Technician finals and their exact current summative item versions.

## Purpose

The repository quality pass is now complete for all conventional finals, but repository item-quality completion is not the same as human assessment approval. This report turns the current final definitions and current item versions into one certification-wide human review queue.

Run:

- `npm run certification:final-human-review`
- `npm run certification:final-human-review:json`
- `npm run certification:final-human-review:check`
- `npm run certification:final-human-review:require-complete`

## Exact-version behavior

The queue looks for `assessment` review records that match both:

- the current object ID; and
- the current object version.

When an item version changes, an approval recorded for the prior version does not satisfy the current review state. The changed object therefore returns to `pending` or `revision-required` until an exact-version review record exists.

The same rule applies to the final assessment definition itself.

## States

- `approved` — the latest exact-version assessment review is approved.
- `pending` — no exact-version assessment review exists.
- `revision-required` — an exact-version assessment review exists but is not approved.

## Check modes

`--check` is safe for CI/pretest. It fails only for structural/provenance defects such as missing finals/items, missing quality-pass markers, broken item counts, or certification-content boundary drift. It does **not** fail just because human review remains pending.

`--require-complete` is intentionally stricter. It exits nonzero until every conventional final definition and every current summative item version has an approved exact-version assessment review. Do not wire this mode into ordinary pretest until the real human review work is complete.

## Review boundary

This report helps organize human assessment review. It does not create or imply:

- content-validity approval;
- fairness/bias approval;
- occupational-validity approval;
- reliability evidence;
- psychometric pilot evidence;
- standard setting or defensible cut scores;
- secure operational credential forms;
- professional credential authorization.

Those remain separate evidence gates.
