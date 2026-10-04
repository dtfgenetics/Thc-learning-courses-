# Active Work — Technician I Completion

**Status:** active — academic source/package and deployment evidence substantially reconciled; manual QA and professional validation remain  
**Started:** 2026-09-15  
**Updated:** 2026-09-22  
**Credential program:** `CREDPROG-CULT-TECH-I-001 — THC Cultivation Technician I`

## Objective

Finish the first complete professional training/certification pathway while keeping academic/public course completion separate from professional credential authorization.

The project has now crossed an important boundary: **all seven Technician I source packages and the credential machine-control layer are built and deterministically enforced.** Remaining machine work is primarily learner-surface QA, content-depth improvement, visual/support expansion, and synchronization of truthful deployment/readback evidence. Human, pilot, psychometric, privacy/security and final release approvals remain open by design.

## Current seven-course state

1. `COURSE-LH-TECH1-001` — Safety, Responsible Practice & Cultivation Workflows — reference implementation; machine/public preparation complete; human validation open.
2. `COURSE-LH-TECH1-002` — Plant Observation, Growth Stages & Crop Records — source package complete; 32 dedicated items; Practical A; 10 governed learner assets.
3. `COURSE-LH-TECH1-003` — Environmental, Light & Sensor Fundamentals — source package complete; 32 dedicated items; Practical A mapping; 7 governed learner assets.
4. `COURSE-LH-TECH1-004` — Water, Root Zone, Nutrition & Irrigation Fundamentals — source package complete; 36 dedicated items; Practical B; 8 governed learner assets.
5. `COURSE-LH-TECH1-005` — Propagation, Canopy, IPM Scouting & Crop Care — source package complete; 36 dedicated items; Practicals C/D/E; 11 governed learner assets.
6. `COURSE-LH-TECH1-006` — Harvest, Postharvest, Traceability & Shift Handoff — source package complete; 36 dedicated items; Practical F; 8 repository learner assets; 8/8 controlled Drive mirrors verified.
7. `COURSE-LH-TECH1-007` — Integrated Cultivation Technician Practice Lab — integrated source package complete; 12-item readiness check with two items per objective, Practicals A–F, 200-point capstone, five controlled critical-failure classes, equivalent-form/retest/evaluator/privacy controls.

The authoritative cross-course state is `docs/TECH1-COURSE-READINESS-MATRIX.md`. The source-package gate is executable through:

```bash
node scripts/report-tech1-course-package-readiness.mjs --require-source-package
```

## Credential machine layer now built

The credential-level machine controls now include:

- 13-domain JTA/competency/course/practical/capstone crosswalk: `registry/technician-i-jta-competency-crosswalk.json`;
- integrated practical/capstone controls: `registry/technician-i-integrated-lab-plan.json`;
- authoritative machine-layer registry: `registry/technician-i-machine-layer.json`;
- fail-closed release-evidence registry: `registry/technician-i-release-evidence.json`;
- public credential blueprint with **zero operational secure items**: `content/assessments/ASSESS-CRED-TECH1-001.json`;
- secure assessment-store contract;
- equivalent secure-form construction/rotation rules;
- retest/remediation/accommodation/appeal/security policy draft;
- candidate evidence retention/privacy draft;
- capstone assessor/calibration packages;
- credential issuance/verification workflow contract;
- public read-only credential verification runtime and persistent credential status-transition infrastructure;
- deterministic `scripts/test-tech1-machine-layer.mjs` and `scripts/test-tech1-release-readiness.mjs`.

Current program-level critical-failure governance is aligned to the integrated lab plan: safety, identity/genealogy, data integrity, authority boundary, and active hold/release. These remain development rules until validation and formal standard setting.

## CI state

The current Technician I structure workflow on the machine-layer enforcement head completed successfully. The main curriculum workflow now enforces:

- Course 2–6 complete learning-loop/balanced-assessment audits;
- all seven source-package contracts;
- Technician I credential machine-layer contract;
- public credential-bank security boundary;
- fail-closed Technician I release readiness;
- the complete repository test suite.

Green CI proves source/package consistency. It does **not** authorize professional credential issuance.

## Remaining machine work — strict order

### A. Deployment/readback closure for Courses 2–7

For each course:

- verify the deployed learner route against the intended course/version;
- perform responsive learner-surface QA across supported viewport classes;
- verify learner visuals/resources load through the deployed runtime;
- perform anonymous public readback where the surface is intended to be public;
- record the exact build/SHA/route only after successful verification;
- never create release evidence before the deployed result actually exists.

### B. Course 6 storage state

- all eight controlled Course 6 Drive mirrors are verified in `visuals/COURSE6-ASSET-REGISTRY.json`;
- preserve those real file IDs/URLs and refresh them only when an asset is intentionally replaced;
- do not regress verified mirror metadata back to a pending state.

### C. Credential-runtime hardening only where release-safe

- preserve the existing public read-only verification endpoint and status-transition audit infrastructure;
- keep new credential issuance disabled until the private assessment/evidence decision system and release gates are approved;
- do not create an admin minting shortcut that can bypass program readiness.

### D. Synchronize governance records

- keep readiness matrix, release-evidence registry, package manifests and active-work status synchronized with exact versions/commits;
- record new machine artifacts without advancing human gate states.

## Human gates that must remain real

Do not mark any of the following complete using generated text, CI, synthetic records or assistant judgment:

- technical/curriculum approval;
- assessment-item/blueprint approval;
- rendered accessibility approval;
- employer/SME JTA validation;
- controlled learner/item pilot;
- Practical A–F validation;
- capstone validation;
- evaluator calibration/inter-rater evidence;
- approved private operational item bank/store and equivalent forms;
- formal standard setting and final decision rules;
- candidate privacy/retention approval;
- credential issuance/security workflow approval;
- final Technician I program release approval.

## Known design debt

`COMP-SPACE-BIOSEC-001` is a shared competency whose current generic wording includes grow-space workflow **design**. Technician I uses only its operational sanitation/biosecurity subset and does not claim independent design authority. The Tech1 JTA crosswalk now makes that boundary explicit. A future competency-library refactor may split operational biosecurity execution from higher-level space/workflow design; do not broaden Technician I simply to match the shared competency wording.

## Definition of success for this active work block

The remaining machine-build work is complete when:

1. all seven source packages remain green under CI;
2. Courses 2–7 have fresh truthful deployed responsive/readback evidence;
3. Course 6 mirror metadata remains synchronized with the verified 8/8 Drive uploads;
4. private exam boundaries and disabled issuance remain intact;
5. the only unresolved release blockers require genuine human review, pilot evidence, evaluator/calibration evidence, security/privacy approval, formal standard setting, or final release authorization.
