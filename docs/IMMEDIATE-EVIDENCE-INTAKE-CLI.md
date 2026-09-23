# Immediate Evidence Intake CLI

The certification work queue now has executable intake commands for the major **ready-now** evidence classes that previously lacked a safe record-creation path.

These commands are intentionally conservative. They create only `collecting` or `in-progress` records and never mark evidence complete or approved.

## Course pilot execution

`npm run evidence:intake:pilot -- --course COURSE-LH-TECH1-001 --pilot-id PILOT-2026-A --cohorts 1 --participants 12 --authority PILOT-LEAD [--write]`

The script pins the current course version and opens the pilot with all completion flags false.

## Rendered accessibility / learner UX

`npm run evidence:intake:accessibility -- --course COURSE-LH-TECH1-001 --build <build-id> --reviewer <id> --platform Windows --browser Chrome --input keyboard --viewport "1280px / 200%" [--at NVDA] [--known-failures 0] [--write]`

All coverage flags start false. A zero known-failure count does **not** imply the review is complete.

## Occupational program validation

`npm run evidence:intake:occupational -- --program CREDPROG-CULT-TECH-I-001 --authority PROGRAM-VALIDATION-LEAD [--write]`

This locks every current course version in the program and derives the current mapped practical/capstone count while leaving all validation decisions false/pending.

## Production control validation

`npm run evidence:intake:production -- --control backup-restore --environment production --authority PLATFORM-LEAD --evidence-ref RUN-12345 [--write]`

At least one safe evidence reference is required. Never provide secrets, tokens, passwords, private keys, or learner PII.

## Existing intake paths

The repository already provides:

- `scripts/create-review-record.mjs` for exact-version assessment/scientific/editorial/accessibility/legal-compliance review decisions;
- `scripts/build-practical-calibration-evidence.mjs` for assessor calibration aggregation;
- `scripts/create-pilot-evidence-template.mjs` and the pilot aggregator for item-level analysis;
- `scripts/create-certification-gate-evidence-record.mjs` for controlled gate attestations after underlying evidence exists.

The new intake scripts fill the missing operational gap without fabricating evidence.
