# Release Policy

## Environments

Maintain separate local, development, staging, and production environments. Staging and production must use separate databases, issuer identities, signing keys, and secrets.

## Curriculum releases

Curriculum releases are explicit immutable snapshots such as `academy-2026.09`. Merging content to `main` does not publish it. Approved content must be included in an intentional release candidate and pass the production release workflow before publication.

## Development merge gate

Every pull request to `main` must pass the complete `npm test` suite. This is the repository integration gate for curriculum validation, development exam generation, credential regression tests, privacy projection tests, review-readiness reporting, and item-bank-readiness reporting.

Passing the development merge gate means the repository is internally consistent; it does **not** mean the curriculum is production-certified or ready to issue real credentials.

## Production gates

A production curriculum release must pass both `npm test` and `npm run release:check`.

The production release check fails closed unless:

- the release registry is no longer draft;
- `publicationReady` is true;
- every configured registry publication gate is true;
- mapped course and lessons are published;
- the final assessment is in an active/approved/published state;
- every mapped lesson/version has approved scientific and editorial review records;
- schema validation and referential integrity pass;
- immutable IDs are not duplicated;
- no placeholder/unverified sources are used by published credential-bearing material;
- competency-to-objective and objective-to-assessment coverage is intact;
- required human review approvals exist;
- assessment item pools satisfy the configured active-item minimum before the approved-item-pool gate can be true;
- privacy/security regression tests pass.

Accessibility and legal/compliance approvals remain required where their configured review scope applies. The release gate may be strengthened as those machine-readable records are added; it must not be weakened merely to publish a draft.

## Release channel

Production release checks run only from an explicit `academy-*` tag or a manual invocation of the production release workflow. This keeps ordinary development merges separate from publication.

## Rollback

Application deployments and curriculum releases must be independently rollback-capable. Rolling back application code must not erase or reinterpret historical learner, assessment, or credential records.
