# Technician II Course Readiness Matrix

**Program:** `CREDPROG-CULT-TECH-II-001 — THC Cultivation Technician II`  
**Audit date:** 2026-09-18  
**Public academic course set:** 8 courses / 32 lessons / 268 public learning items  
**Visual production registry:** `visuals/TECH2-VISUAL-PRODUCTION-PLAN.json`

## Current control state

All eight Technician II learner-facing academic packages have explicit public-release manifests and are publicly reachable for study. The project owner has approved completed academic course material for publication. The professional Technician II credential remains separately fail-closed and non-issuable where secure operational assessment, identity/evidence, signing, or decision controls are not verified. Public academic release does not claim practical/capstone validation, psychometric standard setting, calibration, accreditation, or external review when those records do not exist.

## Course readiness

| Course | Public academic source | Assessment source | Learner support | Primary visuals | Public readback | Remaining machine work |
|---|---|---|---|---:|---|---|
| `COURSE-LH-TECH2-001` — Advanced Crop Observation & Diagnostic Reasoning | 4 dedicated lessons released | 12 formative + 24 summative learning items | package + remediation/visual brief authored | 4 review candidates | course + lesson + knowledge check verified | owner academic release may proceed; visual/responsive QA and exact deployment identity remain quality/evidence records |
| `COURSE-LH-TECH2-002` — Environmental Data, Sensors & Equipment Response | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 review candidates | verified | same |
| `COURSE-LH-TECH2-003` — Fertigation Execution, Verification & Root-Zone Interpretation | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 review candidates | verified | same |
| `COURSE-LH-TECH2-004` — Plant Health, IPM & Biosecurity Troubleshooting | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 review candidates | verified | same |
| `COURSE-LH-TECH2-005` — Propagation & Canopy Performance Troubleshooting | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 review candidates | verified | same |
| `COURSE-LH-TECH2-006` — Harvest/Postharvest Deviations & Quality Response | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 review candidates | verified | same |
| `COURSE-LH-TECH2-007` — Traceability, Production Metrics, Shift Coordination & Peer Support | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 review candidates | verified | same |
| `COURSE-LH-TECH2-008` — Integrated Technician II Simulation Lab | 4 dedicated lab lessons released | 16 formative readiness items; conventional final intentionally absent | integrated remediation/visual package authored | 8 review candidates | course + lesson + readiness check verified | owner academic release may proceed; visual/responsive QA and exact build identity remain quality/evidence records; secure performance evidence remains restricted |

## Machine controls added

The course system now includes:

- `scripts/test-tech2-public-release.mjs` — verifies the 8 public academic release manifests, 32 lessons, 268 public learning items, assessment/credential separation, rationales and evidence references;
- `scripts/test-tech2-learner-runtime.mjs` — exercises Academy catalog, lesson, lesson-practice, server-side formative grading and module-checkpoint routes for all 8 courses in draft preview;
- `registry/tech2-course1-completion-status.json` through `registry/tech2-course8-completion-status.json` — fail-closed course completion ledgers;
- `registry/tech2-course1-deployment-evidence.json` through `registry/tech2-course8-deployment-evidence.json` — truthful public readback evidence with build/SHA and manual-QA fields left open;
- `scripts/test-tech2-course-completion-status.mjs` — prevents false completion, validation or deployment claims;
- `docs/learning-hub/tech2/course-001/` through `course-008/` — controlled package manifests plus learner/remediation/visual support packages;
- `scripts/test-tech2-course-support-packages.mjs` — requires applied learner artifacts, equivalent reassessment, visual briefs, accessibility criteria and credential boundaries;
- `visuals/TECH2-VISUAL-PRODUCTION-PLAN.json` — 36 outcome-aligned primary visual concepts with fail-closed lifecycle;
- `scripts/test-tech2-visual-production-plan.mjs` — blocks an asset from approved/produced status unless lesson placement, references, caption, text alternative, source file and QA approval exist.

## Remaining machine-creatable work

1. Complete technical/content/accessibility review of the 36 outcome-aligned Technician II visual candidates and approve, revise or reject each without bypassing the review gate.
2. After approval, set the individual lesson visual and registry lifecycle state truthfully so approved assets become learner-visible through the existing fail-closed renderer.
3. Confirm the runtime/support/visual tests pass in CI and repair defects they expose.
4. Perform deployed responsive/manual learner-surface QA on course, lesson and assessment pages; record defects without confusing automated reachability with accessibility approval.
5. Resolve exact public deployment build/source SHA identity and update the deployment-evidence records only after direct verification.
6. Enforce exact-version review queues for Technician II course content and mapped performance evidence.
7. Continue expanding applied worksheets/job aids where learner use shows a need; current package counts are not content ceilings.

## External/credential evidence that must remain truthfully labeled

- human subject-matter/occupational review;
- instructional-design review;
- assessment-item review;
- rendered WCAG/manual accessibility approval;
- Practical A–G validation;
- Senior Technician capstone validation;
- evaluator qualification/calibration and inter-rater evidence;
- controlled learner/item/practical pilot evidence;
- equivalent secure-form evidence;
- final blueprint/decision-rule standard setting;
- candidate evidence privacy/retention approval;
- secure operational assessment-store approval;
- credential issuance/security workflow approval;
- versioned credential issuance authorization where the professional Technician II credential is actually issued. Academic publication may use project-owner approval.

## Definition of academic machine-build completion

The Technician II machine-build phase is complete when all eight course regressions and learner-runtime checks pass, the 36 primary visual candidates have completed technical/content/accessibility review and are either approved learner assets or explicitly reviewed alternate representations, public deployment evidence includes exact build/source identity, course surfaces have completed responsive/manual QA, and remaining external/pilot/calibration/psychometric/security evidence is recorded truthfully without being treated as an artificial blocker to project-owner-approved academic publication.
