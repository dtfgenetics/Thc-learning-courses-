# Technician I Course Readiness Matrix

**Program:** `CREDPROG-CULT-TECH-I-001 — THC Cultivation Technician I`  
**Audit date:** 2026-09-15  
**Package contract:** `docs/LEARNING-HUB-COURSE-PACKAGE-CONTRACT.md`  
**Reference implementation:** `COURSE-LH-TECH1-001`  
**Machine reporter:** `scripts/report-tech1-course-package-readiness.mjs`

## Purpose

This is the working cross-course control surface for finishing Technician I. It separates existing development source from missing production-package work and from gates that require genuine human/pilot/security evidence.

A course object, assessment bank, or asset folder by itself is not a finished certification course. Professional credential issuance remains disabled until the complete seven-course pathway and credential-level validation gates are satisfied.

## Current readiness

| Course | Current source state | Assessment source | Learner/visual source | Learning Hub production package | Performance mapping | Human/release state | Immediate machine priority |
|---|---|---|---|---|---|---|---|
| `COURSE-LH-TECH1-001` — Safety, Responsible Practice & Cultivation Workflows | `published`; Course 1 reference implementation | Published module checks + final + integrated practical | Full learner, instructor, remediation and reviewed visual layer | Reference package exists | Integrated Course 1 practical | Machine work complete; human validation gates remain open | Preserve as reference; do not weaken gates |
| `COURSE-LH-TECH1-002` — Plant Observation, Growth Stages & Crop Records | `draft` v0.10.0 | M01 formative + final; 32 dedicated items declared | 10 produced learner assets; 7 embedded visuals + 3 downloadable practice worksheets | Active package now includes objective coverage, learner materials, evidence dossier, instructor/remediation guide, accessibility review packet, human-review worklist, manifest + assets | Practical A; crosswalk `development` | Not release-ready; rendered/human/pilot/release evidence open | Item-level objective audit → Practical A crosswalk/assessor package → learner-surface/runtime QA → deployment evidence |
| `COURSE-LH-TECH1-003` — Environmental, Light & Sensor Fundamentals | `draft` v0.5.0 | M01 formative + final; 32 dedicated items declared | 6 learner assets declared; visual registry present | Package directory currently contains only `assets/` | Practical A; crosswalk `development` | Not release-ready | Convert after Course 2 package factory is proven |
| `COURSE-LH-TECH1-004` — Water, Root Zone, Nutrition & Irrigation Fundamentals | `draft` v0.4.0 | M01 formative + final; 36 dedicated items declared | 7 learner assets declared; visual registry present | `assets/` plus Practical B crosswalk status files | Practical B; crosswalk `development` | Not release-ready | Complete package after 2–3 |
| `COURSE-LH-TECH1-005` — Propagation, Canopy, IPM Scouting & Crop Care | `draft` v0.4.0 | M01 formative + final; 36 dedicated items declared | 9 learner assets declared; visual registry present | Package directory currently contains only `assets/` | Practicals C/D/E; crosswalk `development` | Not release-ready | Complete package after 4 |
| `COURSE-LH-TECH1-006` — Harvest, Postharvest, Traceability & Shift Handoff | `draft` v0.3.0 | M01 formative + final; 36 dedicated items declared | Learner asset layer explicitly not built | No Course 6 Learning Hub package directory found | Practical F; crosswalk `development` | Not release-ready | Build learner/assets layer, then package |
| `COURSE-LH-TECH1-007` — Integrated Cultivation Technician Practice Lab | `draft` v0.2.0 | M01 readiness assessment; ordinary final intentionally `null` | Integrated lab source exists; package layer incomplete | No Course 7 Learning Hub package directory found | Practicals A–F + `CAPSTONE-TECH1-SHIFT-001` | Pilot, evaluator calibration, standard setting and live credential form approval remain open | Finish only after Courses 2–6 package pattern is stable |

## Package evidence required for Courses 2–6

The package factory must produce or verify evidence for all of these contract areas without imposing an artificial ceiling on course content:

1. controlled course definition;
2. resolvable course-specific instructional graph;
3. objective → instruction → practice → assessment → remediation/reassessment alignment;
4. learner application/workbook/scenario/job-aid package;
5. distinct formative and summative academic assessment package;
6. practical/performance mapping where needed;
7. course evidence/source dossier;
8. controlled visual/asset plan with accessibility and placement QA;
9. instructor/remediation/assessor support;
10. rendered WCAG 2.2 AA/manual UX review packet;
11. authoritative human-review queue/worklist;
12. public deployment/release evidence;
13. explicit separation between academic completion and professional credential issuance.

Course 7 uses the integrated-practice-lab profile: readiness assessment, all six practicals, capstone, critical-failure rules, evaluator evidence, equivalent forms, calibration/inter-rater protocol, remediation/retest rules, evidence-retention requirements, and secure-form separation.

## Current credential blockers

The Technician I program itself is still `draft`. Current program metadata keeps job-task analysis at `draft`, SME/employer validation at `not-started`, assessment review at `draft`, accessibility review at `not-started`, and standard setting `provisional`. Those are not CI problems to fake closed; they require the corresponding evidence and approvals.

The machine layer must therefore finish all seven course packages and credential technical artifacts while remaining fail-closed for professional issuance.

## Production order

### 1. Course 2 — prove the package factory

Preserve its existing course object, dedicated lessons/objectives, M01/final assessment source, Practical A mapping, visual registry and learner assets. Add the missing package evidence around them rather than replacing valid source.

Course 2 package artifacts already added in this work block:

- `OBJECTIVE-COVERAGE.md`;
- `LEARNER-MATERIALS.md`;
- `EVIDENCE-DOSSIER.md`;
- `instructor/INSTRUCTOR-GUIDE.md`;
- `accessibility/COURSE2-RENDERED-ACCESSIBILITY-UX-REVIEW.md`;
- `FINAL-HUMAN-REVIEW-WORKLIST.md`;
- `COURSE-PACKAGE-MANIFEST.md`.

Remaining Course 2 machine priorities:

- deterministic item-level objective coverage report for all 32 items;
- controlled remediation/reassessment rules;
- Practical A crosswalk/assessor package;
- learner-surface wiring and public asset-path verification;
- responsive/runtime QA;
- versioned review-queue generation;
- release/deployment evidence only after the learner surface actually exists and is verified.

### 2. Courses 3–6 — reuse, do not reinvent

Once Course 2 passes the deterministic package reporter and course-specific QA, apply the same file architecture and generation/validation logic to Courses 3, 4, 5 and 6. Course-specific content, sources, practice and visuals remain distinct.

### 3. Course 7 — integrated performance package

After Courses 2–6 are stable, finish Course 7 around Practicals A–F and the shift capstone, including evaluator equivalence/calibration and secure credential-form boundaries.

### 4. Credential machine layer

Then close the remaining machine-resolvable Technician I artifacts: JTA/competency crosswalk package, controlled practical packages, capstone package, final credential blueprint, private operational assessment-store contract, equivalent-form rules, retake/remediation/accommodation/appeal/security procedures, retention/privacy draft, and issuance/verification runtime.

## Deterministic commands

Existing source-structure audit:

```bash
node scripts/audit-tech1-course-package-source.mjs
```

New cross-course package-readiness report:

```bash
node scripts/report-tech1-course-package-readiness.mjs --human
```

Fail CI while any machine package signal is missing:

```bash
node scripts/report-tech1-course-package-readiness.mjs --require-machine-package
```

Credential-level release readiness remains a separate fail-closed check:

```bash
npm run tech1:release-readiness
```

## Definition of done for this matrix

This matrix is successful when Courses 1–7 have machine-complete package evidence appropriate to their profile, public academic states are truthful, credential security boundaries remain intact, and the only remaining blockers require genuine human review, pilot data, evaluator/calibration evidence, standard setting, privacy/security approval, or final release approval.
