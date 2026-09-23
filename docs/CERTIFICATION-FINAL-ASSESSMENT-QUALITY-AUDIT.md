# Certification Final-Assessment Quality Audit

**Scope:** the 13 conventional canonical Technician course finals. Technician I Course 7 and Technician II Course 8 are intentionally excluded because they use integrated readiness/performance pathways rather than redundant conventional finals.

## Purpose

This audit adds a review-prioritization layer on top of the existing Learning Hub item-quality gate. It is designed to help reviewers find course finals that may deserve closer attention for scenario realism, cognitive demand, rationale depth, distractor cueing, or objective balance.

The heuristics are **not** validity decisions and are not content quotas.

## Current quality-pass status

All **13 conventional canonical Technician finals** have now completed the repository item-quality pass. Twelve finals contain explicit `itemQualityRevision` metadata after targeted or full item revisions, while Technician I Course 3 contains an `itemQualityReview` marker documenting a full 20/20 review with no item rewrite required. This is a machine-audited content-quality state, **not** human assessment approval or psychometric validation.

Coverage is enforced by:

- `npm run certification:final-quality:coverage`;
- `npm run certification:final-quality:coverage:json`;
- `npm run certification:final-quality:coverage:check`.

Run:

- `npm run certification:final-quality` — human-readable table;
- `npm run certification:final-quality:json` — machine-readable detail including flagged item IDs;
- `npm run certification:final-quality:check` — fail only on structural/provenance defects.

## Structural/provenance failures

The `--check` mode fails when a canonical conventional final has any of the following:

- missing final assessment;
- duplicate listed final item IDs;
- an objective with zero final items;
- `totalItems` that disagrees with the actual item list;
- missing explicit course-derived assessment provenance;
- Encyclopedia substitution not explicitly forbidden;
- untaught scored material not explicitly forbidden.

These are hard defects because they break the controlled certification-course assessment boundary.

## Review-priority heuristics

The report may flag a final for human review when it detects:

- scenario/case-study share below 50%;
- higher-order Bloom share below 75%;
- fewer than 25% of rationales reaching 60 words;
- more than 15% of items with cueing-review signals;
- objective item-count spread greater than 2.

These thresholds are review triggers only. A short rationale can be excellent. A direct knowledge item can be appropriate. An objective may legitimately receive more weight when the controlled blueprint supports it.

## Cueing-review signals

The report surfaces items for review when it detects potentially relevant mechanical cues such as:

- absolute/cueing wording in the stem;
- `all of the above` / `none of the above`;
- one or more choices whose word-count spread is at least 2.5× across the option set.

A flagged item should be inspected in context. Do not rewrite a defensible item merely to make option lengths identical.

## Relationship to the existing item-quality gate

`scripts/check-learning-hub-item-quality.mjs` remains the broader structural item-bank gate for all Learning Hub assessment objects. It already checks duplicate/near-duplicate stems, reference/objective/competency integrity, thin stems/rationales, duplicate choices, keyed-answer validity, and other mechanical issues.

The certification-final audit is narrower: it focuses on the 13 conventional Technician finals and produces a course-level review-priority picture. `check-certification-final-quality-coverage.mjs` separately verifies that every conventional final has an explicit quality-review/revision marker, that revised-plus-preserved item counts reconcile to `totalItems`, and that human review and professional-validation boundaries remain fail-closed.

## Assessment boundary

The audit does not establish:

- content validity;
- fairness or absence of bias;
- occupational authenticity;
- reliability;
- form equivalence;
- defensible cut scores;
- psychometric performance;
- practical/capstone validity;
- professional credential authorization.

Those require qualified human assessment review and real pilot/validation evidence.
