# Evidence Mapping Reviewer Guide

This queue is for human scientific/technical review of atomic claims that connect Course 1 lessons to reviewed evidence. It is separate from the lesson/editorial/assessment review lanes because an evidence mapping has its own provenance and promotion rules.

## What the reviewer receives

Run `node scripts/build-evidence-review-packets.mjs --output=automation/curriculum-ingestion/reports/evidence-review-packets` or use the **Evidence review packets** GitHub Actions workflow. The bundle contains an index plus one Markdown packet per pending evidence mapping.

Each packet includes the proposed atomic claim, affected lessons, exact lesson citation contexts, repository reference metadata, verified source links when available, jurisdiction/scope notes, AI-assistance disclosure, and the human review checklist.

## Human decision

The reviewer must independently inspect the cited source material. Packet generation is not approval. For an approval, the reviewer must confirm that the statement is no stronger than the evidence, the same principle really applies to every listed lesson, and jurisdiction/population/system limits remain explicit.

Use one of these decisions:

- **APPROVE** — the proposed atomic claim and mappings are supportable as written.
- **REVISE** — evidence is usable, but the statement, scope, lesson mapping, references, or metadata must change before approval.
- **REJECT** — the proposed mapping should not be promoted from the cited evidence.

## Recording an approval

Do not overwrite the scientific-review boundary with an AI identity or placeholder reviewer. A human reviewer updates the review record with their real reviewer identity, sets `status` to `approved`, supplies an ISO 8601 `review.approvedAt`, and updates `claimStatus` as appropriate. The approved record is then moved from `automation/curriculum-ingestion/reviews/pending/` to `automation/curriculum-ingestion/reviews/approved/` in a review PR.

CI validates approved review records against `schemas/evidence-mapping-review.schema.json`, verifies all referenced lessons/references/competencies/objectives, and dry-runs the promotion logic against the current repository state.

## Promotion

After the approval PR is reviewed and merged, use the existing promotion command with the approved record. Promotion is dry-run by default. The `--write` mode is intentionally restricted to records committed under `reviews/approved/`.

Example dry run:

```bash
node scripts/promote-evidence-mapping.mjs --review=automation/curriculum-ingestion/reviews/approved/EMR-EXAMPLE.json
```

Only after verifying the dry-run projection should an authorized maintainer use `--write` and submit the resulting canonical claim change through normal CI/review.

## Important scope rule

A source being authoritative does not make every application of it universal. Cross-industry or foreign-jurisdiction sources such as MHRA, GS1, or HSE must remain clearly labeled as transferable models unless an applicable legal authority independently establishes a requirement. Likewise, a citation appearing in a lesson does not prove the proposed atomic claim; that relationship is exactly what this review gate exists to verify.
