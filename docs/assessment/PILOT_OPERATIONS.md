# Pilot operations

THC Academy pilot operations are designed to keep participant-level response data out of the curriculum repository while still producing auditable, version-bound item statistics.

## Data boundary

Participant-level exports are private operational data. Store them outside Git. The repository `.gitignore` excludes `pilot-private/` and `*.pilot-results.json` files. The repository stores only aggregated `content/pilot-evidence/*.json` records.

A private pilot-results JSON export contains a pseudonymous `cohortId`, an `analystId`, optional `completedAt`, and response rows. Each row identifies a pseudonymous participant, immutable item ID/version, selected choice index, correctness, omission status, response time, optional response-time anomaly flag, and normalized total assessment score. Do not include names, email addresses, learner account IDs, credentials, or other direct identifiers.

## Aggregate evidence

Preview aggregation without writing:

```bash
npm run pilot:aggregate -- --input pilot-private/cohort-001.pilot-results.json
```

Mark the data-collection record complete only when the analyst has determined the supplied pilot export is complete:

```bash
npm run pilot:aggregate -- --input pilot-private/cohort-001.pilot-results.json --complete
```

Persist the resulting aggregate records only after inspecting the preview:

```bash
npm run pilot:aggregate -- --input pilot-private/cohort-001.pilot-results.json --complete --write
npm run pilot:validate
npm run pilot:readiness
```

`--complete` means the pilot evidence record contains the available completed pilot dataset. It does **not** mean an item passed psychometric review, should be activated, or is credential-ready.

## Statistics produced

For each immutable item version the aggregator produces sample size, percent correct, point-biserial discrimination when computable, choice-selection proportions among non-omitted responses, omission rate, median response time, and the proportion of rows explicitly marked as response-time anomalies by the secure pilot/runtime export. Challenge history starts empty and remains a human-maintained review record.

The system deliberately does not apply universal automatic psychometric pass/fail thresholds. Assessment specialists review the statistics in context, record an explicit assessment review decision, and only then can the normal promotion gates permit activation.

## Promotion boundary

An item cannot become `active` merely because pilot evidence exists. Existing validation requires both complete pilot evidence for the exact item version and an approved human assessment-review record. Production item-bank depth, credential issuance, and production readiness remain blocked until those requirements are genuinely satisfied.
