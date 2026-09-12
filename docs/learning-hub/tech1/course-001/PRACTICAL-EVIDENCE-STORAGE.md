# Course 1 practical evidence storage strategy

Course: `COURSE-LH-TECH1-001`
Practical: `PRACTICAL-LH-TECH1-001-WORKFLOW`

## Purpose

The Academy records **references to practical evidence**, not copies of learner evidence files inside curriculum Git or learner-facing JSON.

This keeps the published academic course continuously editable while separating operational learner records from source-controlled curriculum content.

## Evidence-output model

Every evidence output defined by the canonical practical is rendered dynamically in the evaluator workspace. The current practical defines seven outputs, but the runtime does not freeze that count. If the canonical practical adds, removes, renames, or reorganizes evidence outputs, the assessor interface follows the current definition.

For each output, the evaluator can record:

- review status: `not-reviewed`, `received`, `verified`, or `needs-revision`;
- a controlled evidence reference;
- an evaluator evidence note.

The evidence reference may identify an object in an approved operational storage system, a controlled Drive/document reference, an evidence packet/page, an LMS artifact identifier, or another deployment-approved locator.

## Storage boundary

Do not commit learner evidence files to the curriculum repository.

Do not place private learner evidence in public lesson, assessment, practical, registry, or release files.

Do not expose evaluator evidence references, private evaluator notes, evaluator identity, or detailed scoring evidence through the learner evidence API.

The runtime stores evidence references in the authoritative practical evaluation record. The referenced file or artifact remains in the deployment's approved evidence-storage system with its own access controls, retention policy, backup policy, and audit controls.

## Learner visibility

Learners may see:

- their practical status;
- score when recorded;
- critical-error count;
- learner-facing assessor feedback/remediation;
- controlled follow-up state;
- reassessment target date when assigned.

Learners do not receive:

- private evaluator notes;
- evaluator identity;
- controlled evidence references;
- evidence-output notes;
- domain-scoring evidence payloads;
- administrative assignment metadata.

## Evaluator ownership

Practical evaluator assignment is stored separately from the evaluation evidence record. An evaluator may claim an unassigned practical. A practical assigned to another evaluator is read-only to other evaluator sessions until ownership is changed. Administrator write scope can explicitly reassign or clear ownership.

This allows assignment before any practical evaluation record exists and avoids mixing workflow ownership into learner evidence.

## Reporting

Administrative Course 1 practical reporting may include learner subject, enrollment status, practical status, score, critical-error count, follow-up state, reassessment target, evaluator assignment, and timestamps.

Reports intentionally exclude private evaluator notes and detailed evidence references. CSV export follows the same projection.

## Extensibility

This strategy controls privacy and operational separation; it does not cap course content, evidence-output count, reference types, assessor guidance, storage integrations, or future reporting formats. New approved storage connectors and evidence-reference types can be added without changing the public academic publication model.
