# THC Academy Content Model

## Hierarchy

Program -> Course -> Module -> Lesson -> Learning Objective -> Competency -> Assessment Item.

References support claims and instructional/assessment content. Credentials reference published program/course versions and deterministic eligibility rules.

## Immutable identity

Object IDs never depend on titles or URLs. Titles, slugs, descriptions, and display order may change; IDs do not.

## Versioning

Every published object has an immutable semantic version. Historical learner and credential records must reference exact versions.

## Publishing constraints

- Every lesson must map to at least one competency and learning objective.
- Every credential-bearing competency must be assessed by approved summative/credential items.
- Every technical assessment item must have reviewed references.
- Placeholder or unverified references block production publication.
- Broken cross-object references fail CI.

## Future claim model

Scientific claims will become first-class objects so a changed or superseded source can identify every lesson, objective, question, and credential program that depends on it.
