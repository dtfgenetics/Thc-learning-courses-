# Consolidated Evidence Submission Workflow

Validation evidence can now be grouped into a controlled submission manifest after the underlying exact-version evidence records exist.

## Create a submission

Example:

`npm run evidence:submission:create -- --scope course --target COURSE-LH-TECH1-001 --submitted-by REVIEW-LEAD --evidence-ids REVIEW-...,PILOTEXEC-... --status ready-for-review --write`

Scopes:

- `course`
- `credential-program`
- `production-control`

The manifest stores record IDs only. It does not duplicate sensitive evidence.

## Readiness rule

A `ready-for-review` or `accepted` submission may reference only evidence that has already reached a reviewable state:

- review records: `approved`
- calibration evidence: `complete`
- other evidence records: `evidence-complete` or `approved`

Draft/in-progress/collecting evidence cannot be smuggled into a ready-for-review submission.

## Exact-version rule

The manifest is locked to the current course, credential-program, or production-control contract version. Referenced evidence with explicit course/program versions must match that target.

## Commands

- `npm run evidence:submission:create`
- `npm run evidence:submission:validate`
- `npm run evidence:submission:report`

This workflow packages evidence for review; it does not approve a certification gate by itself.
