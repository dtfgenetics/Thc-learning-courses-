# THC Academy review decision workflow

Review decisions are human-governance records. Automation may prepare packets, validate records, and enforce promotion rules, but it must not approve curriculum or assessment content on a reviewer's behalf.

## 1. Get the review context

Use the review queue and packet tools to identify the object and inspect its evidence, objective/competency mappings, and current review state.

```bash
npm run review:queue
npm run review:packet
```

Review the actual source object and cited evidence before recording a decision.

## 2. Preview a decision record

The review CLI resolves the object's current version automatically so a decision cannot silently attach to a stale version.

```bash
npm run review:record -- \
  --object LESSON-EXAMPLE-001 \
  --type editorial \
  --reviewer reviewer-id \
  --status changes-requested \
  --notes "Clarify the distinction in section two."
```

Without `--write`, the command only prints the proposed JSON record.

## 3. Approval requires explicit confirmation

An approval is never the default path. It requires the reviewer to add `--confirm-approved` deliberately. Scientific approvals also require at least one evidence reference ID identifying the evidence checked.

```bash
npm run review:record -- \
  --object LESSON-EXAMPLE-001 \
  --type scientific \
  --reviewer scientist-id \
  --status approved \
  --evidence REF-EXAMPLE-001,REF-EXAMPLE-002 \
  --confirm-approved
```

The command rejects an approved scientific review with no evidence list.

## 4. Write only after reviewing the preview

Add `--write` to create `content/reviews/REVIEW-....json`.

```bash
npm run review:record -- \
  --object LESSON-EXAMPLE-001 \
  --type scientific \
  --reviewer scientist-id \
  --status approved \
  --evidence REF-EXAMPLE-001 \
  --confirm-approved \
  --write
```

Review records are version-bound. If the underlying object changes later, the old decision remains historical evidence and does not approve the new version.

## 5. Validate and submit through normal change control

After creating a record:

```bash
npm run review:validate
npm run review:queue:check
npm run status
```

Commit the review record on a short-lived branch and submit it through the normal PR/CI process. Do not edit a review record to make a different decision; create a new review record so the decision history remains auditable.

## Promotion boundaries

Published lessons require approved scientific and editorial review evidence. Active assessment items and production-eligible assessments require approved assessment review evidence. Pilot evidence and other production gates remain separate requirements. A review approval alone never makes a credential production-ready.
