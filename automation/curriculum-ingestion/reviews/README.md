# Evidence Mapping Reviews

This directory is the human-review boundary between automatically discovered evidence relationships and canonical claim records.

## Workflow

1. `build-evidence-mapping-inbox.mjs` discovers reviewed references already cited by lessons but not represented in the claim graph.
2. A reviewer inspects the cited instructional context and the underlying reference.
3. The reviewer writes an atomic, supportable claim into an evidence-mapping review record using `schemas/evidence-mapping-review.schema.json`.
4. Draft or pending reviews may be stored outside `approved/`.
5. Only a record with `status: "approved"`, scientific-review metadata, reviewed source records and valid lesson/source relationships is promotable.
6. `promote-evidence-mapping.mjs` runs as a dry-run by default. `--write` is permitted only for review records committed under `automation/curriculum-ingestion/reviews/approved/`.
7. The resulting claim must still pass the repository claim schema and the complete curriculum audit suite before merge.

## Important boundary

A citation occurring near lesson text is evidence of an intended source relationship, not proof that every nearby sentence is supported by that source. The automation must never infer or publish scientific claims solely from citation proximity.

## Approved review record

An approved review explicitly records the claim statement, domain, lessons, reviewed references, optional competencies/objectives, semantic version, reviewer identities, approval time, rationale, and whether AI materially assisted drafting.

The review record remains the provenance/audit object. The canonical claim stays intentionally compact and conforms to `schemas/claim.schema.json`.
