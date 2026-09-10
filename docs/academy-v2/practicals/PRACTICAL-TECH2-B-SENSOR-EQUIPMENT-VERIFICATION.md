# Technician II Practical B — Sensor & Equipment Verification

## Purpose
Demonstrate that the candidate can distinguish an actual environmental condition from sensor/data-quality error, equipment-response failure, control-sequence problems, or a condition requiring maintenance escalation.

## Tasks and competencies
- `TASK-CULT2-SENSOR-001`
- `TASK-CULT2-EQUIPMENT-001`
- `COMP-ENV-ADV-001`
- `COMP-IRRIGATION-ADV-001`
- `COMP-PRO-QA-001`

## Assessment format
The candidate receives a controlled case in which at least two evidence sources disagree. The case must include a measurement-quality issue and an equipment/control question so the candidate cannot pass by assuming every displayed value is trustworthy.

Recommended assessment time: 60–75 minutes.

## Candidate receives
- controller trend exports and alarm history
- two or more canopy/environment sensors with locations
- a calibrated or otherwise qualified comparison instrument
- controller setpoints and equipment command history
- equipment status/output observations
- verification/calibration records
- maintenance notes or recent service history
- crop observations and a room map
- applicable operating and escalation procedures

## Candidate must perform
1. Confirm sensor identity, location, timestamp/time zone, units, and sampling interval.
2. Inspect whether the sensor is positioned where it can represent the intended zone and identify obvious placement confounders such as direct radiant exposure, wetting, obstructions, or local airflow extremes.
3. Compare the installed sensor with a qualified reference instrument using an appropriate side-by-side method.
4. Calculate and record measurement difference. Where repeated readings are supplied, distinguish stable bias from random scatter or intermittent dropout.
5. Review calibration/verification status and decide whether the measurement should be accepted, flagged, rechecked, or removed from immediate decision-making.
6. Compare controller commands with observed equipment response. A command log must not be treated as proof that the device physically produced the requested outcome.
7. Perform permitted routine checks such as visible status, power/status indication, obvious obstruction, connection integrity, or output confirmation as defined by the equipment SOP.
8. Classify the best-supported issue as one or more of: sensor/measurement quality, sensor placement, controller logic/sequence, communication/data logging, mechanical/electrical output, environmental load beyond capacity, or unresolved.
9. Decide what can be corrected at technician level and what needs maintenance/supervisor escalation.
10. Produce a reproducible verification report that identifies evidence, uncertainty, action, and follow-up.

## Required calculation tasks
The generated case must include at least two calculations:
- sensor bias = installed reading − reference reading
- percent output deviation = (measured output − expected output) / expected output × 100
- alarm duration from timestamped start/stop events
- percentage of missing records in a supplied trend interval
- difference between zone average and room average

Units and sign/direction must be stated. A mathematically correct number without operational interpretation earns partial credit only.

## Troubleshooting sequence expected
The preferred sequence is:
1. verify the observation and data identity
2. determine whether the condition is local or systemic
3. verify the measurement with independent evidence
4. compare requested controller action with actual equipment response
5. isolate the failure class
6. protect crop/process continuity using approved procedures
7. escalate with evidence when repair or program changes exceed role authority

The candidate should avoid changing multiple variables before establishing which signal or response is unreliable.

## Assessor injects
After the candidate's first classification, supply one of the following:
- the reference instrument agrees with the crop but not the installed sensor
- a second installed sensor shows the same bias
- the controller commanded cooling/dehumidification but measured equipment output did not change
- equipment output is normal but the local environmental load is higher than elsewhere
- a communication gap created a flat trend line even though local measurements changed

The candidate must update the fault classification and explain what evidence changed the decision.

## Scoring rubric — 100 points
| Domain | Points | Full-credit evidence |
|---|---:|---|
| Sensor identity, placement and timestamp review | 10 | Confirms identity, units, time alignment and representativeness |
| Independent measurement verification | 20 | Uses qualified comparison correctly and interprets bias/repeatability |
| Controller-to-equipment response check | 20 | Distinguishes command, status and measured physical response |
| Troubleshooting logic | 15 | Isolates the likely failure class without uncontrolled changes |
| Calculations/data interpretation | 10 | Correct math, units and operational meaning |
| Safe equipment boundary | 10 | Performs permitted checks only and protects process continuity |
| Escalation/maintenance handoff | 5 | Clear problem statement, evidence and requested next action |
| Documentation quality | 10 | Traceable report with readings, timestamps, instrument IDs and result |

**Pass standard:** 80/100 and no critical error.

## Critical errors
- bypassing an interlock, guard, alarm, or safety device
- performing unauthorized electrical/mechanical repair
- changing setpoints merely to make a questionable sensor appear acceptable
- discarding or rewriting source data without traceable justification
- declaring equipment functional solely because the controller issued a command when contradictory output evidence is present

## Evidence produced
- Sensor & Equipment Verification Report
- comparison-instrument record
- annotated trend table
- calculation sheet
- fault classification
- maintenance/supervisor handoff

## Assessor closeout questions
1. Which reading did you trust most and what made it stronger evidence?
2. How did you distinguish a sensor problem from a real local microclimate?
3. What would prove the controller sequence was functioning but the equipment was not?
4. What follow-up measurement should the next shift repeat?