# Synthetic Evidence and Automated Approval Policy

## Purpose

The THC Learning Academy may generate synthetic review, pilot, calibration, accessibility, standard-setting, and release records **only for automated testing, demonstrations, fixtures, and end-to-end pipeline validation**.

Synthetic evidence must never be represented as evidence produced by a real reviewer, learner cohort, assessor, accessibility specialist, employer, SME, regulator, or credentialing authority.

## Automated approvals that are allowed

The system may automatically approve machine-verifiable quality gates when the relevant deterministic check passes. Examples include:

- JSON/schema validity;
- curriculum graph integrity;
- module/lesson/objective resolution;
- objective and assessment inventory coverage;
- public visual-concept coverage;
- route and asset existence checks;
- catalog visibility and status-language checks;
- public/private assessment-boundary checks;
- generated-state consistency;
- reproducible build/test checks.

These are **automated quality approvals**, not human professional judgments.

## Synthetic evidence that is allowed

Synthetic fixtures may model successful outcomes for:

- scientific/technical review;
- editorial review;
- assessment review;
- rendered accessibility review;
- practical assessor calibration;
- learner/item pilot evidence;
- standard setting;
- final credential-release approval.

Every such fixture must declare all of the following:

```json
{
  "synthetic": true,
  "productionEligible": false,
  "intendedUse": "automated-test-only"
}
```

## Production boundary

Synthetic evidence is prohibited from production evidence locations, including:

- `content/reviews/`
- `content/pilot-evidence/`
- `content/credentials/`
- `content/credential-programs/`
- any future production release or issuance evidence directory

Synthetic records must live under `test-fixtures/` or another explicitly non-production fixture path.

A production credential-release decision must ignore synthetic fixtures even when those fixtures simulate a fully successful workflow.

## Required interpretation

A passing synthetic end-to-end test means:

> the software can process a complete evidence package correctly.

It does **not** mean:

> the course or credential has actually received that evidence.

This distinction is fail-closed and must remain machine-tested.