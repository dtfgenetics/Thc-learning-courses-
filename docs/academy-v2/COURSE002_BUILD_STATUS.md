# Technician I Course 002 — Current Build & Readiness Status

Course: `COURSE-LH-TECH1-002` — **Plant Observation, Growth Stages & Crop Records**  
Current course version: `0.10.0`  
Current status: `published` for owner-approved academic use; professional credential validation remains separate

## What is built

Course 002 now has a complete published academic instructional package rather than only a course shell:

- dedicated module: `MOD-LH-TECH1-002-OBSERVATION`;
- five measurable Course 002 learning objectives;
- four applied course-specific lessons;
- 12 distinct formative items;
- 20 distinct summative-development items;
- formative module assessment `ASSESS-LH-TECH1-002-M01`;
- published summative academic course assessment `ASSESS-LH-TECH1-002-FINAL`;
- 10 governed learner assets: 7 embedded teaching visuals and 3 downloadable practice worksheets;
- public learner asset paths under `apps/web/public/assets/course2/`;
- legacy SVG provenance mirrors remain recorded under `Course 2 — Visual Learning Boards`; production WebP Drive mirroring is not claimed until separately verified;
- deterministic asset-delivery contract covering raster public paths, legacy provenance, accessibility metadata and canonical lesson reachability;
- explicit development mapping to `PRACTICAL-TECH1-A`;
- machine-readable Course 2 → Practical A objective crosswalk at `registry/course2-practical-a-crosswalk.json`;
- deterministic crosswalk test that checks mappings against canonical learning-objective files and the actual Practical A document.

## Instructional emphasis

Course 002 trains a Technician I to:

1. execute a representative and reconstructable crop-observation route;
2. describe developmental and reproductive stage from observable morphology rather than calendar time alone;
3. separate direct observation, spatial/population pattern, contextual evidence, provisional interpretation and unsupported causal diagnosis;
4. create reconstructable crop/photo records with useful context, identity, timing, uncertainty and image-fidelity controls; and
5. follow supplied escalation and handoff procedures without exceeding Technician I authority.

## Learner-asset coverage

All four Course 2 lessons now have dedicated visual support.

Embedded visuals cover:

- representative crop-walk route and denominator context;
- spatial-pattern comparison;
- morphology-based developmental staging;
- reproductive morphology reference;
- observation → pattern/context → interpretation → confirmation/escalation boundary;
- diagnostic-photo evidence sequence; and
- reconstructable record/handoff continuity.

Downloadable practice assets cover:

- crop-walk room-map practice;
- reconstructable observation/handoff practice; and
- photo-evidence quality audit practice using synthetic example image sets.

These assets are instructional aids. They do not replace facility SOPs, diagnostic authority, jurisdiction-specific requirements or human technical review.

## Assessment design

The Course 002 development bank contains 32 course-specific items: 12 formative and 20 summative-development items. Formative and summative sets are non-overlapping. The summative bank covers all five objectives with at least four items per objective and is predominantly applied/analyze level.

This remains a **development bank**, not a secure operational credential bank. Public Course 002 items must not be treated as the private operational credential bank required for final certification release.

## Practical A performance mapping

Course 002 maps to `PRACTICAL-TECH1-A — Safe Room Entry & Crop Inspection`.

The development crosswalk verifies that all five Course 2 objectives are observable through real Practical A task text, scoring categories, expected evidence and deliverables. Examples include:

- route/identity → verify room/batch identity + follow a repeatable inspection route;
- morphology → record plant stage, vigor and morphology;
- evidence boundaries → inspect systematically, interpret context and avoid unsupported diagnosis;
- records/photos → photograph or mark findings and complete the inspection record;
- escalation/handoff → document follow-up needs and complete shift handoff.

**Important:** mapping coverage is not practical validation. Practical A remains `development` in the integrated lab plan.

## Automated readiness achieved

The repository can automatically verify that:

- the four lessons, five objectives and assessments exist;
- the 32 Course 2 items satisfy the current structural/quality contract;
- Course 2 remains professionally credential-gated even though its academic package is published;
- all 10 production WebP learner assets exist, are publicly addressable and reachable from canonical lessons, while retired SVG provenance and its recorded Drive mirrors remain traceable;
- all five Course 2 objectives map to actual Practical A tasks/evidence/deliverables; and
- no crosswalk field falsely advances human review, pilot or practical-validation status.

Passing these checks establishes repository/build readiness only. It does not establish certification approval.

## Course-specific gates still open

The following work requires real review or observed evidence and must not be synthetically closed:

- **Human technical/curriculum review:** not started.
- **Human assessment review:** not started at the program release-gate level.
- **Rendered accessibility review:** not started; machine raster/path and text-alternative checks do not replace rendered/manual review.
- **Practical A validation:** not started; the practical remains a development form.
- **Controlled pilot evidence:** not started.
- **Evaluator calibration / inter-rater evidence:** not started at the credential-program level.

Course 002 may remain published for academic study while these professional-validation gates remain unresolved; those gates continue to block professional credential issuance.

## Program-wide blockers beyond Course 2

Technician I credential release also requires program-level gates that Course 2 alone cannot close, including validated JTA and SME/employer evidence, capstone validation, secure private operational item bank/forms/store, formal standard setting, candidate-evidence retention/privacy approval, credential-issuance workflow approval and final versioned program release approval.

See:

- `registry/technician-i-release-evidence.json`
- `registry/technician-i-integrated-lab-plan.json`
- `scripts/report-tech1-release-readiness.mjs`

## Next legitimate actions

1. Conduct human technical review of Course 002 content, sources, visuals and practice worksheets.
2. Conduct rendered accessibility review across supported learner layouts.
3. Pilot Practical A using the Course 2 objective crosswalk as one observation guide, while retaining the integrated practical's broader safety/environment scope.
4. Collect real evaluator/pilot evidence; do not fabricate approval records.
5. Revise the course/practical from observed review findings.
6. Advance status only through the established release-gate process.

The automated content, assessment, learner-asset and Practical A mapping layers are now substantially built. The remaining Course 002 professional-certification blockers are primarily **human review and empirical performance-validation gates**, not missing basic course scaffolding or academic-publication state.
