# THC Academy Assessment Model

## Purpose

Assessments measure defined learning objectives and competencies. Practice, formative, summative, and credential-bearing assessments are separate purposes with different security and feedback policies.

## Architecture

Assessment blueprints define required competency coverage, item counts, cognitive-level distribution, difficulty targets, passing standards, attempt limits, cooldowns, feedback rules, and accommodations.

Question banks store immutable item IDs with versioned content. Historical attempts reference the exact item versions delivered.

## Security

Credential and summative assessment answers are never shipped in public static assets. The runtime server creates attempts, selects authorized item versions, accepts responses, computes scores, and records results.

## Item lifecycle

`draft -> technical-review -> editorial-review -> pilot -> active -> flagged -> retired`

## Analytics

Future item statistics include response count, difficulty index, discrimination, distractor performance, exposure, and review flags. Poor-performing items are reviewed rather than silently retained.

## Interoperability

The internal JSON model should remain author-friendly while supporting future import/export mapping to 1EdTech QTI 3.x.
