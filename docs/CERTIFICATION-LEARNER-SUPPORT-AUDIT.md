# Certification Learner-Support Audit

**Scope:** the 15 canonical Technician certification courses only. The 420-topic Encyclopedia and legacy THC-C catalog are excluded.

## Purpose

This audit complements the certification instructional-depth audit by comparing learner-support signals that are easy to miss when a lesson is structurally complete. It helps prioritize continuous-improvement work without imposing arbitrary word counts, visual quotas, worksheet quotas, or identical package sizes on every course.

Run:

- `npm run certification:learner-support` — human-readable comparison table.
- `npm run certification:learner-support:json` — machine-readable output.
- `npm run certification:learner-support:check` — fail only on structural learner-support gaps.

## Signals measured

For each canonical course the reporter examines its dedicated course module and lessons plus the course learner-support package. It records:

- worked examples;
- common mistakes/misconceptions;
- applied-practice signals;
- scenario/integrated-practice signals;
- dedicated lesson image blocks;
- lesson resource/download blocks;
- tables/comparisons;
- remediation/reassessment signals;
- worksheet, checklist, job-aid, practice-sheet, download, or record-template signals.

The resulting support score is a **prioritization signal**, not a readiness score or credential decision.

## Structural failures

The `--check` mode fails only when a canonical course is missing:

1. a detectable learner-support package; or
2. any applied-practice signal in its dedicated learning layer.

Other flags identify improvement opportunities but do not fail publication. Examples include no detected worked-example array, no dedicated lesson image block, no downloadable job-aid signal, or no integrated-scenario signal.

## Improvement rule

Use the lowest-support courses as review priorities, then inspect the actual teaching need before adding material. Expand only when the addition improves learner performance, transfer, troubleshooting, remediation, accessibility, or practical preparation.

Do not add filler simply to increase a score. Do not use Encyclopedia content as substitute certification instruction. Scored assessment content must remain derived from the dedicated course teaching layer.

## Credential boundary

This audit does not establish professional credential validity, practical/capstone validation, psychometric quality, evaluator calibration, standard setting, accessibility approval, or credential issuance authorization.
