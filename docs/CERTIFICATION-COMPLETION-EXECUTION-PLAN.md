# THC Academy Certification Completion Execution Plan

Status date: 2026-09-23 (America/Detroit)

## Purpose

This document is the execution plan for taking the existing THC Academy Technician I and Technician II academic course system from academically published courseware to defensible professional certification release.

It replaces the older assumption that the project still needs a generic "420-course" build. The encyclopedia/reference library and the certification system are separate products. Certification uses dedicated course instruction and course-derived assessments. Encyclopedia material is optional reference material and cannot substitute for taught certification content.

## Current baseline

The repository contains 15 canonical Technician certification courses: 7 Technician I courses and 8 Technician II courses. Thirteen use dedicated conventional finals; Technician I Course 7 and Technician II Course 8 are integrated performance labs/capstones.

All 15 course completion registries currently report machine-resolvable work complete with no remaining machine content action in their course ledgers. The academic course packages are published. The professional credential release is not yet authorized because several gates depend on evidence that must come from real review, candidates/evaluators, rendered interfaces, operational systems, or formal decision processes.

The authoritative professional release state is the certification evidence reconciler, not a legacy completion spreadsheet, an owner-approval statement, or a course publication flag.

## Completion definition

The project is professionally release-ready only when all current-version certification evidence dependencies are satisfied and the fail-closed release check passes. A valid release therefore requires both:

1. complete, source-supported instruction and course-derived assessments; and
2. genuine validation/governance/production evidence for the credentialing process.

No synthetic record may be used to claim that a pilot, human review, calibration exercise, standard-setting panel, accessibility evaluation, security validation, or operational deployment occurred when it did not.

## Dependency-ordered execution

### Stage 1 — Freeze and review the exact academic baseline

Use the current 15-course baseline and its exact lesson, assessment, practical, rubric, and capstone versions. Run the source-health, content-readiness, instructional-depth, final-quality, test-to-teaching, and release-dependency checks before external evidence collection.

Execute the prepared technical/curriculum, instructional-design, and assessment-review packets against the exact current versions. Resolve any factual, instructional, assessment, or source defect through versioned changes; then regenerate affected review packets.

For scientific claims, prefer primary peer-reviewed research, systematic/review literature where appropriate, government/standards sources, and university extension sources. Record provenance and limitations. General horticultural guidance must not be converted into universal cannabis setpoints without cannabis-specific evidence or a clearly identified facility-specific SOP.

Exit condition: exact-version technical and assessment content is accepted for pilot use and source reconciliation reports no unresolved structural defects.

### Stage 2 — Rendered accessibility and learner-experience validation

Test the actual learner-facing course, assessment, practical-submission, completion, transcript, and verification interfaces. Validate WCAG 2.2 AA requirements with automated checks plus manual keyboard, focus, screen-reader, zoom/reflow, contrast, error-identification, mobile/responsive, and timed-assessment/accommodation review.

Accessibility findings that change scored content or learner instructions must flow back through version control and exact-version review.

Exit condition: accessibility/UX evidence is complete for the release versions and no blocking issue remains.

### Stage 3 — Controlled course and assessment pilots

Run the controlled pilot protocols with real eligible participants under the defined consent/privacy and data-handling process. Capture completion, item responses, timing, learner feedback, failure modes, and other protocol-defined evidence.

Analyze objective coverage, item difficulty, discrimination where sample size supports it, distractor performance, missing/ambiguous content signals, timing, and adverse usability effects. Do not over-interpret unstable statistics from small samples; preserve sample size and uncertainty in the evidence.

Revise weak items/instruction as needed, version them, and repeat affected review/pilot work according to the invalidation rules.

Exit condition: required pilot and item-analysis evidence is accepted for the operational assessment baseline.

### Stage 4 — Practical/capstone validation and assessor calibration

Validate Technician I Practicals A-F and its capstone/integrated lab requirements, plus Technician II Practicals A-G and the Senior Technician capstone/integrated simulation.

Train/calibrate evaluators using the current rubrics and representative evidence. Measure agreement using the protocol-defined method, investigate material disagreement, revise rubric anchors where needed, and re-calibrate after substantive rubric changes.

Confirm that critical-fail rules, safety/authority boundaries, evidence-retention requirements, appeal/review paths, and evaluator permissions are operationally usable.

Exit condition: the practical/capstone system has accepted validity and calibration/inter-rater evidence for the current versions.

### Stage 5 — Formal standard setting and secure operational forms

Conduct the documented standard-setting process using qualified participants and the approved assessment/performance evidence. Record panel composition, method, judgments, calculations, rationale, conflicts, decisions, and approval.

Build secure operational forms from the approved private item pool. Validate blueprint coverage, form equivalence, scoring, security boundaries, exposure controls, and operational delivery rules. Public development items must not become the private operational credential bank by convenience.

Exit condition: passing standards/decision rules and secure operational forms have accepted evidence.

### Stage 6 — Production security and operations validation

Deploy and validate the real production stack rather than marking code-readiness flags as operational proof. Required evidence includes the applicable production database/persistence path and migrations, identity/authentication/authorization, admin MFA, row-level/data authorization controls, secure secret/key delivery, credential signing, revocation persistence, assessment-store boundaries, rate limiting, logging/observability, monitoring/alerting, backup and restore, failure/retry behavior, incident procedures, staging validation, and production smoke evidence.

Run restore and failure exercises where required by the repository contracts. Keep secrets, learner PII, operational answer keys, assessment attempts, and private signing material outside the public repository.

Exit condition: infrastructure-backed readiness gates have evidence from the deployed system and required security/operations review is complete.

### Stage 7 — Candidate governance and final credential authorization

Finalize candidate eligibility, identity, attempt/retest, accommodation, appeals, misconduct, records retention, privacy, certificate/transcript, verification, expiration/renewal if applicable, revocation, issuer identity, signing authority, and authorization policies.

Reconcile all exact-version course evidence and program-level dependencies. Final credential authorization may occur only after its prerequisite evidence gates are approved or explicitly not applicable under the governing schemas.

Exit condition: `npm run release:check` and the authoritative certification evidence reconciler report the release baseline ready, with no unresolved required gate.

## Work that is already complete enough to stop rebuilding

Do not restart the course architecture. Do not merge the encyclopedia into certification. Do not replace dedicated course finals with generic 420-topic questions. Do not create another parallel source of truth.

The productive work from this point is validation, evidence execution, defect correction, source maintenance, production integration, and release governance.

## Continuous-improvement rule

After release, course, assessment, practical, source, and policy changes remain versioned. A substantive change to a scored/reviewed object triggers the relevant stale-evidence and re-review rules. Source verification should be maintained as a recurring health function rather than treated as a one-time launch task.
