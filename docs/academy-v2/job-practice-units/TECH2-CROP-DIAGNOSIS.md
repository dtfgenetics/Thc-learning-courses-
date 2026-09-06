# Technician II Job-Practice Unit — Multi-Factor Crop Diagnosis

**Task:** `TASK-CULT2-DIAG-001`  
**Target proficiency:** Diagnostic  
**Primary competencies:** `COMP-PLANT-BIO-001`, `COMP-ENV-ADV-001`  
**Prerequisite:** Technician I Crop Observation + Environment; `LESSON-ENV-MAP-001`, `LESSON-ENV-AIRFLOW-002`, `LESSON-ENV-LOADS-003`

## What changes from Technician I

Technician I records crop condition, basic environmental context and exceptions. Technician II must combine multiple evidence streams to build and test a diagnosis.

Technician II should be able to:
- distinguish observation from interpretation
- compare plant symptoms with environmental and irrigation history
- use spatial pattern and timing to narrow causes
- identify contradictory evidence
- rank plausible explanations instead of jumping to one cause
- choose the next measurement or inspection that would discriminate among hypotheses
- recognize when a problem is localized, systemic, equipment-related or data-quality related
- recommend a routine verification/correction within SOP or escalate when evidence is insufficient

## Diagnostic workflow

### 1. Define the actual problem

Bad: “The room is stressed.”

Better: “Upper-canopy leaf-edge stress is concentrated in the northeast quarter, first appearing after the last two high-light afternoons; root-zone records are normal and the closest canopy sensor runs warmer/drier than colocated probes.”

The second statement gives location, tissue, time, context and measurable evidence.

### 2. Separate observations from hypotheses

**Observations** might include:
- leaf-edge necrosis
- slowed growth
- droop at specific times
- local high temperature
- high root-zone EC
- low emitter output
- pest signs

**Hypotheses** might include:
- excessive local heat/load
- water-delivery problem
- salt accumulation
- root dysfunction
- pest/disease pressure
- sensor bias

Do not write the hypothesis as though it were already proven.

### 3. Use pattern

Ask:
- one plant, one bench, one line, one room or facility-wide?
- edge, intake, wall, fixture, irrigation-line or cultivar pattern?
- upper canopy, lower canopy, roots or whole plant?
- new, stable, expanding or cyclical?

Pattern often eliminates explanations that do not fit distribution.

### 4. Use timing

Compare symptoms with:
- lights-on/off
- irrigation events
- environmental alarms
- room work
- nutrient batch changes
- equipment maintenance
- transplant/propagation dates
- spray or IPM events

A repeated timing relationship is evidence worth testing.

### 5. Check data quality

Before acting on a surprising number:
- confirm sensor location
- compare colocated/nearby sensors
- review calibration/verification history
- inspect timestamps/log gaps
- compare plant response with the alleged condition

### 6. Rank hypotheses

Use a simple table:

| Hypothesis | Evidence for | Evidence against | Next check |
|---|---|---|---|
| Local heat/load | hot-zone map, afternoon timing | no root-zone change | leaf temp + adjacent sensors |
| Irrigation failure | localized wilt | emitter output currently normal | review event/output history |
| Root-zone EC | possible edge burn | EC stable | repeat representative sample |

### 7. Choose the smallest useful next test

Good diagnostic work reduces uncertainty efficiently. Do not change HVAC, irrigation and nutrition simultaneously when one verification measurement can separate the likely causes.

## Worked cases

### Case 1 — One hot corner

Symptoms occur only in plants nearest one wall during high-light afternoons. Root-zone values and irrigation output are similar to the room. Canopy sensors in that corner repeatedly read warmer.

**Best next direction:** verify local temperature/radiant load and airflow pattern before changing room-wide irrigation or nutrition.

### Case 2 — One irrigation line

Droop and rising root-zone EC follow one irrigation line while room environment remains uniform.

**Best next direction:** verify delivery/output and root-zone moisture along the affected line.

### Case 3 — Room controller says normal

Controller RH is normal but dense interior-canopy probes show repeated high RH after lights-off.

**Best next direction:** treat this as a spatial measurement/airflow problem and verify the interior canopy rather than averaging it away.

### Case 4 — Sensor says extreme, plants do not

One sensor suddenly reports an extreme condition while adjacent sensors and crop observations remain stable.

**Best next direction:** verify the sensor before making a major control change.

### Case 5 — Several variables changed

A nutrient recipe, irrigation frequency and light intensity were all changed in the same week before symptoms appeared.

**Diagnostic lesson:** causality is harder to isolate. Reconstruct timing and compare spatial/cultivar responses rather than declaring one cause from symptoms alone.

## Guided practice

1. Separate observations from hypotheses in five crop notes.
2. Map a symptom pattern and rank three candidate causes.
3. Given environmental, irrigation and crop records, choose the single most informative next check.
4. Identify contradictory evidence in a proposed diagnosis.
5. Rewrite an overconfident diagnosis into an evidence-based workup.
6. Compare localized versus room-wide corrective actions.

## Decision scenarios

1. One sensor differs from all others: verify data quality first.
2. Symptoms follow one emitter line: investigate delivery/root-zone before room HVAC.
3. Symptoms are only upper canopy near fixtures: investigate light/heat context.
4. Problems begin after lights-off: review temperature/RH/moisture-load transition.
5. Multiple cultivars respond differently under the same treatment: preserve cultivar context.
6. No hypothesis fits all evidence: document uncertainty and escalate rather than force a diagnosis.
7. Coworker wants to change three variables at once: prioritize the smallest discriminating test.
8. A problem expands spatially over several days: update severity/scope and escalation priority.

## Documentation exercise

Produce a **Crop Diagnostic Workup** containing:
- problem statement
- exact crop/zone IDs
- observations
- timeline
- spatial pattern
- environment/root-zone/work history
- ranked hypotheses
- evidence for/against each
- next verification step
- recommended routine action or escalation

## Practical mapping

**Technician II Practical A — Crop Diagnostic Workup**

Candidate receives plant images, room map, environment logs, irrigation/root-zone history and prior work notes. They must construct a defensible diagnostic workup and choose the next check without overclaiming certainty.

## Portfolio artifact

**Multi-Factor Crop Diagnostic Report** demonstrating evidence ranking and next-test selection.

## Completion standard

The learner can turn multiple crop and system observations into a structured diagnostic workup, identify the strongest next verification step, and avoid unsupported single-cause conclusions.