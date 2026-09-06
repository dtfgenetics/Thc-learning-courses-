# Technician II Job-Practice Unit — Cultivation Equipment Verification

**Task:** `TASK-CULT2-EQUIPMENT-001`  
**Target proficiency:** Applied  
**Primary competencies:** `COMP-ENV-ADV-001`, `COMP-IRRIGATION-ADV-001`, `COMP-PRO-QA-001`  
**Prerequisite:** Technician I Environment/Irrigation/Safety; advanced environment and irrigation modules

## Role boundary
Technician II verifies that cultivation equipment appears to operate as commanded, performs permitted routine checks, preserves evidence, and escalates faults. Electrical repair, refrigerant work, control-program redesign, pesticide-equipment repair requiring authorization, and other qualified trades remain outside this credential.

## Verification model
Use four questions:
1. **Was a command/request made?**
2. **Did the equipment respond?**
3. **Did the process variable respond?**
4. **Is the response consistent over time?**

A controller saying “ON” does not prove a pump, valve, fan, dehumidifier or light actually produced the intended output.

## Routine workflow
- identify equipment and asset/zone
- review alarm and maintenance history
- inspect obvious safe conditions
- compare command/state/output
- verify related sensor/data quality
- perform authorized reset/check only when procedure allows
- determine whether the issue is measurement, control command, equipment response, distribution or capacity related
- document time, symptom, evidence and escalation

## Worked cases

### Pump command with no downstream flow
Controller history shows the pump command occurred, but measured emitter output is zero.

Strong response: verify safe observable states, valve/zone status and permitted checks, then escalate the likely delivery/equipment fault. Do not assume the irrigation schedule itself failed to run.

### Dehumidifier runs but RH continues rising
Equipment state indicates operation, yet canopy RH rises during a predictable moisture-load period.

Interpretation: possible insufficient capacity, airflow/distribution problem, faulty process measurement or equipment degradation. Compare load and spatial data before declaring one cause.

### Alarm clears after reset but returns
A permitted reset temporarily clears an alarm, which returns twice.

Strong response: do not treat repeated reset as corrective maintenance. Preserve the pattern and escalate.

## Common mistakes
- equating controller state with physical output
- repeatedly resetting equipment without investigating recurrence
- bypassing interlocks or safety controls
- diagnosing a machine from one alarm code without process context
- failing to record when the fault began and what crop/process areas were affected
- performing unauthorized repair

## Guided practice
1. Match command, equipment-state and process-response traces.
2. Identify the earliest evidence of a recurring fault.
3. Separate sensor failure from equipment failure in five scenarios.
4. Write a maintenance-ready escalation containing asset, time, symptoms, checks and affected scope.
5. Classify checks as technician-permitted versus qualified-maintenance-only.

## Practical mapping
**Practical B — Sensor & Equipment Verification** combines sensor bias, controller history, alarms and measured output.

## Portfolio artifact
**Equipment Verification & Escalation Report** with command/output evidence and a safe troubleshooting boundary.

## Completion standard
The learner can verify basic cultivation-equipment response, distinguish likely control/data/output problems, perform only authorized checks, and provide maintenance with a concise evidence package.