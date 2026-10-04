# Technician I Program Release-Readiness Status

**Program:** `CREDPROG-CULT-TECH-I-001 — THC Cultivation Technician I`  
**Status date:** 2026-09-24

## Current interpretation

**Seven-course source/package architecture:** machine-complete under the current contract.  
**Credential machine/control layer:** built and fail-closed.  
**Public/deployed learner delivery for Courses 2–7:** route/readback and exact deployment build/source identity verified in the current readiness records.  
**Course 6 controlled Drive mirrors:** 8/8 present with verified file IDs in the governed asset registry.  
**Rendered responsive/accessibility review:** still requires real human evidence.  
**Professional credential issuance:** **BLOCKED**.

Green CI proves repository/package consistency. Public deployment proves delivery of the academic package. Neither authorizes professional certification issuance.

## Machine controls now present

- all seven Technician I source packages are enforced through `scripts/report-tech1-course-package-readiness.mjs --require-source-package`;
- Course 2–6 learning-loop and balanced-assessment audits are enforced in CI;
- Course 7 integrated lab is controlled through its readiness bank, Practicals A–F, capstone, critical-failure, equivalent-form, evaluator, remediation/retest, accessibility and evidence-retention artifacts;
- `registry/technician-i-jta-competency-crosswalk.json` maps the 13-domain JTA development baseline to current program competencies, courses, practicals and capstone;
- `registry/technician-i-machine-layer.json` records required credential machine artifacts and fail-closed security boundaries;
- `ASSESS-CRED-TECH1-001` is a public **draft blueprint only** and contains zero operational secure items;
- the secure assessment-store contract and equivalent-form rules explicitly prohibit promotion of public development items into operational credential forms;
- candidate retest/remediation/accommodation/appeal/security and evidence-retention/privacy preparation artifacts are present;
- the issuance/verification workflow contract is present;
- the API exposes read-only public credential verification and persistent status-transition infrastructure, while initial Technician I issuance remains intentionally disabled;
- public course/lesson/assessment or readiness-check readback and exact deployment build/source identity are recorded as verified for Courses 2–7 in the current readiness matrix;
- Course 6 has all 8 controlled Google Drive asset mirrors recorded with verified file IDs;
- `scripts/test-tech1-machine-layer.mjs`, `scripts/test-tech1-release-readiness.mjs`, certification dependency checks, and deployment/readback workflows keep these boundaries deterministic.

## Critical-failure governance

The development program rule aligns with the five controlled critical-failure classes in `registry/technician-i-integrated-lab-plan.json`:

1. serious unresolved safety hazard;
2. identity/genealogy break;
3. evidence/data-integrity falsification;
4. unauthorized treatment, repair/bypass or product-release action;
5. unauthorized movement/release from an active hold.

An aggregate score cannot silently erase one of these failures. Their final operation still requires validation and formal decision-rule approval.

## Machine work still open

The previously listed Course 2–7 public readback/deployment-evidence gap and Course 6 Drive-mirror gap are no longer current machine blockers.

Remaining machine-side work is limited to:

- keep readiness/release evidence synchronized with exact source versions and deployment state as the repository changes;
- retain deterministic regression coverage for deployment identity, source/package integrity, accessibility hooks, assessment boundaries, evidence provenance, privacy/security preparation and release dependencies;
- do not enable credential issuance or operational secure-form delivery until the required private assessment/evidence decision system and real approval evidence exist.

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

Technician I remains non-issuable while any required professional release gate is unresolved. Academic course-package completion and deployment can proceed independently where their own checks pass, but professional credential issuance remains fail-closed until the required human, pilot, psychometric, security/privacy and final approval evidence exists.
