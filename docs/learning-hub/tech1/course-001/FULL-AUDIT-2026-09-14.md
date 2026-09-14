# Course 1 Full Audit — 2026-09-14

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`  
**Audited baseline:** current `main` after PRs #324, #327 and #330  
**Disposition:** **public academic package functional; certification validation intentionally not complete**

This document supersedes the 2026-09-13 snapshot for current status. The older audit remains historical evidence of what was found and repaired.

## Current result

Course 1 no longer has the core runtime and learner-flow failures found at the start of the audit. The public academic package is substantial, structurally validated, and the current deterministic quality suite is fail-closed. The remaining blockers are primarily human validation, secure/high-integrity assessment handling, production deployment/discoverability, manual accessibility evidence, and repository governance.

## Fixed and landed in `main`

- API startup syntax failure repaired.
- Main curriculum-quality workflow made blocking instead of false-green.
- Course 1 pilot-prep structure/schema check made fail-closed.
- Explicit production/release readiness checks made blocking.
- Public academic publication separated from certification approval.
- Practical certification use remains blocked until calibration/validation evidence exists.
- Six module assessments are first-class low-stakes learner checkpoints instead of hidden banks.
- Module checkpoint tests follow canonical content dynamically; no fixed six-module/fourteen-item ceiling is imposed.
- Assessment retake metadata (`maxAttempts`, `cooldownHours`) is enforced when configured.
- Course 1 final/practical learner UI states that the current 80% values are provisional academic/development thresholds pending pilot evidence and formal standard setting.
- Course/module/reference/lesson authoring gained extensible metadata surfaces without dropping validation of canonical fields.
- Rich instructional image titles are schema/runtime supported.
- Lesson 9 deviation-status and Lesson 16 data-integrity visuals are mapped into their canonical lessons.
- Canonical visual registry duplicate was removed.
- Course 1 visual-production candidates now cover the planned 18 concepts; the public learner registry currently contains 14 deployed SVG assets. Production, QA approval, and public deployment are intentionally tracked as separate states.
- Course 1 practical is version `1.1.0` with observable criterion anchors across scoring domains.
- Finalized practical domain scores require observed-evidence notes.
- Assessor-only anchors/evidence remain out of the public learner projection.
- Form A and Form B are explicitly bound to rubric v1.1.0.
- Calibration protocol is explicitly bound to rubric/forms v1.1.0 and forbids combining evidence across material rubric versions.
- Generated curriculum/publication state is fail-closed without CI self-mutating the PR branch.
- Authored answer-key-position concentration is reported as a human-review warning.
- PR #323 was closed as superseded after safe unique work was preserved and unsupported grading/content-count restrictions were rejected.

## Current machine status

- Current-main quality checks have passed on the recent Course 1 repair and documentation heads before merge.
- PR #327 exact head `3b1015fa...`: `Curriculum quality audit` and `Course 1 pilot-prep audit` both completed successfully before merge.
- PR #330 exact head `dc172a38...`: `Curriculum quality audit` completed successfully before merge.
- A green CI result is evidence of deterministic package integrity only. It is not certification approval.

## Remaining blockers

### Human validation — OPEN

1. Human technical/curriculum review of the release version.
2. Human assessment review of all 120 public Course 1 knowledge items.
3. Practical assessor calibration using v1.1.0 and version-matched forms.
4. Rendered accessibility review: keyboard, screen reader, zoom/reflow, contrast, assessment interaction, and accommodation review.
5. Controlled learner/item pilot evidence.
6. Formal standard setting and disposition of the provisional 80% values.
7. Explicit versioned final certification-release approval.

No synthetic review records should be created to close these gates.

### Assessment integrity — OPEN FOR HIGH-INTEGRITY USE

The public Course 1 question source files contain answer keys/rationales. The learner API correctly omits them, but API non-disclosure does not create item secrecy when source is public. Therefore the current Course 1 final is appropriate as an open academic/development assessment. If it is ever used as high-integrity summative evidence, protected item/key material must move to a non-public assessment store or protected delivery system.

A broader credential-bank exposure was also confirmed during branch reconciliation: the public repository already contains `purpose: "credential"` development items such as `ITEM-TECH1-*`, and those source files contain authored `correct` keys/rationales. They must be treated as public development blueprints, not secure operational credential items. The Technician I credential program currently references `ASSESS-CRED-TECH1-001`, which is not present in `main`; however, the exposed credential-purpose items themselves must never be promoted to active high-integrity use. Production credential-form generation from this public repository is being fail-closed, and any future operational credential bank must live in an approved private assessment store/delivery service with newly secured item material.

### Practical equivalence — OPEN

Forms A and B target the same constructs but equivalence has not been empirically established. Calibration/pilot should compare domain scores, critical-error decisions, completion time, prompt use, and assessor interpretation by form before equivalence is claimed.

### Visual learner deployment — PARTIAL

The planned 18 visual concepts have produced review candidates, but the public `visuals/ASSET-REGISTRY.json` currently contains 14 deployed learner SVG assets. Do not treat production-candidate completion as public-deployment completion. New/replacement visual candidates require factual/copy review, accessibility text, responsive review, registry entry, canonical lesson mapping, and public path verification.

### Production discoverability — OPEN

DTFSeeds' general Teaching Healthy Cultivation learning system is public, but exact current web searches do not surface Course 1 by canonical ID/title/Technician I Course 1 wording. Issue #329 tracks the requirement for a stable public route, navigation/catalog link, learner-stage rendering, public asset verification, responsive QA, and deployed-build evidence.

### Repository lifecycle — OPEN

`dev`, `staging`, and `main` are materially diverged. PR #326 is a deliberate reconciliation branch based on current `main`, but GitHub reports it non-mergeable into `dev`; conflicts must be resolved without force-pushing away unique history. Independent dev PRs #279, #274 and #273 must remain recoverable. The dev-side history also contains useful curriculum/runtime work mixed with older release-governance decisions that conflict with the current fail-closed certification model, so it must not be merged wholesale.

### Branch protection — OPEN

The repository currently has no rulesets and `main` is unprotected. Workflow YAML alone does not prevent bypass. Issue #328 tracks required branch/ruleset enforcement after branch reconciliation.

## Release interpretation

### Public academic learning

**PASS.** Course 1 can remain visible/editable as academic learning material.

### Controlled pilot preparation

**STRUCTURALLY PASS.** The package and tooling support pilot preparation, but real pilot authorization still depends on the required human review/calibration/accessibility preconditions.

### Validated Course 1 certification evidence

**NOT YET VALIDATED.** Human review, calibration, rendered accessibility, pilot evidence, standard setting, protected operational assessment material, and final versioned approval remain open.

### THC Cultivation Technician I credential

**SEPARATE PROGRAM DECISION.** Course 1 is one component of the Technician I pathway and does not itself issue that credential. Public credential-purpose development items are not acceptable as the operational credential exam bank.

## Priority order from here

1. Fail-close production credential-form generation from the public item repository and move future operational credential material to a private assessment store.
2. Reconcile `dev`/`staging`/`main` without discarding unique work or reopening obsolete release-governance behavior.
3. Enable branch protection/rulesets and required checks (#328).
4. Verify and expose the public Course 1 production route/navigation (#329).
5. Complete visual QA/deployment for any remaining learner visuals that are approved for replacement.
6. Run human technical/editorial/assessment review and record real review evidence.
7. Complete rendered accessibility review.
8. Calibrate practical v1.1.0 across qualified assessors and compare Forms A/B.
9. Run controlled pilot and analyze knowledge/practical evidence.
10. Conduct formal standard setting and update provisional thresholds only if the evidence supports a change.
11. Create explicit certification-release approval only after all required validation evidence is accepted.

This priority list is a risk sequence, not a content ceiling. The course remains editable and extensible throughout validation.