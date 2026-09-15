# Technician I Course 003 development readiness

Course: `COURSE-LH-TECH1-003` — Environmental, Light & Sensor Fundamentals  
Course version: `0.3.0`  
Release status: `draft`

## Automated development completed

Course 003 now has a dedicated occupational instruction, assessment and development-stage performance-evidence layer.

- dedicated module: `MOD-LH-TECH1-003-MONITORING`;
- five measurable Course 003 learning objectives;
- four applied course-specific lessons;
- 32 distinct dedicated Course 003 items: 12 formative and 20 summative-development items;
- formative module assessment `ASSESS-LH-TECH1-003-M01`;
- draft summative assessment `ASSESS-LH-TECH1-003-FINAL`;
- mapped development practical: `PRACTICAL-TECH1-A — Safe Room Entry & Crop Inspection`;
- objective/practical crosswalk: `registry/course3-practical-a-crosswalk.json`;
- deterministic crosswalk contract checks all five objectives against the canonical Practical A task, scoring, evidence and deliverable text;
- public Course 003 manifest identifies Practical A as development-stage performance evidence;
- Course 003 remains `draft`; no human review, pilot, calibration, practical validation or credential release approval is implied.

## Instructional emphasis

The course trains Technician I learners to distinguish targets from measurements, record temperature/RH/VPD with sensor context, perform repeatable PPFD and photoperiod checks, preserve canopy light distribution instead of relying on one point, evaluate sensor placement and verification status, recognize trends and alarms, perform only authorized operator-level checks, and escalate unresolved environmental or lighting faults without independently redesigning control strategy.

## Practical A coverage added

Practical A now contains development-stage environmental/light stations that can directly exercise Course 003 objectives:

- read routine environmental values and distinguish normal, questionable and follow-up conditions;
- use supplied placement, comparison readings, calibration/verification status, logging context and crop location to judge whether a reading is representative, suspect or incomplete;
- perform only supplied operator-level sensor/equipment readiness checks and escalate unauthorized repair, calibration or control redesign;
- perform a repeatable canopy-light verification using a supplied grid, measurement height and sensor orientation;
- preserve all PPFD points instead of substituting one point or fixture setting for canopy-level evidence;
- record photoperiod and PPFD verification with units, location, time and instrument/context;
- keep supplied scenario targets/limits separate from measured values;
- preserve unresolved conditions and escalation status in reconstructable records and handoff.

This mapping is development coverage only. Practical A remains `development` in the integrated lab plan.

## Assessment design

The formative and summative sets are non-overlapping. The 20-item summative-development bank covers environmental measurement and VPD context, PPFD/photoperiod measurement, sensor representativeness and trend reasoning, equipment-care boundaries, and reconstructable alarm/handoff records. Authored answer-key positions are balanced by construction and runtime choice randomization remains enabled.

## Remaining Course 003 development priorities

The largest automated-development gap is now the learner visual/practice asset layer. Priority assets are:

1. temperature/RH/VPD measurement-context visual;
2. repeatable canopy PPFD grid and measurement-position visual;
3. sensor placement and representativeness comparison;
4. suspect-reading verification workflow;
5. alarm/trend/verification/handoff record visual;
6. printable environmental and light verification practice sheets.

These assets should be public, accessible, lesson-linked, downloadable where appropriate, and governed by a Course 003 asset registry and deterministic reachability tests like Course 002.

## Remaining human/empirical validation gates

The following cannot be closed by generated files or green CI alone:

- human technical review;
- human assessment review;
- rendered accessibility review;
- controlled learner/item pilot evidence;
- Practical A validation;
- evaluator calibration and inter-rater evidence;
- formal standard setting;
- final Technician I program release approval.

## Boundary

Public-source research, instruction, assessments, diagrams, worksheets, practical mappings and deterministic QA may continue before these gates are complete. Human/pilot gates control validated credential evidence and release status; they do not block ordinary source-backed course development.
