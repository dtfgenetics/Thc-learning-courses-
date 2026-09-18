# Instructor Guide — COURSE-LH-TECH1-003

**Course:** Environmental, Light & Sensor Fundamentals  
**Status:** development instructor support  
**Authority boundary:** this guide supports instruction and remediation; it does not approve the course, validate Practical A, establish a final credential cut score or authorize professional credential issuance.

## Instructional intent

Course 3 should produce technicians who can gather trustworthy environmental/light evidence and communicate it without overreaching. The course is deliberately narrower than environmental-system design. Learners should leave able to measure, document, verify within procedure and escalate—not independently engineer set points, repair protected equipment or diagnose crop effects from one number.

## Core teaching rules

1. Separate **target**, **measurement**, **alarm/event**, **verification action** and **unresolved condition** every time they appear.
2. Require units, time, location and sensor/instrument context whenever those details affect interpretation.
3. Treat VPD as environmental context rather than a universal prescription.
4. Treat canopy PPFD as a spatial measurement problem; do not let one center point or fixture percentage stand in for a map.
5. Teach sensor representativeness before control response: placement, comparison data, verification/calibration status, trend/logging context and crop location matter.
6. Keep Technician I actions within supplied operator procedures. Recognition of a problem does not create repair or control-design authority.
7. Reward honest uncertainty and appropriate escalation over unsupported certainty.

## Lesson 1 facilitation — temperature, RH and VPD

### Emphasize

- RH depends on temperature; a humidity percentage alone is incomplete for VPD interpretation.
- A displayed target is not an observed value.
- VPD describes atmospheric drying-demand context under the measured conditions; it does not by itself dictate a universal crop strategy.

### Misconceptions to challenge

- “60% RH means the same environmental demand at every temperature.”
- “The VPD chart tells me the correct set point for every room.”
- “If the dashboard target is 25 °C, I can record 25 °C as the room measurement.”

### Instructor check

Ask the learner to point to each piece of evidence in a sample record: measured temperature, measured RH, VPD/displayed calculation, supplied target, sensor/location, time and alarm/event. If they cannot distinguish these roles, return to the measurement worksheet before moving on.

## Lesson 2 facilitation — PPFD and photoperiod

### Emphasize

- Fixture settings describe equipment configuration, not the light received at every canopy location.
- Repeatability requires the same grid, measurement plane/height and sensor orientation unless a change is intentionally documented.
- Averages summarize; they do not erase spatial extremes.
- Intended photoperiod and observed controller/light state are separate evidence fields.

### Misconceptions to challenge

- “The center PPFD is the room PPFD.”
- “A 75% dimmer setting means the canopy receives 75% of a fixed PPFD.”
- “If the average is acceptable, low corners do not matter.”

### Instructor check

Provide a deliberately uneven nine-point map. Require the learner to report the distribution without deleting edge values or replacing the grid with a single number.

## Lesson 3 facilitation — sensor representativeness and verification

### Emphasize

- A sensor can accurately measure its local microclimate and still be non-representative for a room/crop question.
- Agreement among peers is evidence, not absolute proof.
- Calibration/verification status and placement should be part of the interpretation.
- Technician-level verification does not include unauthorized repair or protected calibration changes.

### Misconceptions to challenge

- “The newest sensor must be right.”
- “The outlier is definitely broken.”
- “If a sensor disagrees, move it until it matches the others.”
- “Finding the fault means I am authorized to repair it.”

### Instructor check

Use the wall-sensor/air-outlet scenario and require a structured evidence sequence before any escalation decision.

## Lesson 4 facilitation — alarms, trends and handoff

### Emphasize

- Current values, averages and trends answer different questions.
- An alarm tells you a defined rule/event occurred; it does not automatically establish biological damage or root cause.
- A useful handoff preserves what is still unknown.

### Misconceptions to challenge

- “A good daily average proves there was no meaningful excursion.”
- “The alarm proves the equipment failed.”
- “Acknowledging the alarm means the issue is fixed.”
- “A missed reading can be reconstructed from memory as though measured on time.”

### Instructor check

Give a trend with a repeated lights-on spike hidden by an acceptable average. Require the learner to document the event, verification performed, uncertainty, escalation and next action.

## Using the learner assets

Use the six registered assets in `visuals/COURSE3-ASSET-REGISTRY.json` at the exact lesson points defined by the canonical lesson objects. The four embedded visuals support explanation; the two worksheets support applied records. Do not substitute visually attractive but technically weaker graphics merely to increase image count.

If an asset is replaced, preserve or improve:

- technical meaning;
- readable labels and units;
- text alternative/accessible title and description;
- objective/lesson mapping;
- source attribution/claim boundary;
- public learner path and controlled registry update.

## Formative assessment use

The 12-item module assessment is for feedback and learning-loop decisions. Do not coach to answer-key position or expose secure summative content. Use missed objectives to route learners into the corrective coaching and return-to-practice steps in `OBJECTIVE-REMEDIATION-MATRIX.md`.

## Summative academic assessment

The 20-item final is a distinct summative bank. Current machine controls require broad objective coverage, references and a predominantly applied/analyze cognitive level. Human item review still needs to check technical accuracy, cueing, distractor quality, accessibility and source relevance.

## Practical A connection

Course 3 objectives are mapped into Practical A environmental/light/sensor/documentation tasks. Use the shared Practical A assessor support package for administration/scoring development. Do not imply that course instruction alone validates the practical. Evaluator calibration, pilot evidence, standard setting and governance approval remain separate.

## Remediation strategy

Remediation should diagnose the learner's evidence failure rather than repeat the same explanation. Typical failures fall into five patterns:

- mixing targets with measurements;
- losing measurement method/spatial context;
- accepting or rejecting sensor data without representativeness checks;
- exceeding operator authority instead of escalating;
- producing records that another person cannot reconstruct.

Use fresh numbers, locations and scenarios for return-to-practice and reassessment. Reassessment should test the same objective without simply repeating a memorized item.

## Instructor quality checklist

Before a session or release candidate, verify:

- canonical lesson/objective versions match the package;
- all six asset paths resolve in the learner runtime;
- practice sheets remain downloadable/readable;
- no lesson or instructor explanation introduces an unsupported universal VPD/PPFD target;
- equipment-specific actions are tied to supplied procedure/manual context;
- assessment and remediation mappings still match current objective IDs;
- accessibility/manual UX review findings have been resolved or explicitly left open;
- course academic status and professional credential status are not conflated.
