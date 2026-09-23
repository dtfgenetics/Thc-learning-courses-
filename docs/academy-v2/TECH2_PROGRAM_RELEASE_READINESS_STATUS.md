# Technician II Program Release-Readiness Status

**Program:** `CREDPROG-CULT-TECH-II-001 — THC Cultivation Technician II`  
**Status date:** 2026-09-22

## Current interpretation

**Eight-course academic curriculum:** aligned under the dedicated certification-course model.  
**Assessment provenance:** all conventional Course 1–7 finals are explicitly course-derived; Course 8 uses a formative readiness check plus practical/capstone provenance instead of an artificial ordinary final.  
**Primary visual layer:** 36/36 owner-approved lossless WebP visuals are wired to the canonical raster manifest.  
**Credential machine/control layer:** structurally built and fail-closed.  
**Professional credential issuance:** **BLOCKED** pending real validation/release evidence.

Green CI and complete academic course files prove repository consistency; they do not authorize a professional credential.

## Academic curriculum state

The eight canonical Technician II courses are:

1. `COURSE-LH-TECH2-001`
2. `COURSE-LH-TECH2-002`
3. `COURSE-LH-TECH2-003`
4. `COURSE-LH-TECH2-004`
5. `COURSE-LH-TECH2-005`
6. `COURSE-LH-TECH2-006`
7. `COURSE-LH-TECH2-007`
8. `COURSE-LH-TECH2-008`

Courses 1–7 have dedicated course finals whose scored objectives resolve to dedicated Technician II lessons. Course 8 is the integrated simulation lab: its 16 readiness items are formative, and its seven practicals plus capstone must trace to prior taught Technician II content plus Course 8 integration teaching.

The 420-topic Encyclopedia remains optional reference/deeper-study content and cannot substitute for Technician II instruction, test coverage, practical evidence, or credential eligibility.

## Performance architecture

`registry/technician-ii-integrated-lab-plan.json` controls the current development performance architecture:

- Practical A — Crop Diagnostic Workup
- Practical B — Sensor & Equipment Verification
- Practical C — Fertigation & Root-Zone Troubleshooting
- Practical D — IPM Trend & Treatment Follow-Up
- Practical E — Propagation / Canopy Performance Review
- Practical F — Postharvest Deviation & Lot Scope
- Practical G — Traceability, Metrics & Shift Coordination
- Capstone — `CAPSTONE-TECH2-SENIOR-TECHNICIAN-DIAGNOSTIC-SHIFT`

The development plan requires every practical plus the capstone and does not allow compensatory averaging across a critical failure. Current 80% development thresholds are not represented as validated final cut scores.

## Visual production state

`visuals/TECH2-RASTER-CANDIDATE-MANIFEST.json` records **36 owner-approved production-release WebP primary visuals**.

`scripts/test-tech2-raster-manifest-wiring.mjs` requires:
- 36 unique governed concepts;
- WebP learner paths;
- release-approved lesson metadata;
- exact manifest/path agreement;
- the public raster file to exist.

Legacy SVGs may remain as provenance/source assets but are not the learner-facing production format.

## Credential release evidence

`registry/technician-ii-release-evidence.json` correctly remains:

- `status: draft`
- `releaseReady: false`

Its structural state records:
- 8 required courses;
- 7 practicals mapped;
- integrated lab built;
- capstone mapped;
- public credential blueprint not authorized for operational use.

The public credential assessment blueprint must remain draft with zero selected operational secure items. Public development questions cannot become the secure operational credential bank.

## Real release gates still open

These gates require actual evidence and must not be fabricated:

- human technical/curriculum review;
- human assessment review;
- rendered accessibility review;
- validated job-task analysis;
- SME/employer validation;
- controlled pilot evidence;
- Practical A–G validation;
- capstone validation;
- evaluator calibration;
- inter-rater evidence;
- final blueprint weights;
- approved private secure operational item bank;
- approved secure assessment store;
- equivalent secure credential forms;
- formal standard setting;
- approved candidate-evidence retention/privacy policy;
- approved credential issuance workflow;
- explicit final Technician II program release approval.

## Deterministic controls

Relevant machine controls include:

- `npm run certification:content-readiness:check`
- `npm run tech2:course1:test` through `npm run tech2:course8:test`
- `npm run tech2:raster-wiring:test`
- `npm run tech2:release-readiness`
- `npm run tech2:release-readiness:test`

## Definition of current success

The Technician II **academic content alignment phase** is complete when all eight packages remain green, teaching-to-assessment provenance stays intact, approved raster delivery remains wired, and learner-facing deployment remains functional.

The **professional credential** remains non-issuable until the real external/human/pilot/security/standard-setting gates are satisfied and the release evidence changes through an authorized process.
