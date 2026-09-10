# Human Review Records

This directory is the source of truth for immutable human review records used by curriculum publication gates.

Each JSON record must conform to `schemas/review-record.schema.json` and identify the exact reviewed object ID and version. Supported review types are scientific, editorial, assessment, accessibility, and legal/compliance.

Rules:

- Do not create approval records for AI/self-review alone.
- `approved` means the named human reviewer actually completed that review type for the exact object version.
- `changes-requested` and `rejected` records are retained as audit history; do not overwrite them.
- A changed lesson or assessment version requires a new review record for the new version.
- For assessment items that already have an approved assessment review, substantive edits to purpose, competency, objective, Bloom level, difficulty, type, stem, choices, answer key, rationale, or evidence references must advance the item version. Status-only promotion does not require a version change.
- CI enforces this rule against the prior/base revision so an approved review cannot silently carry forward after assessment content changes.
- Do not store reviewer secrets, signatures, personal contact information, learner data, or production credentials here.
- File names should use the review ID, for example `REVIEW-LESSON-ENV-VPD-001-SCI-001.json`.

The automated review validator checks record shape, target existence, exact-version alignment, enum values, reviewer ID presence, and review timestamps. Production release checks separately require the configured approved review types before publication.
