# Private pilot results handling

Participant-level pilot response files are sensitive operational inputs. They are not curriculum source and must not be committed to this repository.

## Storage boundary

Keep raw files outside tracked source paths. The repository already ignores both `pilot-private/` and `*.pilot-results.json`.

The committed artifact is the aggregated, de-identified item-level evidence produced under `content/pilot-evidence/`. That evidence contains item statistics and analyst metadata, not participant identifiers.

## Required input contract

Private pilot files must satisfy `schemas/private-pilot-results.schema.json` before aggregation. Each payload contains:

- a pseudonymous `cohortId`;
- an `analystId`;
- an optional ISO 8601 `completedAt` timestamp;
- one or more response rows.

Each response row requires a pseudonymous `participantId`, exact item ID/version, keyed correctness, response time, and `criterionScoreExcludingItem`. The corrected criterion score is required because credential activation uses `point-biserial-item-rest`, not an ambiguous item-total correlation.

Unknown fields are rejected. This reduces the chance that direct identifiers or unplanned sensitive fields are accidentally carried into the analysis path.

## Preflight

Validate a private file before aggregation:

```bash
node scripts/validate-private-pilot-results.mjs --input /secure/path/cohort.pilot-results.json
```

A successful preflight reports only the cohort ID and response count. It does not echo participant rows.

## Aggregate

After preflight, build de-identified item evidence:

```bash
node scripts/build-pilot-evidence-from-results.mjs --input /secure/path/cohort.pilot-results.json
```

Use `--complete` only when the cohort collection is actually complete. Use `--write` only when the resulting aggregate evidence should be written to `content/pilot-evidence/` for review. Existing files are never overwritten automatically.

## Additional semantic protections

Schema validation is the first boundary. The aggregator also verifies:

- exact item/version exists;
- one response per pseudonymous participant/item/version within the cohort input;
- non-omitted responses carry an in-range choice;
- the supplied `correct` flag agrees with the current answer key;
- omitted responses do not carry a selected answer or claim correctness;
- corrected item-rest discrimination uses the supplied item-excluding criterion score.

Participant-level input should be retained and destroyed according to the organization's approved privacy, security, records-retention, and research/assessment policies. This repository does not define those external retention periods.
