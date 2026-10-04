# PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION — Paired-Assessor Calibration Packet

**Assessment:** Technician II Practical B — Sensor & Equipment Verification  
**Assessment ID:** `PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION`  
**Exact version:** `1.0.0`  
**State:** calibration packet prepared; inter-rater evidence not yet collected

## Purpose

Use common candidate/work-product samples to determine whether two or more assessors apply this exact rubric consistently before operational credential use.

## Calibration setup

1. Freeze the exact assessment version above.
2. Select representative common samples spanning clearly strong, borderline, clearly weak, and at least one critical-failure scenario where feasible.
3. Have assessors score independently before discussion.
4. Record total score, every domain score, each critical-failure decision, and assessor notes.
5. Aggregate with `npm run calibration:aggregate -- --input <private-paired-ratings.json>`.
6. Reconcile disagreements only after independent ratings are preserved.
7. If rubric wording/anchors/critical-failure definitions change, version the assessment and repeat affected calibration.

## Scoring domains

1. **Sensor and data-quality checks** — 25 points
2. **Controller and equipment-response analysis** — 25 points
3. **Safe troubleshooting boundary** — 20 points
4. **Spatial and trend interpretation** — 15 points
5. **Escalation and documentation** — 15 points

## Critical-failure decisions

- Bypasses a required safety boundary or performs an unsafe repair.
- Performs a repair outside assigned authorization.
- Changes setpoints to hide a failed sensor or equipment condition.
- Discards inconvenient data without a documented justification.

## Required candidate/work-product evidence

- Sensor & Equipment Verification Report
- Annotated trend or data table
- Fault classification
- Maintenance handoff

## Agreement evidence to preserve

- sample count;
- assessor count;
- exact total-score agreement;
- mean absolute total-score difference;
- per-domain exact agreement;
- per-domain mean absolute score difference;
- critical-failure agreement;
- unresolved critical-failure disagreement count;
- assessor notes explaining meaningful disagreements;
- reconciliation decision and any rubric revision.

## Non-negotiable rule

Any disagreement on whether a critical failure occurred must be reviewed and resolved by the designated human authority before operational use. A high overall score-agreement statistic does not override unresolved critical-failure disagreement.

## Approval record

| Field | Value |
|---|---|
| Exact assessment version | `1.0.0` |
| Calibration ID | **OPEN** |
| Assessors | **OPEN** |
| Common samples | **OPEN** |
| Independent scoring completed | **NO** |
| Critical-failure disagreements resolved | **OPEN** |
| Rubric revision required | **OPEN** |
| Final calibration disposition | **NOT COMPLETE — EVIDENCE PENDING** |
