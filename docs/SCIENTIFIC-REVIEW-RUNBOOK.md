# Scientific Review Operations Runbook

## Purpose

This runbook defines the human scientific-review workflow for credential-bearing THC Academy curriculum. It operationalizes the existing review schemas, queue, packet builder, validator, readiness report, and immutable review records without weakening the rule that AI/self-review cannot approve content.

The immediate campaign is Cultivation Foundations v1.0.0. The production blocker is `curriculum.scientificReviewComplete`, mirrored by `registry/cultivation-foundations.json` gate `allLessonsScientificallyReviewed`.

## Non-negotiable review rule

A scientific approval record may be created only after a real human reviewer has reviewed the exact object ID and version named in the record. Do not create an `approved` record from AI output, automated validation, editorial review, repository ownership, or an earlier object version.

Automated tooling may prepare packets, identify claims/evidence, detect missing references, validate record shape, and report readiness. It may not substitute for the human decision.

## Current Cultivation Foundations scientific queue

Review the exact current lesson versions represented by these lesson IDs:

1. `LESSON-PLANT-BIO-001`
2. `LESSON-ENV-VPD-001`
3. `LESSON-LIGHT-001`
4. `LESSON-WATER-001`
5. `LESSON-ROOTZONE-001`
6. `LESSON-NUTRITION-001`
7. `LESSON-IPM-001`
8. `LESSON-PROP-001`
9. `LESSON-CANOPY-001`
10. `LESSON-FLOWER-001`
11. `LESSON-POSTHARVEST-001`
12. `LESSON-GENETICS-001`

Do not rely on this list alone for version information. The reviewer packet and review record must use the exact version from the current lesson object.

## Reviewer qualification

Use a reviewer whose education, professional work, research, extension, horticulture, plant science, controlled-environment agriculture, pathology, entomology, soil/root-zone science, genetics, postharvest science, or another relevant discipline is appropriate for the lesson being reviewed.

A reviewer does not need to be the same person for all 12 lessons. Domain-matched review is preferred where claims cross specialized disciplines.

Record only a stable reviewer identifier in Git. Do not commit reviewer contact details, signatures, private credentials, access tokens, personal records, or other sensitive information.

## Review sequence for each lesson

### 1. Confirm the exact object and version

Run the queue/readiness tooling from a clean branch based on current `dev`:

```bash
npm run review:queue
npm run review:readiness
```

Confirm the lesson is still pending scientific review and note its current version. If the lesson changes during review, stop and review the new version instead of reusing the old decision.

### 2. Build/read the reviewer packet

Use the existing packet builder:

```bash
npm run review:packet
```

The scientific packet should be treated as the working evidence map, not as approval. Review the lesson itself together with its claims, references, objectives, competency traceability, and any evidence notes included by the packet tooling.

### 3. Perform scientific checks

For each substantive claim, verify the following as applicable:

- the cited source actually supports the claim being made;
- the source scope matches the lesson scope and is not being generalized beyond the evidence;
- numerical values, units, ranges, equations, thresholds, and conversions are accurate and internally consistent;
- biological relationships and causal language are appropriately qualified;
- terminology is technically correct and used consistently;
- distinctions between established evidence, practical convention, emerging evidence, and uncertainty are clear;
- cultivar, environment, method, developmental stage, equipment, substrate, water chemistry, or other context limitations are stated when they materially affect the claim;
- safety-relevant statements are conservative and not overstated;
- the lesson does not present anecdote, marketing language, or unsourced community convention as settled science;
- references are sufficiently current for claims that can change with new research or standards;
- conflicting evidence is acknowledged when it materially changes the learner takeaway;
- the lesson's learning objectives are actually supported by the reviewed content.

### 4. Choose a decision

Use only the review statuses allowed by `schemas/review-record.schema.json`.

- `approved`: the exact lesson version is scientifically acceptable for the program's intended educational scope.
- `changes-requested`: scientifically material corrections, clarifications, evidence upgrades, or scope changes are required before approval.
- `rejected`: the object is unsuitable in its current form and should not proceed through the publication path.

When changes are requested or rejected, keep the review record as audit history. Do not overwrite it after revision; the revised lesson version receives a new review record.

### 5. Create the immutable review record

Use the repository review-record workflow rather than hand-editing gate booleans:

```bash
npm run review:record -- <review-record arguments required by the CLI>
npm run review:validate
```

The record must identify:

- the exact lesson ID;
- the exact lesson version;
- review type `scientific`;
- the human reviewer ID;
- actual review timestamp;
- decision/status;
- useful notes and evidence checked, without storing sensitive information.

### 6. Re-run readiness

After the record is committed:

```bash
npm run review:validate
npm run review:queue:check
npm run review:packets:check
npm run review:readiness
npm test
```

A lesson is scientifically complete only when the validator/readiness tooling recognizes an approved scientific review for its exact current version.

## Campaign completion criteria

The Cultivation Foundations scientific campaign is complete only when all of the following are true:

- all 12 current lesson versions have valid human `scientific` review records with status `approved`;
- `npm run review:validate` passes;
- `npm run review:readiness` reports all 12 lessons scientifically reviewed;
- no approved record points to a stale lesson version;
- any changes-requested/rejected records remain preserved as audit history;
- the curriculum registry gate can be derived/updated from real evidence;
- `registry/system-readiness.json` may set `curriculum.scientificReviewComplete` true only after the same evidence is present;
- editorial review proceeds only for lesson versions whose scientific review is approved.

## Recommended operating cadence

Review in small batches of one to three lessons. For each batch:

1. create one short-lived `review/<scope>` or `content/<scope>` branch from current `dev`;
2. do not modify unrelated curriculum or platform code on the review branch;
3. commit review records and any scientifically required lesson/reference corrections together only when traceability remains clear;
4. run the full quality gate;
5. merge to `dev` through a PR;
6. delete/supersede the landed branch instead of creating `-v2`, `-v3`, `-temp`, or replacement branches;
7. re-run the review queue before selecting the next batch.

## Issue tracking

Use GitHub issue #125 as the single campaign tracker for Cultivation Foundations scientific review. Do not open duplicate campaign issues. Lesson-specific sub-issues are appropriate only when they have a distinct human owner, blocking evidence problem, or substantial revision scope.

## What automation may do next

Until human review decisions exist, automation should focus on reviewer preparation and remediation support:

- keep review packets reproducible and current;
- identify stale/missing references and claim-to-source gaps;
- prepare targeted correction branches after a human `changes-requested` decision;
- validate review-record shape and version alignment;
- report queue progress and blockers;
- prevent manual gate flips unsupported by review evidence.

Automation must not manufacture the missing scientific approvals to make release checks pass.
