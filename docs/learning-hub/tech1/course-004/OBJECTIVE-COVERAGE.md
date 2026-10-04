# Objective Coverage — COURSE-LH-TECH1-004

**Course:** Water, Root Zone, Nutrition & Irrigation Fundamentals  
**Controlled state:** `published` v0.5.0  
**Purpose:** development crosswalk proving instruction, applied practice, scored assessment, remediation and Practical B mapping without implying human validation.

## Coverage summary

Course 4 contains six controlled objectives, four dedicated lessons, 12 formative items, 24 summative items, eight produced learner assets and a development mapping to `PRACTICAL-TECH1-B`.

Current machine inspection confirms a balanced academic bank: **2 formative + 4 summative items for each objective**. No Course 4 question objects with an empty `references` array were found in the audit.

| Objective | Instruction | Applied practice | Formative | Summative | Practical B evidence |
|---|---|---|---:|---:|---|
| `LO-LH-TECH1-004-01` | Lesson 01 | sample identity + pH/EC meter/record practice | 2 | 4 | measurement technique/calibration awareness; pH/EC context |
| `LO-LH-TECH1-004-02` | Lesson 02 | seven-day root-zone/dryback trend worksheet | 2 | 4 | delivery/root-zone recognition; records/reconciliation |
| `LO-LH-TECH1-004-03` | Lessons 02, 04 | nutrition-context differential + symptom/root-zone handoff | 2 | 4 | bounded pH/EC/nutrition-context interpretation; escalation |
| `LO-LH-TECH1-004-04` | Lesson 03 | simulated work order with delivery faults | 2 | 4 | identity verification, irrigation execution, representative delivery |
| `LO-LH-TECH1-004-05` | Lessons 01, 03, 04 | meter readiness + equipment/deviation verification | 2 | 4 | operator-level readiness; escalation/handoff |
| `LO-LH-TECH1-004-06` | Lessons 01, 04 | reconstructable measurement/irrigation/handoff record | 2 | 4 | records/reconciliation; escalation/handoff |

## Objective boundaries

### `LO-LH-TECH1-004-01`
Learners identify the requested sample before measuring, perform only supplied meter-readiness/calibration/verification steps, record pH/EC with units and context, and recognize that EC is not nutrient-specific chemical analysis and pH alone is not a diagnosis.

### `LO-LH-TECH1-004-02`
Learners describe saturation, drainage and dryback from repeated comparable observations. Elapsed time or one spot value is not accepted as a complete irrigation diagnosis.

### `LO-LH-TECH1-004-03`
Learners combine symptom pattern, developmental stage, pH/EC method, root-zone condition and irrigation/environment context without converting visual resemblance into a proved deficiency, excess or antagonism.

### `LO-LH-TECH1-004-04`
Learners execute the assigned irrigation/fertigation work order within authorization and verify actual representative delivery rather than assuming controller status proves crop delivery.

### `LO-LH-TECH1-004-05`
Learners perform permitted operator-level meter/irrigation readiness checks, document faults, apply only explicitly permitted routine corrections and escalate unresolved work rather than performing unauthorized repair or redesign.

### `LO-LH-TECH1-004-06`
Learners create records another qualified person can reconstruct, keeping targets/work-order instructions, actual measurements/delivery, verification actions, unresolved conditions and handoff status distinct.

## Evidence and asset alignment

Primary reviewed references are `REF-IRRIGATION-001`, `REF-NUTRITION-001` and `REF-MHRA-GXP-DATA-INTEGRITY`. The irrigation study is used for irrigation/root-zone principles without generalizing a treatment-specific outdoor-tunnel result into universal indoor recommendations. Nutrition evidence supports contextual mineral-nutrition concepts without turning one study into a universal feed recipe. The MHRA guidance is used as a general data-integrity model, not cannabis law.

The eight governed assets in `visuals/COURSE4-ASSET-REGISTRY.json` include six embedded learning visuals and two downloadable practice worksheets, with the additional visual dedicated to pH, root-zone chemistry and nutrient-availability context.

## Test-to-teaching provenance

`docs/learning-hub/tech1/course-004/TEST-TO-TEACHING-MAP.md` records the exact dedicated Course 4 lessons that teach each assessed objective. The final assessment carries the same mapping in machine-readable metadata. Encyclopedia/reference material may support accuracy and deeper study but cannot satisfy Course 4 teaching or test coverage.

## Deterministic gate

```bash
node scripts/audit-learning-hub-objective-coverage.mjs --course=COURSE-LH-TECH1-004 --require-complete-learning-loop --require-balanced-assessment
```

## Practical boundary

`registry/course4-practical-b-crosswalk.json` maps all six objectives to Practical B tasks, scoring categories, expected evidence and deliverables. This is development coverage only; evaluator calibration, inter-rater evidence, pilot validation, standard setting and credential approval remain open.
