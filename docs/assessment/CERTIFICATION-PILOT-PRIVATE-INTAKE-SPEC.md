# Certification Pilot Private Intake Specification

**Scope:** all 15 canonical Technician I/II certification courses  
**Registry:** `registry/certification-pilot-intake-manifest.json`  
**Aggregator:** `scripts/build-pilot-evidence-from-results.mjs`

## Privacy boundary

Participant-level pilot data are private QA/research records and **must not be committed to the public repository**. Repository content may contain only de-identified aggregate evidence and controlled non-identifying summaries.

Use pseudonymous participant IDs. Do not include names, email addresses, employee IDs, medical information, disability details, or free-text personal identifiers in repository pilot evidence.

## Cross-course payload

New certification pilot runs should use:

```json
{
  "cohortId": "TECH2-C3-PILOT-01",
  "analystId": "ANALYST-001",
  "courseId": "COURSE-LH-TECH2-003",
  "courseVersion": "0.3.0",
  "completedAt": "2026-10-15T20:00:00Z",
  "responses": [
    {
      "participantId": "P001",
      "itemId": "ITEM-EXAMPLE-001",
      "itemVersion": 1,
      "correct": true,
      "omitted": false,
      "selectedChoiceIndex": 2,
      "responseTimeSeconds": 42.1,
      "totalScore": 0.78,
      "restScore": 0.76,
      "responseTimeAnomaly": false
    }
  ]
}
```

When `courseId`/`courseVersion` are supplied, the aggregator rejects data that do not match the current exact-version manifest.

## Data QA

Before aggregation:

1. confirm cohort and course version;
2. confirm every item ID/version resolves exactly;
3. confirm Boolean scoring and omission fields;
4. confirm response times are non-negative;
5. confirm normalized total/rest scores are between 0 and 1;
6. document the controlled response-time anomaly rule if used;
7. exclude or disposition corrupted/duplicate records without silently editing them;
8. preserve a private audit copy of the original response file.

## Interpretation

Item statistics are diagnostic evidence. They do not automatically activate, retire, validate, or approve an item.

Changed item wording, key, rationale, stimulus, choice set, scoring logic, or other meaningfully relevant content creates a new version and requires new evidence as appropriate.

## Practical/capstone pilots

Performance-assessment evidence is handled separately from item-response aggregation. Use the exact-version assessor calibration packets and the calibration evidence pipeline for common-sample scoring and inter-rater evidence.

## Repository-safe output

Use:

`node scripts/build-pilot-evidence-from-results.mjs --input <private-results.json>`

Add `--write` only when the aggregate output has been reviewed. Use `--complete` only when the underlying pilot-data QA is actually complete.

A complete aggregate record is still not formal item activation, standard setting, or credential authorization.
