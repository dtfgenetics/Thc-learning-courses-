# THC Applied Learning Innovation Suite

Status: implementation
Owner: THC Academy
Tracking: #541

## Product goal

Extend Teaching Healthy Cultivation from a course-and-assessment platform into an applied learning system. The suite must reuse the Academy's canonical science, competencies, objectives, evidence, and credential boundaries rather than creating a parallel curriculum.

## Approved feature set

| Feature | Product role | First executable slice |
| --- | --- | --- |
| THC Knowledge Graph | Shared relationship layer across Academy concepts | 50 canonical concept nodes plus typed relationships |
| THC Measurement School | Measurement technique training | Sensor placement lesson/activity |
| Same Symptom, Different Cause | Differential-observation training | Five validated comparison scenarios |
| THC Crop Math | Quantitative cultivation tools | DLI calculator with explanation and tests |
| Grow Room Blueprint Lab | Applied room-design activity | 10 x 10 ft training room |
| THC Calibration Bench | Instrument competency simulation | pH-meter calibration exercise |
| Plant Timeline Atlas | Healthy-development baseline | Standardized lifecycle capture protocol |
| Grower Flight Recorder | Structured crop history | Common grow-event schema and timeline |
| Crop Incident Report | Operations documentation | Universal incident/corrective-action record |
| THC Cause Chain | Mechanistic reasoning maps | One evidence-linked cause chain |

## Shared architecture

All features should resolve into existing Academy objects where applicable:

`reference/claim -> competency -> objective -> lesson/activity -> assessment/practical -> course -> credential`

New feature-specific records may reference canonical IDs but must not duplicate canonical science text.

### Common metadata

Every feature record should expose, where applicable:

- stable ID and semantic version;
- title and learner-facing summary;
- status;
- linked competency/objective IDs;
- linked claim/reference IDs;
- role/proficiency boundary;
- required learner inputs;
- deterministic output/scoring rules when scored;
- accessibility text requirements;
- asset references;
- review state.

## Status boundaries

Machine-authored content begins as draft/planned. Human scientific/editorial/accessibility review, pilot evidence, standard setting, and credential authorization remain separate evidence-backed gates. These features must not silently turn draft content into credential-authorized material.

## Visual production rule

Instructional visuals are raster-first (PNG/WebP/JPEG), high resolution, educationally purposeful, and designed for photorealistic or controlled branded-chart presentation. Do not introduce SVG instructional artwork.

## Milestone 1 — common foundation

Build:
1. schemas for knowledge-graph nodes/edges and measurement activities;
2. seed graph with 50 canonical concepts selected from existing Academy material;
3. first Measurement School sensor-placement activity;
4. runtime/API projection that does not expose private assessment data;
5. deterministic schema/referential-integrity/runtime tests;
6. learner-facing shell for graph exploration and measurement activity;
7. raster asset manifest/placeholders only where production imagery is not yet available.

## Milestone 2 — reasoning and calculation

Build Same Symptom, Different Cause, Crop Math, and Cause Chain on the shared graph/evidence layer.

## Milestone 3 — simulation

Build Blueprint Lab and Calibration Bench with deterministic state/scoring engines separated from presentation.

## Milestone 4 — observation and operations

Build Plant Timeline Atlas, Grower Flight Recorder, and Crop Incident Report with reusable records and exportable learner artifacts.

## Completion criteria

A feature is structurally complete when IDs are unique, references resolve, canonical content is reused, schemas validate, registries are synchronized, focused tests pass, learner/API contracts are tested, and known human gates remain truthfully represented.
