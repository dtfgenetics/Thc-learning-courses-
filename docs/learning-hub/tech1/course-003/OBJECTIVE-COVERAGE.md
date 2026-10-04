# Objective Coverage — COURSE-LH-TECH1-003

**Course:** Environmental, Light & Sensor Fundamentals  
**Controlled source state:** `published` v0.6.0 for owner-approved academic use  
**Purpose:** machine-auditable development crosswalk from controlled objectives through instruction, applied practice, scored assessment, remediation and mapped performance evidence. Human technical, assessment, accessibility, pilot and release review remain required.

## Coverage summary

Course 3 has five controlled course-specific learning objectives, four dedicated lessons, 12 distinct formative items, 20 distinct summative items, seven produced learner assets and a development mapping to `PRACTICAL-TECH1-A`.

Current machine inspection confirms formative item coverage of **2 / 2 / 3 / 2 / 3** across objectives 01–05 and exactly **4 / 4 / 4 / 4 / 4** summative items. The current 20-item final is therefore balanced across all five controlled objectives. Scored items are evidence-backed; empty reference arrays were not found in the Course 3 question set during this audit.

## Objective learning loop

| Objective | Primary instruction | Applied practice / learner evidence | Formative coverage | Summative coverage | Performance evidence | Remediation |
|---|---|---|---:|---:|---|---|
| `LO-LH-TECH1-003-01` | Lesson 01 — Temperature, RH and VPD as Contextual Measurements | Environmental measurement record; target-vs-measurement comparison; same-RH/different-temperature scenario | 2 | 4 | Practical A environmental interpretation + documentation/traceability | `instructor/OBJECTIVE-REMEDIATION-MATRIX.md` |
| `LO-LH-TECH1-003-02` | Lesson 02 — PPFD, Photoperiod and Repeatable Canopy Light Checks | Nine-point PPFD grid; photoperiod record; repeatable canopy-light-check workflow; bright-center scenario | 2 | 4 | Practical A light-verification station when assigned | `instructor/OBJECTIVE-REMEDIATION-MATRIX.md` |
| `LO-LH-TECH1-003-03` | Lessons 03–04 — Sensor Placement, Verification and Data-Quality Triage; Alarms, Trends, Environmental Records and Shift Handoff | Sensor-outlier worksheet; representativeness triage; trend/alarm scenario; handoff record | 3 | 4 | Practical A environmental interpretation + observation quality | `instructor/OBJECTIVE-REMEDIATION-MATRIX.md` |
| `LO-LH-TECH1-003-04` | Lessons 03–04 | Operator-level readiness checks; escalation decisions; alarm/handoff scenario | 2 | 4 | Practical A environmental interpretation + handoff/escalation | `instructor/OBJECTIVE-REMEDIATION-MATRIX.md` |
| `LO-LH-TECH1-003-05` | Lessons 01, 02 and 04 | Environmental measurement record; PPFD grid; deviation handoff; traceability practice | 3 | 4 | Practical A documentation/traceability + handoff/escalation | `instructor/OBJECTIVE-REMEDIATION-MATRIX.md` |

## Instruction-to-practice alignment

### `LO-LH-TECH1-003-01`

The learner must preserve temperature and relative humidity together, interpret VPD as contextual drying-demand information rather than a universal control command, and keep supplied targets separate from observed measurements. Lesson 01 provides explicit instruction, a target-versus-measurement comparison, worked examples, an embedded environmental-context visual and the downloadable environmental measurement worksheet.

### `LO-LH-TECH1-003-02`

The learner must document photoperiod and PPFD using a consistent canopy measurement method. Lesson 02 requires a repeatable grid, fixed measurement plane/orientation and preservation of every point so spatial distribution is not replaced by a single center reading, fixture percentage or average. The downloadable PPFD worksheet provides the applied record structure.

### `LO-LH-TECH1-003-03`

The learner must judge whether a reading is representative, suspect or incomplete from placement, agreement, verification/calibration status, logging/trend context and crop location. Lesson 03 teaches the triage sequence; Lesson 04 adds temporal and alarm context. Applied work requires the learner to preserve uncertainty instead of forcing a diagnosis.

### `LO-LH-TECH1-003-04`

The learner must perform only authorized operator-level checks and escalate work that would require repair, protected calibration changes or control redesign. Lessons 03–04 repeatedly distinguish observation/verification from unauthorized intervention and require the learner to document what was checked, what remains unresolved and who receives the escalation.

### `LO-LH-TECH1-003-05`

The learner must create reconstructable environmental/light records. Lessons 01, 02 and 04 collectively require target, measured value, alarm/event, verification action, unresolved condition, location, time, units, instrument/sensor context and escalation/handoff status as applicable.

## Test-to-teaching provenance

`docs/learning-hub/tech1/course-003/TEST-TO-TEACHING-MAP.md` records the exact dedicated lessons that teach each assessed objective. The final assessment metadata carries the same machine-readable map. The 420 Encyclopedia may support deeper study and source discovery but cannot substitute for required Course 3 instruction.

## Assessment boundary

The 12-item module assessment is formative. The 20-item course final is the summative academic assessment source. Formative and summative item IDs are distinct. Course completion must not be treated as proof that Practical A, the Technician I credential or any operational cut score has been validated.

The deterministic control for this learning loop is:

```bash
node scripts/audit-learning-hub-objective-coverage.mjs --course=COURSE-LH-TECH1-003 --require-complete-learning-loop --require-balanced-assessment
```

## Practical boundary

`registry/course3-practical-a-crosswalk.json` maps all five objectives into existing Practical A tasks, scoring categories, expected evidence and deliverables. That mapping demonstrates development coverage only. It does **not** establish technical approval, assessor calibration, inter-rater reliability, pilot validity, standard setting or release authority.

## Asset alignment

The seven governed learner assets in `visuals/COURSE3-ASSET-REGISTRY.json` support the objective loop without creating a content ceiling:

- five embedded visuals for environmental context, VPD physiology, PPFD mapping, sensor representativeness and alarm/trend handoff;
- two downloadable practice sheets for environmental records and PPFD/sensor verification.

The registry remains authoritative for exact asset IDs, paths, Drive mirror records, lesson mappings and reference mappings.

## Open evidence gates

Machine completeness does not close human/evidence gates. Remaining approval work includes subject-matter review, instructional-design review, assessment review, Practical A calibration/validation, rendered accessibility/manual UX review, learner pilot evidence, standard setting where applicable and release approval.
