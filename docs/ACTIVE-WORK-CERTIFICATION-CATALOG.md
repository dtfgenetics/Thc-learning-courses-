# Active Work — Certification Catalog Visibility

Branch: `feat/certification-catalog-visibility`

## Objective

Expose the canonical two foundational certificates and eight professional credentials in the public Learning Hub catalog with truthful readiness labels, while preserving the distinction between public academic course availability and credential release.

## Work completed

- Added `registry/credential-public-status.json`.
- Added `docs/CERTIFICATION-CATALOG-PUBLICATION-CONTRACT.md`.
- Linked the work to public discoverability issue #329.

## Remaining in this work block

- Wire catalog UI to canonical readiness data.
- Ensure Course 1 remains the only currently available public academic course link unless additional course publication is verified.
- Add deterministic validation that all 10 offerings are represented and no draft credential can render as released.
- Verify build/routes and record the resulting commit/PR state.
