# Active Work — Certification Catalog Visibility

Branch: `feat/certification-catalog-visibility`  
Pull request: `#409`

## Objective

Expose the canonical two foundational certificates and eight professional credentials in the public Learning Hub catalog with truthful readiness labels, while preserving the distinction between public academic course availability and credential release.

## Work completed in this block

- Added `registry/credential-public-status.json` as the canonical public-readiness projection.
- Added `registry/catalog-build-target.json` and `registry/catalog-sections.json`.
- Added `docs/CERTIFICATION-CATALOG-PUBLICATION-CONTRACT.md`.
- Added `docs/CERTIFICATION-COMPLETION-MATRIX.md`.
- Added `registry/course1-completion-target.json` and `registry/course1-completion-status.json`.
- Added `docs/COURSE1-FINISH-SEQUENCE.md`.
- Exposed all 10 offerings directly in the learner-facing Academy UI.
- Labeled Technician I and Technician II as **In development**.
- Labeled the six specialist/lead pathways as **Planned**.
- Kept both foundational certificates visible but not issuable.
- Kept Course 1 as the only currently available public academic course entry point.
- Added fail-closed deterministic catalog/readiness tests.
- Added a Course 1 objective-coverage audit across controlled objectives, canonical lessons and public scored knowledge items.
- Added a dedicated certification-catalog CI workflow.
- Linked work to public discoverability issue #329.

## Current verification state

The dedicated certification catalog workflow has already passed on an earlier head in this PR. The latest head adds the Course 1 objective-coverage audit and is being revalidated by GitHub Actions together with the Technician I and Academy staging checks.

## Remaining in this work block

- Confirm the latest CI head passes all relevant checks.
- Promote the PR through the controlled branch sequence when green.
- Verify the deployed public route after promotion and record the exact deployed SHA/route.
- Continue Course 1 machine-resolvable completion work: visual public-path QA, review-queue completeness, objective/practice/assessment/remediation alignment, and accessibility/manual-review preparation.

## Release boundary

Catalog visibility does not authorize credential issuance. No professional credential in the current catalog is marked issuance-available.
