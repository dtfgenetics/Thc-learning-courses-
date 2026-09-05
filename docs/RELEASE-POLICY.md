# Release Policy

## Environments

Maintain separate local, development, staging, and production environments. Staging and production must use separate databases, issuer identities, signing keys, and secrets.

## Curriculum releases

Curriculum releases are explicit immutable snapshots such as `academy-2026.09`. Approved content is not automatically public; it must be included in a release candidate and pass validation before publication.

## Production gates

A production curriculum release must pass:

- schema validation
- referential integrity
- no duplicate immutable IDs
- no placeholder/unverified sources in published credential-bearing material
- competency-to-objective coverage
- objective-to-assessment coverage
- accessibility checks for published media/interfaces
- automated tests and application build
- required human review approvals

## Rollback

Application deployments and curriculum releases must be independently rollback-capable. Rolling back application code must not erase or reinterpret historical learner, assessment, or credential records.
