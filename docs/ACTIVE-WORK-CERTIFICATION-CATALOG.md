# Active Work — Certification Catalog Visibility

**Status:** completed / superseded as the active work block on 2026-09-15  
**Superseded by:** `docs/ACTIVE-WORK-TECHNICIAN-I-COMPLETION.md`

## Objective

Expose the canonical two foundational certificates and eight professional credentials in the public Learning Hub catalog with truthful readiness labels, while preserving the distinction between public academic course availability and credential release.

## Completed

- Added `registry/credential-public-status.json` as the canonical public-readiness projection.
- Added `registry/catalog-build-target.json` and `registry/catalog-sections.json`.
- Added `docs/CERTIFICATION-CATALOG-PUBLICATION-CONTRACT.md`.
- Added `docs/CERTIFICATION-COMPLETION-MATRIX.md`.
- Added `registry/course1-completion-target.json` and `registry/course1-completion-status.json`.
- Exposed all 10 offerings directly in the learner-facing Academy catalog.
- Preserved truthful readiness/issuance boundaries; no unfinished professional credential is represented as issuable.
- Published Course 1 as the current public academic course entry point.
- Added fail-closed deterministic catalog/readiness tests and dedicated catalog CI.
- Completed and deployed the canonical Course 1 public SVG teaching-visual baseline: all 18 lessons resolve reviewed canonical visuals, with 19 placements across 14 unique produced public assets.
- Verified the public Course 1 package and catalog through DTFSeeds production run `34988643494` (#44), site SHA `7cffef779ee5ab3fe4249ea9b8428521e703db27`.
- Completed the remaining Course 1 machine-resolvable finish work in certification-repository merge `514228a9f6c489d076317cd74e54c36b646e55b2`:
  - authoritative human-review worklist;
  - dynamic review-queue completeness checks;
  - objective → instruction → practice → scored assessment → remediation/reassessment audit;
  - WCAG 2.2 AA rendered accessibility/manual UX review packet;
  - fail-closed Course 1 finish CI;
  - explicit `machineResolvableWorkComplete: true` while human gates remain open.

## Current boundary

Catalog visibility and Course 1 machine preparation are complete. Course 1 is **not** finally human-approved and Technician I is **not** releasable as a professional credential. Real technical/editorial/assessment/accessibility/legal review, practical calibration/equivalence, controlled pilot evidence, formal standard setting and versioned approval remain real human gates.

That next build block has now advanced: all seven Technician I source packages satisfy the machine source-package contract. Current work is source reconciliation, exact deployment/readback evidence, raster production-asset replacement, versioned human review, controlled pilot/practical/calibration evidence, standard setting, credential governance/security approval, and final release verification.
