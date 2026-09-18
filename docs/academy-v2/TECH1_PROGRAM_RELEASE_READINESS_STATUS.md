# Technician I Program Release-Readiness Status

**Program:** `CREDPROG-CULT-TECH-I-001 — THC Cultivation Technician I`  
**Status date:** 2026-09-16

## Current interpretation

**Seven-course source/package architecture:** machine-complete under the current contract.  
**Credential machine/control layer:** built and fail-closed.  
**Public/deployed evidence for Courses 2–7:** still requires fresh responsive/readback verification.  
**Professional credential issuance:** **BLOCKED**.

Green CI proves repository/package consistency. It does not authorize certification issuance.

## Machine controls now present

- all seven Technician I source packages are enforced through `scripts/report-tech1-course-package-readiness.mjs --require-source-package`;
- Course 2–6 learning-loop and balanced-assessment audits are enforced in CI;
- Course 7 integrated lab is controlled through its readiness bank, Practicals A–F, capstone, critical-failure, equivalent-form, evaluator, remediation/retest, accessibility and evidence-retention artifacts;
- `registry/technician-i-jta-competency-crosswalk.json` maps the 13-domain JTA development baseline to current program competencies, courses, practicals and capstone;
- `registry/technician-i-machine-layer.json` records required credential machine artifacts and fail-closed security boundaries;
- `ASSESS-CRED-TECH1-001` is a public **draft blueprint only** and contains zero operational secure items;
- the secure assessment-store contract and equivalent-form rules explicitly prohibit promotion of public development items into operational credential forms;
- candidate retest/remediation/accommodation/appeal/security and evidence-retention/privacy drafts are present;
- the issuance/verification workflow contract is present;
- the API already exposes read-only public credential verification and persistent status-transition infrastructure, while initial Technician I issuance remains intentionally disabled;
- `scripts/test-tech1-machine-layer.mjs` and `scripts/test-tech1-release-readiness.mjs` keep these boundaries deterministic.

## Critical-failure governance

The development program rule now aligns with the five controlled critical-failure classes in `registry/technician-i-integrated-lab-plan.json`:

1. serious unresolved safety hazard;
2. identity/genealogy break;
3. evidence/data-integrity falsification;
4. unauthorized treatment, repair/bypass or product-release action;
5. unauthorized movement/release from an active hold.

An aggregate score cannot silently erase one of these failures. Their final operation still requires validation and formal decision-rule approval.

## Machine work still open

- fresh deployed responsive/manual learner QA for Courses 2–7;
- anonymous public readback and exact deployment SHA/route evidence where public learner delivery is intended;
- Course 6 individual Google Drive asset mirrors and real returned mirror IDs;
- ongoing synchronization of readiness/release evidence with exact versions and deployment state;
- any further issuance implementation only after an approved private assessment/evidence decision system exists.

## Release gates still requiring real evidence

- human technical/curriculum review;
- human assessment review;
- rendered accessibility approval;
- validated job-task analysis;
- SME/employer validation;
- controlled pilot evidence;
- Practical A–F validation;
- integrated capstone validation;
- evaluator calibration and inter-rater evidence;
- final credential-assessment blueprint weights;
- new secure operational item bank in an approved private assessment store;
- approved secure assessment delivery/store controls;
- equivalent secure credential forms and equivalence evidence;
- formal standard setting/final cut scores and decision rules;
- approved candidate-evidence retention/privacy policy;
- approved credential issuance/security workflow;
- explicit versioned final program release approval.

No synthetic review, pilot, calibration, standard-setting, security, privacy, psychometric or approval record may be created to close these gates.

## Release rule

Technician I remains non-issuable while any required release gate is unresolved. Course completion, package completeness, public deployment, source-package CI, or assistant-generated governance drafts are not substitutes for credential validation and approval.
