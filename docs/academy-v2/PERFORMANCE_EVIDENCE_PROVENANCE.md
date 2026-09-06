# THC Academy V2 — Performance Evidence Provenance

## Purpose

Employment-oriented credentials must be able to distinguish a recorded practical score from verified performance evidence. This contract defines the minimum provenance carried by the runtime for practical and capstone assessment results.

## Canonical performance result identity

A performance result is identified by:

- learner
- performance assessment ID
- performance assessment version

Eligibility must use the current canonical performance-assessment definition referenced by the credential. Evidence from a different assessment version does not satisfy the current requirement.

## Verification provenance

A persisted performance result is considered verified only when all of the following trusted fields are present:

- evaluator identity in the private persistence record
- evaluation timestamp
- rubric ID
- rubric version
- supported delivery mode

Supported delivery modes are:

- `virtual-facility`
- `supervised-lab`
- `workplace-equivalent`

The learner-facing API receives only the verification state and non-sensitive provenance needed to understand the result. Evaluator identity remains private.

## Learner-facing performance evidence

The learner progress response may expose:

- assessment ID
- assessment version
- status
- score percent
- critical-error count
- evidence verification state
- rubric ID/version
- delivery mode
- evaluation timestamp
- record update timestamp

It must not expose the private evaluator identifier.

## Eligibility behavior

For credentials requiring verified performance evidence, the eligibility engine must fail closed when any required practical or capstone has:

- no canonical definition
- no recorded result
- a non-passing status
- no assessment version
- a version different from the canonical definition
- no score
- a score below the performance assessment's own passing standard
- a prohibited critical error
- incomplete verification provenance

## Database contract

`performance_assessment_results` stores assessment version, evaluator, rubric, delivery mode, evaluation time, score and critical-error information. Database schema version 3 represents the performance-provenance migration.

## Privacy boundary

Evaluator identity is operational/audit information. It can be used internally to establish evidence provenance but is not part of the learner-facing credential-progress payload or public credential projection.
