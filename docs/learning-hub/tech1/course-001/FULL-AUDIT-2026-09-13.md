# Course 1 Full Audit — 2026-09-13

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`  
**Audit scope:** instructional content, evidence, assessments, practical, learner runtime, accessibility, visuals, extensibility, publication/release governance, repository integrity and production discoverability  
**Audit disposition:** **PASS for continued public academic learning and controlled review/pilot preparation; FAIL for validated certification/production release**

## Executive result

Course 1 is no longer failing primarily because of thin lesson content or a broken core runtime. The six-module instructional package is substantial, source-bounded and structurally testable. The deterministic Course 1/runtime suite has repeatedly passed on the repair branch after the major runtime and governance fixes.

The remaining failures are concentrated in learner-flow completion, assessment validation/security, practical calibration/scoring specificity, visual/manual-accessibility completion, human validation, production discoverability and repository branch convergence.

Academic publication and certification validation are intentionally separate. Course 1 may remain editable and publicly useful while certification gates remain open.

## Status matrix

| Area | Result | Audit finding |
|---|---|---|
| Six-module instructional content | PASS | 18 substantial lessons / 12 controlled objectives; applied scenarios, artifacts, evidence boundaries and role limits are present. |
| Safety/source accuracy | PASS WITH MAINTENANCE | No gross safety defect found in reviewed content. OSHA/NIOSH/EPA boundaries remain appropriate. Active OSHA HazCom transition dates are now explicitly tracked in both the source-verification record and the canonical HazCom reference metadata. |
| Lesson depth and application | PASS | Current 945-minute estimate is descriptive, not a ceiling; lessons use artifacts, scenarios, controlled-document models and remediation cues. |
| Lesson practice | PASS | Low-stakes lesson practice is learner accessible with immediate feedback and aligned remediation. |
| Module assessments M01–M06 | **FAIL — RUNTIME GAP** | Six 14-item formative banks exist, module objects reference them and the public release lists them, but the current catalog/portal does not render or launch them. |
| Course final structure | PASS FOR DEVELOPMENT | 36 items; all controlled objectives represented; predominantly apply/analyze; evidence-stimulus coverage present; keys are not returned through the learner assessment API. |
| Public Course 1 item secrecy | **FAIL FOR HIGH-INTEGRITY SUMMATIVE USE** | The GitHub repository is public and Course 1 question JSON stores `correct` answers and rationales. API non-disclosure is therefore not equivalent to item secrecy. The final remains suitable as an open/development academic instrument, not a secure high-stakes exam. |
| Technician I credential item secrecy | PASS / BOUNDARY HOLDS | The secure Technician I assessment ID is referenced, but its assessment object/item bank is not present in the public repository. Course 1 does not expose the separate credential bank. |
| Course final validation | **FAIL — OPEN GATE** | Public items remain development items without human assessment approval or pilot statistics. The current 80% academic threshold is provisional. |
| Authored answer-key distribution | **WARN / REVIEW REQUIRED** | Source-key positions are heavily concentrated in first position (82 of 120). Runtime choice shuffling reduces learner cueing, but authoring bias must be reviewed before validation. |
| Retake-policy enforcement | PASS AFTER REPAIR | `maxAttempts` and `cooldownHours` are now enforced when configured and fail closed if history is required but unavailable. Current Course 1 remains intentionally unlimited/no-cooldown because its values are `null` / `0`. |
| Threshold transparency in learner UI | **FAIL — COPY/GOVERNANCE** | Final/practical screens visibly present 80% as the passing/minimum score but do not yet tell learners on those screens that it is a provisional academic/development threshold pending pilot evidence and standard setting. |
| Integrated practical content | PASS FOR PILOT PREP | 100-point practical, five workflow stages, seven evidence outputs, role limits and five critical errors are coherent and job-relevant. |
| Practical scoring rubric | PARTIAL | Domain totals and broad strong/partial/weak guidance exist, but point-level observable anchors are not yet specific enough for robust inter-rater consistency. |
| Practical Form A/B equivalence | UNVALIDATED | Forms are plausible alternates but must be compared during calibration/pilot before equivalence is claimed. |
| Practical assessor calibration | **FAIL — OPEN GATE** | No accepted multi-assessor calibration evidence yet. Operational certification use remains correctly blocked. |
| Visual web assets | PARTIAL / IMPROVING | Canonical registry now includes 14 produced web SVGs. Most lessons render controlled visuals. Deviation-status and data-integrity lifecycle SVGs were salvaged from superseded PR work. |
| Visual lesson placement | PARTIAL | New Lesson 9 and Lesson 16 SVGs are registered but not yet inserted into canonical lesson blocks. Lesson 8 has a shared operator-care boundary visual but still needs the planned dedicated authority/escalation graphic. |
| Visual production masters | PARTIAL | Reference boards/production drafts exist, but factual/copy/accessibility/responsive QA and the dedicated lesson production set remain in progress. |
| Automated accessibility | PASS | Static accessibility regression checks cover structure, controls, touch targets and responsive/reflow contracts. |
| Manual rendered accessibility | **FAIL — OPEN GATE** | Keyboard, screen-reader, 200/400% zoom/reflow, contrast, assessment interaction and accommodation review remain required. |
| Course academic/credential boundary | PASS | Public course final/practical and Course Record are separated from the secure Technician I credential assessment and credential decision. |
| Certification human review | **FAIL — OPEN GATE** | No approved Course 1 scientific/editorial/assessment review records exist for the release version. |
| Pilot evidence | **FAIL — OPEN GATE** | No completed learner/item pilot evidence sufficient for validation. |
| Standard setting | **FAIL — OPEN GATE** | Current 80% values have not been confirmed through documented standard setting. |
| Final certification release approval | **FAIL — OPEN GATE** | No versioned final certification-release approval record. |
| Course/module metadata extensibility | PASS AFTER REPAIR | Core validation is retained while standard academic metadata and open `extensions` namespaces are available in course/module schemas. |
| Reference provenance/extensibility | PASS AFTER REPAIR | Reference schema now supports verification/revision metadata and an open extension namespace; HazCom verification metadata has been populated. |
| Lesson/block extensibility | PARTIAL | Lesson schema still closes top-level and rich-block structures; adding genuinely new lesson/block structures still requires schema work. |
| Generated registry governance | PASS AFTER REPAIR | Registry generation is blocking, CI no longer self-pushes generated changes, and a committed-state drift check fails when publication/registry generation changes the worktree. |
| Production-readiness source of truth | PARTIAL / SAFE-FALSE | Release workflow is fail-closed today and readiness flags remain false. `registry/system-readiness.json` is still manually maintained; critical gates should ultimately be evidence-derived rather than manually asserted. |
| Public site discoverability | **UNVERIFIED / FAIL TO CONFIRM** | Exact current searches for the Course 1 ID/title/Technician I Course 1 produced no indexed dtfseeds.com result. This does not prove no route exists, but production discoverability cannot currently be verified. |
| Competing Course 1 PRs | PASS AFTER CLEANUP | PR #323 was closed as superseded after useful unique work was salvaged and unsupported grading/content-limit logic was explicitly rejected. PR #324 is the canonical repair PR. |
| Branch lifecycle | **FAIL — REPOSITORY GOVERNANCE** | `dev` and `main` remain severely diverged, preventing a normal low-risk `fix -> dev -> staging -> main` promotion without repository-wide reconciliation. |
| Current repair-branch CI convergence | **VERIFY ON NEWEST HEAD** | Prior repair heads are green. The newest assessment-policy/package head must receive its own workflow run; absence of a run is not counted as a pass. |

## Instructional-content audit

Course 1 trains an entry cultivation technician to act inside a bounded operational role rather than teaching generalized cultivation trivia. The modules cover applied workplace safety; sanitation/biosecurity; SOP and work-order execution; traceability/inventory/waste; equipment readiness/operator care; and records/handoff/integrated workflow.

The lesson design correctly distinguishes observation from diagnosis, assigned work from protected servicing, plant-health quarantine from pesticide restricted-entry controls, and transferable quality guidance from jurisdiction-specific law. Those distinctions should be preserved during future edits.

The principal remaining learner-flow problem is the discontinuity between lesson retrieval practice and the course final: the six authored module assessments are not yet exposed by the learner runtime. They should become low-stakes module checkpoints, not credential evidence.

## Evidence and source audit

Principal sources remain defensible for their stated roles: NIOSH for cannabis workplace hazards and occupational-health framing; OSHA for workplace safety/PPE/HazCom/machine-energy-control context; EPA for Worker Protection Standard controls; university extension for greenhouse sanitation/biosecurity; GS1/ASTM for traceability/QMS transfer models; WHO/MHRA for data-integrity transfer models; HSE for shift-handover human factors; WCAG 2.2 for accessibility.

The OSHA Hazard Communication transition is now tracked in machine-readable reference metadata and the source-verification record. Course 1 should continue teaching durable worker behavior while facility training is checked against the HCS version and transition requirements applicable at delivery time.

## Assessment audit

### What is working

- final items map to controlled objectives and competencies;
- final form is application-oriented rather than recall-heavy;
- item/choice shuffling is deterministic per attempt;
- immutable item versions are preserved;
- browser final-assessment payloads omit keys/rationales;
- scoring occurs server-side;
- results return domain/competency-level information rather than answer-key disclosure;
- configured future attempt/cooldown policies now have runtime enforcement;
- the public Course 1 final cannot be substituted for the separate Technician I credential assessment.

### What still fails

- all 120 public Course 1 items need human assessment review;
- authored key positions are strongly skewed;
- no empirical difficulty/discrimination evidence exists yet;
- module tests are not surfaced by the learner runtime;
- visible threshold copy does not yet disclose provisional/standard-setting status on the assessment/practical screens;
- the public repository itself contains Course 1 `correct` keys and rationales, so the current final cannot be treated as a secret high-integrity assessment.

For any future high-integrity Course 1 summative use, keep the public blueprint/content but move protected final item keys—and preferably protected item variants—into a non-public assessment store. Do not move the secure Technician I credential bank into this public repository.

Do **not** import the competency minimum-score floors proposed by superseded PR #323. Those values were not supported by pilot/standard-setting evidence.

## Practical audit

The integrated practical is suitable for controlled pilot preparation, not yet operational certification use. Its strongest features are evidence outputs, role boundaries, critical-error rules and equivalent delivery contexts.

Before assessor calibration, expand each scoring domain from one maximum plus broad qualitative language into observable scoring levels or additive criteria. This is not a new cut-score exercise; it is required so different assessors can explain and reproduce domain scores consistently.

During calibration/pilot, compare Forms A and B for domain-score distributions, critical-error frequency, completion time and assessor interpretation before accepting equivalence.

## Visual audit

Use three explicit visual lifecycle concepts rather than overloading `produced`:

- **reference/master production** — source board/master exists;
- **web instructional asset** — accessible learner asset exists in the runtime path;
- **learner-approved visual** — factual, copy, accessibility and responsive QA completed for the lesson version.

Current priorities are to place the Lesson 9 deviation map, place the Lesson 16 data-integrity lifecycle, create the dedicated Lesson 8 authority/escalation graphic, continue the planned dedicated lesson production set, and complete manual learner-facing QA.

## Schema/extensibility audit

The project requires continuous editability, not schema-free content. Core identifiers and required structure should remain validated without turning every new instructional idea into a platform migration.

Completed:

- standard academic metadata + open `extensions` for course objects;
- standard module metadata + open `extensions` for module objects;
- verification/revision metadata + open `extensions` for references;
- question/assessment extension surfaces already existed.

Still required:

- backwards-compatible lesson-level extension surface;
- a controlled path for future rich-block types without rigid content-count quotas;
- moving useful Course 1 academic metadata from Markdown-only description into the canonical machine-readable course object on a versioned revision.

Rigid checks such as exactly six modules, exactly 18 lessons, exactly 945 minutes, minimum vocabulary/example counts, or fixed block counts are not acceptable as long-term content ceilings.

## Runtime / CI / release audit

### Repaired

- API syntax failure that stopped evaluator/API tests;
- false-green main quality suite;
- advisory pilot-prep execution;
- advisory explicit release checks;
- academic-publication/certification-state conflation;
- practical calibration/standard-setting truthfulness;
- rich-image title support;
- stale practical CSV test;
- progress semantics test;
- review-record field mismatch;
- duplicate visual registry;
- answer-key-position warning;
- course/module/reference extensibility gaps;
- generated registry false-green/self-mutating CI path;
- configured assessment max-attempt/cooldown enforcement.

### Remaining

- add learner-runtime delivery for M01–M06;
- update learner threshold copy;
- derive certification-critical production gates from versioned evidence where possible rather than relying on manually asserted readiness booleans;
- create a secure item/key boundary if Course 1 final scores are ever used as high-integrity summative evidence;
- verify actual production deployment/discoverability on dtfseeds.com;
- complete lesson/block extensibility.

## Repository audit

PR #324 is the canonical Course 1 runtime/release-integrity repair branch. PR #323 is closed and superseded. Its two useful visuals, useful syllabus structure and extensibility direction were selectively preserved; its unsupported grading floors, rubric claims and rigid content-count checks were rejected.

The repository's declared promotion path is `feature/fix -> dev -> staging -> main`, but `dev` and `main` remain severely diverged. Do not force-retarget PR #324 to `dev` until unique branch work and a deliberate reconciliation strategy are established.

## Release decision

### Public academic learning

**PASS, with known improvement work.** Course 1 can remain public, editable and useful for learning.

### Controlled pilot preparation

**PASS structurally.** Pilot-prep automation is fail-closed and has been green on recent repair heads. Human preconditions still determine whether a real pilot may open.

### Validated Course 1 certification evidence

**FAIL / NOT YET VALIDATED.** Human review, item validation, practical calibration, rendered accessibility review, pilot evidence, standard setting, secure summative-item handling where required, and final approval remain open.

### THC Cultivation Technician I credential

**NOT DETERMINED BY COURSE 1 ALONE.** The credential is a separate multi-course, multi-practical, capstone and secure-assessment program. Passing Course 1 does not issue it.

## Ordered repair backlog

1. Verify the newest repair-branch SHA through current-head CI; never infer green from an older run.
2. Wire M01–M06 into the learner experience as low-stakes module assessments using the existing safe assessment primitives.
3. Add learner-visible provisional-threshold/standard-setting language to the Course 1 final and practical.
4. Place the new Lesson 9 and Lesson 16 visuals and create the dedicated Lesson 8 authority/escalation visual.
5. Complete lesson/block extension strategy and move Course 1 academic metadata into the canonical course object on a controlled version update.
6. Tighten practical domain scoring anchors before assessor calibration.
7. Establish a protected item/key store before treating Course 1 final scores as high-integrity summative evidence; keep the credential bank private.
8. Complete human technical/editorial review and 120-item assessment review.
9. Complete rendered accessibility review.
10. Complete practical calibration and compare Forms A/B.
11. Run controlled pilot; analyze and disposition item/practical findings.
12. Conduct formal standard setting and revise provisional thresholds as supported by evidence.
13. Re-run source verification, deterministic checks and production-readiness gates.
14. Create explicit versioned certification-release approval only after validation evidence is accepted.
15. Reconcile repository branch lifecycle and verify production deployment/discoverability.

This backlog is ordered for risk reduction, not as a content ceiling. Course 1 remains continuously editable throughout the process.
