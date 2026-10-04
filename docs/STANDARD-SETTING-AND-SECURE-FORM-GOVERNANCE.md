# Standard Setting and Secure Operational Form Governance

This layer governs the two evidence areas that must remain separate from course publication and machine QA: **passing-standard adoption** and **secure operational form equivalence/security**.

## Standard-setting records

Store only controlled, de-identified study summaries in `content/standard-setting-evidence/`.

Each record is locked to the exact current course and final-assessment versions and captures the standard-setting method, panel size, stable item count, recommended cut score, sensitivity/impact review, and the separate governance decision.

An `approved` record requires an adopted production cut score, an approved minimally-qualified-performance description, and a named decision authority/date. A panel recommendation alone is not approval.

## Secure form-equivalence records

Operational secure item content and private manifests remain outside the public repository. Repository evidence under `content/secure-form-equivalence-evidence/` contains only aggregate metadata and fingerprints.

An approved record requires at least two distinct secure forms, approved-operational private items only, exclusion of public development items, equivalent blueprint/cognitive/critical-content/scored-opportunity coverage, retest-duplication review, private-store verification, answer-material exclusion, exposure tracking, and quarantine workflow support.

Quantitative form-equivalence evidence is tracked explicitly rather than invented. The value may remain `not-yet-available` during development, but final operational approval should document the evidence basis appropriate to the assessment program.

## Commands

- `npm run standard-setting:validate`
- `npm run secure-forms:validate`
- `npm run certification:standard-secure:readiness`

These evidence records feed the certification-wide reconciler. Exact-version mismatches fail closed.
