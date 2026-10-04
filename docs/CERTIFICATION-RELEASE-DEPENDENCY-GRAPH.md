# Certification Release Dependency Graph

Certification release is not a flat checklist. Some evidence can be collected in parallel, but later decisions must not leapfrog the evidence they depend on.

The repository now derives a release dependency graph from the authoritative certification evidence reconciler and the production-control evidence reconciler.

## Enforced dependency rules

For a conventional final, standard-setting evidence cannot reach `evidence-complete` or `approved` unless exact-version assessment review, course pilot execution, and item analysis have reached at least evidence-complete status.

Secure operational form readiness cannot reach `evidence-complete` or `approved` unless exact-version assessment review, item analysis, and standard setting have reached at least evidence-complete status.

Credential authorization is program-wide. An `approved` credential authorization requires every other applicable certification gate for every course in that credential program to be approved, plus all 13 production controls to have approved deployment-backed evidence. An `evidence-complete` authorization record likewise cannot outrun evidence-complete prerequisites.

These rules do not manufacture evidence and do not require work that is genuinely independent to happen serially. They prevent later governance states from being recorded ahead of their prerequisite evidence.

## Commands

- `npm run certification:release-dependencies`
- `npm run certification:release-dependencies:json`
- `npm run certification:release-dependencies:check`

The check fails only on contradictory/premature evidence states. Normal open gates remain reported as blockers without failing the repository.
