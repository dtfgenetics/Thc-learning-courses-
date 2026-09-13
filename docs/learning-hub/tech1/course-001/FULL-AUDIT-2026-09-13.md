# Course 1 Full Audit — 2026-09-13

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`  
**Audit scope:** instructional content, evidence, assessments, practical, learner runtime, accessibility, visuals, extensibility, publication/release governance, repository integrity and production discoverability  
**Audit disposition:** **PASS for continued public academic learning and controlled review/pilot preparation; FAIL for validated certification/production release**

## Executive result

Course 1 is no longer failing primarily because of thin lesson content or a broken core runtime. The six-module instructional package is substantial, source-bounded and structurally testable. The current deterministic runtime/quality suite passes on the repair branch with failures no longer suppressed.

The remaining failures are concentrated in five areas:

1. **learner-flow completeness** — the six 14-item module assessments exist and are published in data but are not surfaced by the current learner runtime;
2. **assessment validation and policy enforcement** — all 120 public Course 1 items remain development items awaiting human review/pilot evidence; authored answer-key position is heavily skewed; retake policy metadata exists but is not enforced by the course-assessment service;
3. **practical calibration/scoring specificity** — the practical is strong but domain scoring needs more observable point-level anchors before multi-assessor calibration;
4. **visual/accessibility completion** — automated checks pass and most lessons contain controlled visuals, but dedicated visual production, two new lesson placements, manual rendered accessibility review and production-master QA remain incomplete;
5. **release/deployment governance** — human review, pilot evidence, standard setting, final approval, branch convergence and production-site discoverability are not complete.

Academic publication and certification validation are intentionally separate. Course 1 may remain editable and publicly useful while the certification gates remain open.

## Status matrix

| Area | Result | Audit finding |
|---|---|---|
| Six-module instructional content | PASS | 18 substantial lessons / 12 controlled objectives; applied scenarios, artifacts, evidence boundaries and role limits are present. |
| Safety/source accuracy | PASS WITH MAINTENANCE | No gross safety defect found in reviewed content. OSHA/NIOSH/EPA boundaries remain appropriate. Active 2024 HCS / 2026 OSHA phase-in dates are now explicitly tracked in source verification. |
| Lesson depth and application | PASS | Current 945-minute estimate is descriptive, not a ceiling; lessons use artifacts, scenarios, controlled-document models and remediation cues. |
| Lesson practice | PASS | Low-stakes practice is learner accessible with immediate feedback and targeted field-reference remediation. |
| Module assessments M01–M06 | **FAIL — RUNTIME GAP** | Six 14-item formative banks exist, module objects reference them, and the public release lists them, but the catalog/portal does not render or launch them. |
| Course final structure | PASS FOR DEVELOPMENT | 36 items; all controlled objectives represented; predominantly apply/analyze level; evidence-stimulus coverage present; answer keys are not exposed by the learner API. |
| Course final validation | **FAIL — OPEN GATE** | Items remain development items without human assessment approval or pilot statistics. 80% is provisional. |
| Authored answer-key distribution | **WARN / REVIEW REQUIRED** | Current source-key positions are 0:82, 1:17, 2:13, 3:8. Runtime choice shuffling reduces learner cueing, but authoring bias should be reviewed/rebalanced before validation. |
| Retake-policy enforcement | **FAIL — PLATFORM CONTRACT** | `maxAttempts` and `cooldownHours` are schema fields but the Course 1 assessment service does not enforce them. Current null/0 settings happen to match unlimited pilot use, but future policy would be decorative metadata. |
| Threshold transparency in learner UI | **FAIL — COPY/GOVERNANCE** | Final/practical learner screens show 80% as a passing/minimum score without also saying the current academic threshold is provisional pending standard setting. Credential separation is clear; validation status is not. |
| Integrated practical content | PASS FOR PILOT PREP | 100-point practical, five workflow stages, seven evidence outputs, role limits and five critical errors are coherent and job-relevant. |
| Practical scoring rubric | PARTIAL | Domain totals and strong/partial/weak guidance exist, but point-level observable anchors within each domain are not specific enough for strong inter-rater consistency. |
| Practical Form A/B equivalence | UNVALIDATED | Forms are structurally plausible alternates but must be compared during calibration/pilot before equivalence is claimed. |
| Practical assessor calibration | **FAIL — OPEN GATE** | No accepted multi-assessor calibration evidence yet. Operational certification use remains correctly blocked. |
| Visual web assets | PARTIAL / IMPROVING | Canonical registry now has 14 produced web SVGs. Most lessons render controlled visuals. New deviation-status and data-integrity lifecycle SVGs were salvaged from stale PR work. |
| Visual lesson placement | PARTIAL | New Lesson 9 and Lesson 16 SVGs are registered but not yet inserted into canonical lesson blocks. Lesson 8 uses a shared operator-care/servicing boundary visual but still needs the planned dedicated authority/escalation graphic. |
| Visual production masters | PARTIAL | Drive contains reference boards and early PNG production drafts; factual/copy/accessibility/responsive QA and the planned dedicated production set are still in progress. |
| Automated accessibility | PASS | Static regression checks cover structure, touch targets, reflow contracts and accessible assessment controls. |
| Manual rendered accessibility | **FAIL — OPEN GATE** | Keyboard, screen-reader, 200/400% zoom/reflow, contrast, assessment interaction and accommodation review remain required. |
| Course academic/credential boundary | PASS | Public course final/practical and Course Record are explicitly separated from the secure Technician I credential exam and credential decision. |
| Certification human review | **FAIL — OPEN GATE** | No approved Course 1 scientific/editorial/assessment review records exist for the release version. |
| Pilot evidence | **FAIL — OPEN GATE** | No completed Course 1 learner/item pilot evidence sufficient for validation. |
| Standard setting | **FAIL — OPEN GATE** | Current 80% values are development/academic thresholds and have not been confirmed through documented standard setting. |
| Final certification release approval | **FAIL — OPEN GATE** | No versioned final certification-release approval record. |
| Course/module metadata extensibility | PASS AFTER REPAIR | Core validation is retained while standard academic metadata and open `extensions` namespaces are now available in course/module schemas. |
| Lesson/block extensibility | PARTIAL | Lesson schema supports a rich controlled block set but still requires schema changes for genuinely new top-level/block structures; an open lesson/block extension pattern remains to be completed. |
| Generated registry governance | PARTIAL | Registry validation catches ID drift, but CI still allows registry build and PR writeback/synchronization operations to fail without failing the workflow. |
| Production-readiness source of truth | PARTIAL / SAFE-FALSE | Release workflow is fail-closed today because `production:readiness` is blocking and readiness flags remain false. However `registry/system-readiness.json` is manually maintained and can become stale; evidence-derived gates should become authoritative. |
| Public site discoverability | **UNVERIFIED / FAIL TO CONFIRM** | Exact current searches for the Course 1 ID/title/Technician I Course 1 produced no indexed dtfseeds.com result. This does not prove no route exists, but production discoverability cannot currently be verified. |
| Branch lifecycle | **FAIL — REPOSITORY GOVERNANCE** | `dev` and `main` are severely diverged, preventing a normal low-risk `fix -> dev -> staging -> main` promotion without repository-wide reconciliation. |

## Instructional-content audit

### Strengths

Course 1 trains an entry cultivation technician to act inside a bounded operational role rather than teaching generalized cultivation trivia. The current modules cover:

1. applied workplace safety;
2. sanitation, biosecurity and controlled movement;
3. SOPs, work orders, authority and escalation;
4. traceability, movement, inventory and waste documentation;
5. equipment readiness, operator care and fault escalation;
6. contemporaneous records, shift handoff and integrated workflow.

The lesson design repeatedly distinguishes observation from diagnosis, assigned work from protected servicing, plant-health quarantine from pesticide restricted-entry controls, and academic/transfer guidance from jurisdiction-specific law. These distinctions should be preserved during future edits.

### Remaining instructional issue

The public runtime creates a discontinuity between lesson-level retrieval practice and the course final because the designed module tests are not learner accessible. They should become low-stakes module checkpoints and should not be converted into credential evidence.

## Evidence and source audit

Principal sources remain defensible for their stated roles: NIOSH for cannabis workplace hazards and occupational-health framing; OSHA for workplace safety, PPE, walking-working surfaces, machine/energy-control context and HazCom; EPA for Worker Protection Standard controls; university extension for greenhouse sanitation/biosecurity; GS1/ASTM for traceability/QMS transfer models; WHO/MHRA for data-integrity transfer models; HSE for shift-handover human factors; WCAG 2.2 for accessibility.

The source-verification record was updated during this audit to track OSHA's active Hazard Communication transition. Course 1 should continue teaching durable worker behavior while facility-specific training is checked against the HCS version and transition requirements applicable at delivery time.

## Assessment audit

### What is working

- final items are mapped to controlled objectives and competencies;
- the final is strongly application-oriented rather than recall-heavy;
- randomization/shuffling is deterministic per attempt;
- immutable item versions are preserved in attempts;
- the browser does not receive answer keys/rationales during the course final;
- scoring occurs server-side;
- returned final results are domain/competency level rather than answer-key disclosure;
- the public course final cannot be substituted for the secure credential assessment.

### What still fails

- all 120 public items require human assessment review;
- source-key-position authoring is heavily concentrated in position 0;
- no empirical item-difficulty/discrimination evidence exists yet;
- module tests are not surfaced by the learner runtime;
- attempt/cooldown metadata is not enforced by the service;
- learner-facing score copy does not disclose that the present threshold is provisional pending standard setting.

Do **not** import the proposed competency minimum-score floors from stale PR #323 at this stage. Those 60–70% domain floors are not supported by current standard-setting evidence.

## Practical audit

The integrated practical is suitable for controlled pilot preparation, not yet operational certification use. The strongest features are its evidence outputs, role boundaries, critical-error rules and equivalent delivery contexts.

Before calibration, expand each scoring domain from a single maximum plus broad qualitative anchor into observable scoring levels or additive criteria. The goal is not to create more arbitrary cut scores; it is to make the reason for awarding a specific domain score reproducible between assessors.

During calibration/pilot, compare Form A and Form B for domain-score distributions, critical-error frequency, completion time and assessor interpretation before accepting equivalence.

## Visual audit

The visual system should distinguish three states instead of overloading the word `produced`:

- **reference/master production** — Drive board or PNG master exists;
- **web instructional asset** — accessible SVG/graphic exists in the runtime asset path;
- **learner-approved visual** — factual/copy/accessibility/responsive QA completed for the lesson version.

Current web registry and Drive production-status documents track different artifact classes and can appear contradictory. Consolidate these states into one canonical lifecycle or cross-linked manifests.

Next visual priorities:

1. insert the new deviation-status decision map into Lesson 9;
2. insert the new data-integrity record lifecycle into Lesson 16;
3. create a dedicated authorization/escalation decision graphic for Lesson 8;
4. continue the 18-lesson production-master set from the existing visual manifest;
5. complete manual accessibility/responsive QA for every learner-facing visual.

## Schema/extensibility audit

The project requirement is continuous editability, not schema-free content. Core validation should remain strict enough to catch broken IDs, versions and required structure, but it must not force every future academic enhancement to become a platform migration.

Completed during this audit:

- added standard academic metadata fields to `course.schema.json`;
- added an open course `extensions` object;
- added standard module metadata fields to `module.schema.json`;
- added an open module `extensions` object.

Still required:

- add a compatible open extension surface to the lesson object and, where appropriate, rich instructional blocks;
- move the current Course 1 academic profile from Markdown-only documentation into the canonical machine-readable course object on a controlled version revision;
- preserve backwards compatibility for existing 1.x lesson objects.

## Runtime / CI / release audit

### Repaired

- API syntax failure that stopped evaluator/API tests;
- false-green main quality suite;
- advisory pilot-prep execution;
- advisory explicit release checks;
- publication tooling that conflated academic visibility with certification readiness;
- review-record field mismatch;
- rich-image title support;
- stale practical CSV test;
- progress semantics test;
- duplicate visual registry;
- authored answer-key distribution warning.

### Remaining

- make registry generation itself blocking; artifact upload may remain advisory;
- replace silent PR auto-writeback (`|| true`) with a deterministic generated-file drift check or otherwise guarantee convergence;
- derive certification-critical production gates from versioned evidence records where possible rather than relying on manually asserted readiness booleans;
- enforce assessment attempt/cooldown policy when configured;
- add module-assessment delivery and tests;
- verify actual production deployment/discoverability on dtfseeds.com.

## Repository audit

PR #324 is the canonical Course 1 runtime/release-integrity repair branch. PR #323 contains a mixture of useful and unsafe work. Two useful visuals were salvaged from it during this audit. Its unvalidated competency-floor grading rules should not be carried forward without standard-setting evidence.

The repository's declared promotion path is `feature/fix -> dev -> staging -> main`, but `dev` and `main` are currently severely diverged. Do not force-retarget PR #324 to `dev` until unique branch work and reconciliation strategy are established. Branch cleanup is a separate repository-wide repair from Course 1 content validation.

## Release decision

### Public academic learning

**PASS, with known improvement work.** Course 1 can remain public, editable and useful for learning while the open quality gates are worked.

### Controlled pilot preparation

**PASS structurally.** Pilot-prep automation is fail-closed and currently green. Human preconditions still determine whether a real pilot should open.

### Validated Course 1 certification evidence

**FAIL / NOT YET VALIDATED.** Required human review, item validation, practical calibration, rendered accessibility review, pilot evidence, standard setting and final approval remain open.

### THC Cultivation Technician I credential

**NOT DETERMINED BY COURSE 1 ALONE.** The Technician I credential is a separate multi-course, multi-practical, capstone and secure-assessment program. Passing Course 1 does not issue that credential.

## Ordered repair backlog

1. Wire M01–M06 into the learner experience as low-stakes module assessments using a generalized safe assessment runtime.
2. Enforce `maxAttempts` / `cooldownHours` when configured, without changing the current null/0 pilot settings.
3. Add learner-visible provisional-threshold/standard-setting language to the Course 1 final and practical.
4. Wire the new Lesson 9 and Lesson 16 visuals and create the dedicated Lesson 8 authority/escalation visual.
5. Complete the lesson/block extension strategy and move Course 1 academic metadata into the canonical course object on a controlled version update.
6. Tighten practical domain scoring anchors before assessor calibration.
7. Make registry generation/convergence fail closed instead of silently tolerating generator/writeback failure.
8. Complete human technical/editorial and 120-item assessment review.
9. Complete rendered accessibility review.
10. Complete practical calibration and compare Forms A/B.
11. Run controlled pilot; analyze and disposition item/practical findings.
12. Conduct formal standard setting and update provisional thresholds.
13. Re-run source verification, all deterministic checks and production-readiness gates.
14. Create the explicit versioned certification-release approval only after all validation evidence is accepted.
15. Reconcile repository branch lifecycle and verify deployment/discoverability on the actual production site.

This backlog is ordered for risk reduction, not as a content ceiling. Course 1 remains continuously editable throughout the process.
