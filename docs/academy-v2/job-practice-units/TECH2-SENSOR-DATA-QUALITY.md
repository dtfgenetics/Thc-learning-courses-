# Technician II Job-Practice Unit — Sensors, Controls & Data Quality

**Tasks:** `TASK-CULT2-SENSOR-001`, `TASK-CULT2-EQUIPMENT-001`  
**Target proficiency:** Diagnostic / Applied  
**Primary competencies:** `COMP-ENV-ADV-001`, `COMP-PRO-QA-001`, `COMP-WATER-001`  
**Prerequisite:** Technician I Environmental Monitoring; `LESSON-ENV-MAP-001`, `LESSON-ENV-AIRFLOW-002`, `LESSON-ENV-LOADS-003`

## What changes from Technician I

Technician I reads environmental sensors and recognizes values that need follow-up. Technician II must determine whether the data itself is trustworthy and whether the system is responding as expected.

The technician should be able to:
- compare multiple sensors and locations
- identify probable drift, placement bias or logging gaps
- review calibration/verification history
- distinguish local microclimate from room-wide condition
- connect controller command, equipment operation and actual room response
- recognize opposing control loops or insufficient response
- perform permitted routine checks
- document faults clearly for maintenance/management
- avoid unsafe or unauthorized electrical/mechanical repair

## Core workflow

### 1. Verify the measurement chain

Ask:
1. what is being measured?
2. where is the sensor?
3. when was it last verified?
4. does another sensor support the reading?
5. does the crop/environment physically support the reading?

### 2. Compare spatially

One wall controller may look normal while canopy-level probes show a persistent gradient. Compare:
- canopy interior
- upper canopy
- perimeter/wall
- supply/return air
- high-risk zones

### 3. Compare temporally

Look for:
- abrupt step changes
- slow drift
- flat-line readings
- missing data
- spikes aligned with doors/irrigation/lights
- repeated lights-off problems

### 4. Compare command versus response

Example questions:
- did dehumidification turn on?
- did RH actually fall?
- did cooling reduce temperature?
- did irrigation run when commanded?
- did the room recover within the expected time?

A command is not evidence that the equipment produced the intended result.

### 5. Identify control conflicts

Possible inefficient loops include:
- cooling while reheating continuously
- humidifying while dehumidifying
- ventilation fighting CO₂ control
- frequent cycling without achieving crop-zone stability

Technician II should document the observed sequence and impact, not redesign controls outside authority.

### 6. Escalate equipment faults clearly

A good escalation states:
- equipment/system ID
- observed fault
- time started
- alarm/reading
- verification performed
- affected room/zone
- crop impact
- safe interim action if defined

## Worked cases

### Case 1 — Sensor drift

Three colocated RH sensors read 61%, 62% and 76%. The 76% sensor has no recent verification record.

**Best next step:** verify/calibrate the outlier before changing room set points.

### Case 2 — Interior canopy high RH

Wall sensor reads normally, but interior-canopy probes rise sharply after lights-off while return air remains acceptable.

**Interpretation:** likely spatial mixing/moisture-load issue worth investigating; wall reading should not override the crop-zone measurements.

### Case 3 — Dehumidifier command without response

Controller log shows a dehumidification call for 45 minutes, but RH remains unchanged and unit status does not show expected condensate/fan response.

**Best next direction:** verify unit operation and escalate the suspected equipment fault.

### Case 4 — Abrupt sensor jump after maintenance

A temperature sensor begins reading several degrees warmer immediately after being moved near a fixture.

**Interpretation:** placement bias is more plausible than a sudden room-wide heat event.

### Case 5 — Lights-off control conflict

Cooling reduces temperature rapidly at lights-off, RH climbs, dehumidification starts, then reheat starts repeatedly.

**Technician II response:** document the sequence and resulting crop-zone conditions for control review rather than adjusting every set point independently.

## Guided practice

1. Find the faulty or biased sensor in a six-sensor comparison.
2. Review a 24-hour trend and mark transients, drift and sustained deviations.
3. Compare controller commands with actual room response.
4. Identify a control loop that appears to be fighting itself.
5. Write a maintenance escalation from raw alarm/log data.
6. Decide which checks are safe/authorized for a technician versus maintenance personnel.

## Decision scenarios

1. One outlier sensor after relocation: check placement/verification first.
2. Controller says normal but crop-zone probes disagree: investigate crop-zone evidence.
3. Equipment command occurs but no process response: verify operation and escalate.
4. Short door-opening spike: interpret context before calling system failure.
5. Repeated nightly RH excursion: analyze load/sequence over time.
6. Coworker suggests opening electrical panel without authorization: stay within safe maintenance boundary.
7. Sensor data are missing for two hours during a suspected excursion: document data gap as uncertainty.
8. Two rooms show identical strange values from one shared sensor model: review calibration/firmware/systemic measurement issue.

## Documentation exercise

Produce a **Sensor & Control Data-Quality Investigation** containing:
- system/sensor IDs
- location map
- calibration/verification status
- comparison readings
- relevant trend window
- controller commands
- actual process response
- likely measurement/equipment issue
- permitted checks completed
- escalation/follow-up

## Practical mapping

**Technician II Practical B — Sensor & Equipment Verification**

Candidate receives sensor maps, calibration records, control logs, equipment status and room trends. They must identify the likely data/equipment problem and produce a maintenance-ready investigation note.

## Portfolio artifact

**Environmental Data-Quality Investigation** with spatial map and command-versus-response analysis.

## Completion standard

The learner can determine whether environmental data are trustworthy, recognize common control/equipment response problems, and escalate a clearly documented fault without unsafe or unauthorized repair.