# Human Review Operations

THC Academy review gates are evidence gates, not status toggles. A lesson, assessment, or item does not become reviewed because an agent changes a registry boolean or object status.

## Work queue

Run:

```bash
npm run review:queue
```

The queue is generated from the current curriculum objects and immutable records in `content/reviews/`. It creates four practical lanes:

- `lesson-scientific` — scientific/technical review of each exact lesson version.
- `lesson-editorial` — editorial review; blocked until the same lesson version has approved scientific review.
- `assessment-definition` — human assessment-design review of assessment definitions.
- `formative-item` / `credential-item` — human assessment review of individual question items.

CI runs the summary form (`npm run review:queue:check`) so broken queue references fail early without filling the build log with every task.

## Completing a review

1. Work from the exact `objectId` and `objectVersion` shown by the queue.
2. Review the source material and evidence appropriate to that lane.
3. Create a new immutable JSON record under `content/reviews/` conforming to `schemas/review-record.schema.json`.
4. Use a unique `REVIEW-*` ID and a stable reviewer identifier. Do not store reviewer secrets or private contact data.
5. Set the result to `approved`, `changes-requested`, or `rejected` and record the real review timestamp.
6. Never overwrite an earlier review result. A changed object version requires a new review record.
7. Re-run `npm test`. The queue will advance automatically from the evidence in the review records.

AI-generated content, automated linting, and self-review do not count as human approval records.

## Promotion enforcement

CI now enforces these evidence rules:

- A `published` lesson must have approved scientific and editorial review records for its exact version.
- An `active` assessment item must have an approved assessment review record for its exact version.
- An `active`, `approved`, or `published` assessment definition must have an approved assessment review record for its exact version.
- Production release checks every lesson in every module, not only the primary lesson listed for each domain.
- Production module assessments require reviewed production-eligible assessment definitions and active reviewed items.
- Production credential pools require the configured minimum number of active summative/credential items per competency, and every active credential item must have approved assessment-review evidence.

These checks intentionally fail closed. Do not weaken them to move draft curriculum into production.
