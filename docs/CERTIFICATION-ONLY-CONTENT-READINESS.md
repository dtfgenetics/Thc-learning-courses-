# Certification-Only Content Readiness

**Updated:** 2026-09-22  
**Scope:** canonical Technician I + Technician II certification courses only  
**Excluded:** the 420-topic Encyclopedia, legacy `THC-C###` material, public noncredential education, and secure professional credential forms.

## Current aligned academic curriculum

The canonical certification curriculum contains **15 dedicated courses**:

- Technician I: **7 courses**
- Technician II: **8 courses**

The content model is now:

`credential pathway -> dedicated COURSE-LH course -> dedicated lessons/objectives -> dedicated course assessment or integrated readiness/performance layer -> remediation/reassessment -> practical/capstone mapping`

The 420 Encyclopedia (`THC-ENC-001`–`THC-ENC-420`) is a separate reference system and is not counted as certification instruction, course completion, test coverage, practical evidence, or credential eligibility.

## Assessment provenance state

### Conventional course-final packages

There are **13 dedicated courses with conventional course finals**:

- Technician I Courses 1–6
- Technician II Courses 1–7

Each final is explicitly required to:
- be course-derived;
- forbid encyclopedia substitution;
- forbid untaught scored material;
- retain a human-readable test-to-teaching audit;
- resolve assessed objectives to dedicated course teaching.

Technician I Course 1 uses its existing dynamic objective-learning-loop audit across 18 canonical lessons rather than duplicating that large mapping manually. Courses 2–6 and Technician II Courses 1–7 store explicit machine-readable objective-to-lesson maps in their final-assessment metadata.

### Integrated performance labs

Two courses intentionally do **not** use a redundant conventional final:

- `COURSE-LH-TECH1-007` — Integrated Cultivation Technician Practice Lab
- `COURSE-LH-TECH2-008` — Integrated Technician II Simulation Lab

Their readiness checks are formative and course-derived. Practical/capstone criteria must trace to previously taught pathway content plus dedicated integration teaching. Encyclopedia-only material cannot create new scored readiness, practical, or capstone requirements.

## Visual-state reconciliation

Technician II now uses the canonical owner-approved raster manifest for all **36 primary visuals**. Lesson metadata points to WebP learner assets rather than stale SVG review paths, and `scripts/test-tech2-raster-manifest-wiring.mjs` enforces manifest/file/path/release-state agreement.

Technician I Course 1 final-test image stimuli are wired to deployed raster assets; retired SVG compatibility/provenance files are not valid production assessment stimuli.

## What “aligned” means here

Aligned means the repository can prove that:
- the course is a canonical certification course;
- its scored academic assessment is dedicated to that course, or the course is an intentional integrated performance lab;
- scored objectives trace to dedicated instruction;
- the Encyclopedia cannot substitute for course teaching;
- untaught material cannot be added to the academic course assessment without breaking the contract;
- integrated readiness/practical/capstone requirements trace to taught pathway content;
- academic course completion remains separate from professional credential issuance.

It **does not** mean professional certification validation is complete.

## Professional credential gates still requiring real evidence

Do not fabricate or auto-complete these gates:

- human technical review of the current controlled versions;
- human assessment/item-quality review;
- rendered accessibility/manual UX review;
- controlled learner/item/practical pilot evidence;
- practical and capstone evaluator validation;
- evaluator calibration and inter-rater evidence;
- final blueprint/weight decisions where applicable;
- formal standard setting/cut-score approval;
- secure operational credential item/forms evidence;
- candidate-evidence retention/privacy approval;
- final credential issuance workflow approval;
- final program release approval.

Academic publication and continued course improvement may proceed under the project-owner release model without pretending those external/professional validation records exist.

## Deterministic audit

Run:

`npm run certification:content-readiness`

For CI/fail-closed checking:

`npm run certification:content-readiness:check`

The audit checks exactly the 15 canonical courses and reports them independently of the 420 Encyclopedia and legacy course inventory.
