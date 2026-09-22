# Release Policy

## Environments

Maintain separate local, development, staging, and production environments. Staging and production must use separate databases, issuer identities, signing keys, and secrets.

## Curriculum releases

Curriculum releases are explicit immutable snapshots such as `academy-2026.09`. Merging content to `main` does not publish it. Approved content must be included in an intentional release candidate and pass the production release workflow before publication.

## Development merge gate

Every pull request to `main` must pass the complete `npm test` suite. This is the repository integration gate for curriculum validation, development exam generation, credential regression tests, privacy projection tests, review-readiness reporting, and item-bank-readiness reporting.

Passing the development merge gate means the repository is internally consistent; it does **not** mean the curriculum is production-certified or ready to issue real credentials.

## Production gates

A production academic curriculum release must pass both `npm test` and `npm run release:check`.

The academic publication check fails closed unless:

- the release registry is no longer draft;
- `publicationReady` is true;
- configured **academic-publication** gates are true;
- mapped course and lessons are published;
- the final academic assessment is in an active/approved/published state when it is part of the released course;
- canonical sources/references, terminology, lesson mapping, schema validation, and referential integrity pass;
- immutable IDs are not duplicated;
- no placeholder or unverified sources are presented as verified authority in published material;
- competency-to-objective and objective-to-assessment coverage is intact;
- required learner accessibility text and governed public asset paths are present;
- project-owner release approval is recorded for the academic package;
- privacy/security regression tests applicable to the public learner surface pass.

External scientific/editorial review, controlled pilots, evaluator calibration, inter-rater evidence, psychometric validation, standard setting, accreditation, and third-party validation must be recorded truthfully when they exist. Their absence does **not** by itself block project-owner-approved academic publication and must not be represented as completed.

## Professional credential issuance boundary

Academic publication is not professional credential issuance. Credential-bearing or high-stakes operational release remains fail-closed for the controls applicable to that claim, including secure assessment/item-bank controls, identity/evidence controls, signing/issuer controls, retention/privacy controls, approved decision rules, and any explicitly required occupational or regulatory authorization. Academic publication approval must never be used as evidence that those credential controls passed.

## Release channel

Production release checks run only from an explicit `academy-*` tag or a manual invocation of the production release workflow. This keeps ordinary development merges separate from publication.

## Rollback

Application deployments and curriculum releases must be independently rollback-capable. Rolling back application code must not erase or reinterpret historical learner, assessment, or credential records.
