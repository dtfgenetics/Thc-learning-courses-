# Technician II Course Readiness Matrix

**Program:** `CREDPROG-CULT-TECH-II-001 — THC Cultivation Technician II`  
**Audit date:** 2026-09-18  
**Public academic course set:** 8 courses / 32 lessons / 268 public learning items  
**Visual production registry:** `visuals/TECH2-VISUAL-PRODUCTION-PLAN.json`

## Current control state

All eight Technician II learner-facing academic packages have explicit public-release manifests and are publicly reachable for study. The professional Technician II credential remains fail-closed and non-issuable. Public course completion, public answer/rationale access, CI, or assistant-generated materials are not substitutes for practical/capstone validation, secure assessment controls, standard setting, calibration or final human release approval.

## Course readiness

| Course | Public academic source | Assessment source | Learner support | Primary visuals | Public readback | Remaining machine work |
|---|---|---|---|---:|---|---|
| `COURSE-LH-TECH2-001` — Advanced Crop Observation & Diagnostic Reasoning | 4 dedicated lessons released | 12 formative + 24 summative learning items | package + remediation/visual brief authored | 4 planned / 0 produced | course + lesson + knowledge check verified | CI runtime confirmation; visual production; responsive/manual QA; exact deployment build/SHA |
| `COURSE-LH-TECH2-002` — Environmental Data, Sensors & Equipment Response | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 / 0 | verified | same |
| `COURSE-LH-TECH2-003` — Fertigation Execution, Verification & Root-Zone Interpretation | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 / 0 | verified | same |
| `COURSE-LH-TECH2-004` — Plant Health, IPM & Biosecurity Troubleshooting | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 / 0 | verified | same |
| `COURSE-LH-TECH2-005` — Propagation & Canopy Performance Troubleshooting | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 / 0 | verified | same |
| `COURSE-LH-TECH2-006` — Harvest/Postharvest Deviations & Quality Response | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 / 0 | verified | same |
| `COURSE-LH-TECH2-007` — Traceability, Production Metrics, Shift Coordination & Peer Support | 4 dedicated lessons released | 12 + 24 | package + remediation/visual brief authored | 4 / 0 | verified | same |
| `COURSE-LH-TECH2-008` — Integrated Technician II Simulation Lab | 4 dedicated lab lessons released | 16 formative readiness items; conventional final intentionally absent | integrated remediation/visual package authored | 8 / 0 | course + lesson + readiness check verified | CI runtime confirmation; 8 visuals; responsive/manual QA; exact build/SHA; keep secure performance evidence restricted |

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

1. Produce and integrate the 36 primary Technician II instructional visuals, beginning with outcome-level diagrams that reduce cognitive load rather than decorative imagery.
2. Map each finished visual to its exact canonical lesson(s) and source references, add external captions/text alternatives, and pass the visual lifecycle gate.
3. Confirm the new runtime/support/visual tests pass in CI and repair defects they expose.
4. Perform deployed responsive/manual learner-surface QA on course, lesson and assessment pages; record defects without confusing automated reachability with accessibility approval.
5. Resolve exact public deployment build/source SHA identity and update the deployment-evidence records only after direct verification.
6. Add exact-version review-queue enforcement for Technician II course content if the existing generic review tooling can resolve these course objects without exposing restricted practical/credential evidence.
7. Continue expanding applied worksheets/job aids where learner use shows a need; current package counts are not content ceilings.

## Human/evidence gates that must remain open

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
- explicit versioned Technician II final release approval.

## Definition of machine-build completion

The Technician II machine-build phase is complete when all eight course regressions and learner-runtime checks pass, the 36 primary visual concepts have approved learner assets or an explicitly reviewed alternate representation, public deployment evidence includes exact build/source identity, course surfaces have completed responsive/manual QA, and the only unresolved gates require genuine human/pilot/calibration/psychometric/security/release evidence.
