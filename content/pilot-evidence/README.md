# Assessment Pilot Evidence

This directory is the source of truth for version-specific pilot evidence used to decide whether assessment items are ready for activation.

Pilot evidence is **observed human-response data**, not an authoring status flag. Do not create `complete` evidence records from AI review, synthetic answer generation, or guessed statistics.

## Workflow

1. Assessment definitions and items remain `draft` while they are authored and human-reviewed.
2. Use `npm run review:queue`, `npm run review:packet -- --object=<ID>`, and `npm run review:record` to complete and record the required human assessment review for the exact item version.
3. Create an empty version-specific pilot record with:
   `npm run pilot:template -- --item=ITEM-... --analyst=<reviewer-id> --write`
4. Deliver the reviewed item through an approved pilot process and retain learner-identifying data outside this repository.
5. Aggregate de-identified response results with `npm run pilot:aggregate` where applicable, then validate with `npm run pilot:validate` and inspect `npm run pilot:readiness`.
6. Record sample size, percent correct, discrimination, distractor selection, omit rate, response-time metrics, challenges and analyst notes only from the observed pilot dataset.
7. Mark a pilot record `complete` only when the configured evidence requirements are genuinely satisfied. Activation remains a separate decision and must continue to pass item-bank and release gates.

## Data boundaries

Do not commit names, emails, account IDs, raw learner attempts, IP addresses, authentication data, private signing material or other production secrets here. Store only the de-identified aggregate evidence defined by `schemas/pilot-evidence.schema.json`.

A changed assessment-item version requires new pilot evidence for that version. Historical records remain immutable audit evidence and should not be overwritten to match revised items.
