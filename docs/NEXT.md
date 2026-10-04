# Next Build Queue

**Status date:** 2026-10-03

## Current priority: close professional-certification release blockers

The canonical THC Academy Technician curriculum is **15 dedicated certification courses** (7 Technician I + 8 Technician II). The separate 420+ encyclopedia/resource library is a reference and general-education system; it is not the certification-course count and must not be substituted for required certification instruction.

All 15 canonical certification courses are academically published, and the current completion registries report the machine-resolvable course-content layer complete. Do **not** restart course architecture, recreate completed course shells, or reopen previously closed machine-content work without a concrete regression, failed current-version quality gate, or verified learner-facing defect.

The project is now in a release-readiness phase. Academic publication and professional credential authorization are different states.

## What is already complete enough to stop rebuilding

- 15 canonical certification courses exist: Technician I (7) and Technician II (8).
- Canonical course, lesson, objective, assessment, practical/capstone, learner-support, source/evidence, and credential-control structures exist.
- The academic course packages are published for learning use.
- Course-derived assessment structures and integrated practical/capstone paths exist.
- Public academic learner routes/readback and exact deployment/source identity have been recorded for the canonical course set.
- Public credential-purpose items are explicitly classified as unsuitable for secure operational credential use.
- Production credential-form generation from the public repository fails closed.
- The secure-assessment adapter enforces a private-operational provider contract and strips scoring keys/rationales from delivery projections.
- Credential issuance and verification contracts exist, while operational issuance remains intentionally disabled until release gates are satisfied.

Content improvement remains allowed when a current audit finds a factual, instructional, accessibility, assessment-alignment, source, visual, or learner-experience defect. Improvement work must be evidence-driven rather than an automatic reopening of every course.

## Primary technical focus: deploy and validate the operational certification system

Issue **#333 — Retire public credential-purpose items from operational use and move secure bank private** now has the core machine architecture implemented: an isolated PostgreSQL secure-store provider/schema, exact private-item retrieval, fail-closed production bootstrap integration, secure credential assessment start/resume/save/submit/scoring, exposure tracking, item quarantine, and an MFA-gated private-bank administration lifecycle. The remaining work is deployment and real operational evidence, not another public item-bank implementation.

Credential-purpose item material and scoring information have existed in public Git history. Those exposed items must be treated as compromised for high-integrity operational credential decisions even if the current learner client hides answer keys.

Therefore:

1. Never activate or reuse exposed public credential-purpose items as the professional operational bank.
2. Keep public keyed items only as development/training blueprints where useful.
3. Create **new protected operational items** through the private admin lifecycle in a deployed approved assessment store/service; never seed them from public Git.
4. Use the private operational namespace and source-class contracts required by the current secure-store adapter.
5. Keep operational scoring keys, protected variants, candidate attempts, learner identities, signing secrets, and private assessment evidence outside the public repository.
6. Validate least-privilege access, privileged-access auditing, encryption in transit and at rest, backup/restore, key-management separation, environment separation, incident response, and access-control enforcement on the real deployed provider.
7. Validate form construction/equivalence without exposing the protected bank.
8. Preserve the existing fail-closed public-bank boundary throughout implementation.

A provider capability declaration or green unit test is not proof that these controls are deployed or independently validated.

## Release-readiness execution order

Work the remaining finish line in dependency order:

1. **Current-version baseline reconciliation**
   - Run repository inventory, content-readiness, source-health, assessment/test-to-teaching, release-dependency, and work-queue checks.
   - Repair only concrete defects found against the current exact versions.
   - Keep completion/review/deployment ledgers synchronized.

2. **Rendered learner UX and accessibility QA**
   - Review the deployed course, lesson, assessment, practical-submission, completion, transcript, certificate, and verification surfaces.
   - Test keyboard/focus, screen-reader semantics, zoom/reflow, contrast, validation/error states, mobile/responsive behavior, timed-assessment accommodations, and downloadable learner materials.
   - Record real defects and evidence; do not convert automated reachability into a false accessibility approval.

3. **Human technical, instructional, and assessment review**
   - Execute the prepared exact-version review packets.
   - Resolve factual, scientific, instructional, source, assessment, or scope defects through versioned changes.
   - Human-reviewed/approved labels require actual human review records.

4. **Controlled learner and assessment pilots**
   - Collect real participant/item/practical evidence under approved privacy/consent controls.
   - Analyze timing, difficulty, discrimination where supportable, distractor behavior, learner feedback, ambiguity, and failure modes.
   - Never invent pilot statistics or mark a generated template as completed evidence.

5. **Practical/capstone validation and evaluator calibration**
   - Validate Technician I and II practical/capstone workflows against current rubrics.
   - Collect evaluator qualification, calibration, inter-rater, critical-failure, remediation, and evidence-retention records.

6. **Private operational assessment bank and secure forms**
   - Deploy and validate the private assessment provider.
   - Author/review/pilot new protected operational item material.
   - Validate blueprint coverage, form equivalence, scoring, exposure controls, and delivery boundaries.

7. **Formal standard setting**
   - Establish passing standards and decision rules using the approved evidence and qualified participants.
   - Record methods, judgments, rationale, calculations, conflicts, and approvals.

8. **Production identity, security, persistence, and recovery**
   - Validate authentication/authorization, admin MFA where required, persistence/migrations, assessment-store boundaries, audit logging, rate limiting, secrets/key delivery, signing, revocation, monitoring/alerts, backup/restore, retry/failure behavior, and incident procedures on the deployed system.

9. **Candidate governance and final authorization**
   - Finalize eligibility, identity, retest, accommodations, appeals, misconduct, privacy/retention, transcript/certificate, verification, revocation, issuer/signing authority, and release authorization.
   - Release only when the authoritative evidence reconciler and `npm run release:check` pass for the exact versions being authorized.

## Current commands

Use the current repository gates before opening new work:

```bash
npm run certification:inventory
npm run certification:content-readiness
npm run certification:sources:health
npm run finalize:status
npm run certification:release-dependencies
npm run certification:work-queue
npm test
npm run release:check
```

A failing check should create a concrete repair target. A green machine check must not be interpreted as human review, pilot evidence, accessibility approval, psychometric validation, security validation, or credential authorization.

## Definition of done

### Academic courseware
Academically complete means a learner can move through all required course material without unresolved placeholders, thin shell instruction, unsupported claims, missing required applied practice, assessment/teaching mismatch, or material learner-surface defects identified by the current quality gates.

### Professional certification
Professionally release-ready means the exact release versions have complete required review, accessibility/UX, pilot, practical/capstone, calibration, standard-setting, secure operational assessment, identity/security/persistence/recovery, governance, and final authorization evidence, and the fail-closed release check passes.

Until then, the Academy may truthfully provide academically published learning while professional credential issuance remains disabled.
