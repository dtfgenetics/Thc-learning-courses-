# Release Policy

## Environments

Maintain separate local, development, staging, and production environments. Staging and production must use separate databases, issuer identities, signing keys, and secrets.

## Curriculum releases

Curriculum releases are explicit immutable snapshots such as `academy-2026.09`. Merging content to `main` does not publish it. The Academy remains continuously editable on its authoring path until the project owner selects a completed scope for release.

## Development merge gate

Ordinary pull requests to `dev` use the authoring-safe quality suite. It validates curriculum structure, references, assessment logic, security boundaries, deterministic runtime/API behavior, accessibility regressions, and other defects that can be verified during active development.

Incomplete review queues, pilot work, staging readiness, production infrastructure, issuer keys, or release status do **not** block ordinary curriculum creation or correction.

Passing the development merge gate means the repository is internally consistent enough to continue building. It does **not** claim that the entire Academy scope is complete or that a production release has been selected.

## Production gates

A production curriculum release must pass `npm run test:release` and the scoped `npm run release:check` for the selected course/credential scope.

Release-only checks may require:

- the selected release registry to be out of draft;
- `publicationReady` and configured release gates to match the selected snapshot;
- mapped course, module, lesson, and assessment objects to be in release-eligible states;
- schema validation and referential integrity;
- immutable IDs to remain unique;
- cited/source-backed claims to resolve without placeholders or broken evidence references;
- competency-to-objective and objective-to-assessment coverage to remain intact;
- assessment pools and scoring rules to satisfy the selected credential design;
- privacy/security regression tests to pass;
- staging, signing, persistence, rollback, and operational controls required by that release to be configured.

Historical review records may be retained as audit evidence, but they must not freeze future authoring. Final project judgment belongs to the project owner after the requested build is complete; the repository must not manufacture or demand per-edit approval records simply to allow ongoing work.

## Release channel

Production release checks run only from an explicit `academy-*` tag or a manual invocation of the production release workflow. This keeps ordinary development merges separate from publication.

## Rollback

Application deployments and curriculum releases must be independently rollback-capable. Rolling back application code must not erase or reinterpret historical learner, assessment, or credential records.
