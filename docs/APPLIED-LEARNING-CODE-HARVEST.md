# Applied Learning Code Harvest

Status: approved implementation boundary
Tracking: #541 / PR #542

## Goal

Avoid cloning whole applications. Adopt small, permissively licensed primitives behind THC-owned adapters so multiple Academy tools share one implementation.

## Selected upstream primitives

| Capability | Upstream | License | THC use |
| --- | --- | --- | --- |
| graph model/rendering | cytoscape/cytoscape.js | MIT | Knowledge Graph, Cause Chain, Systems Map, Root-Cause Tree |
| time-series rendering | leeoniya/uPlot | MIT | Environmental Replay, Plant Twin history, Flight Recorder |
| persisted deterministic rules | json-logic/json-logic-engine | MIT | simulations, scenario scoring, failure rules, decision logic |
| unit-aware calculations | josdejong/mathjs | Apache-2.0 | Crop Math and validated unit conversion/calculation paths |

## Do not copy

- complete competitor applications;
- branding, instructional copy, datasets, images, or proprietary UX;
- upstream demo code when a small adapter is sufficient;
- redundant graph/chart/rules/math libraries for individual tools.

## Shared THC adapter boundary

Create one adapter per capability:

- `graph-adapter`: accepts THC node/edge records and returns renderer-neutral graph state.
- `timeline-adapter`: accepts timestamped THC measurement/event records and returns renderer-neutral series.
- `rules-adapter`: evaluates versioned declarative rules against immutable scenario state.
- `calculation-adapter`: exposes an allowlisted set of cultivation calculations and unit conversions.

Feature code consumes these adapters, not upstream packages directly. This keeps replacement possible and prevents library-specific data structures from leaking into curriculum records.

## Canonical shared event model

`Plant -> Environment -> Root Zone -> Observation -> Measurement -> Event -> Evidence -> Mechanism -> Hypothesis -> Intervention -> Outcome`

All simulation-oriented features should exchange versioned records from this model rather than inventing feature-specific copies.

## Security and correctness

- Never evaluate arbitrary learner-supplied expressions.
- Calculation functions are allowlisted and covered by deterministic fixtures.
- Rule definitions are versioned content, not executable JavaScript.
- Assessment answer keys stay server-side.
- Simulation fixtures contain no learner PII.
- Upstream licenses and notices must be retained as required.

## Initial consolidation targets

1. Knowledge Graph + Cause Chain + Systems Map share graph adapter.
2. Environmental Replay + Plant Twin + Flight Recorder share timeline adapter.
3. Blueprint Lab + Calibration Bench + Equipment Failure Lab + Data Detective share rules adapter.
4. Crop Math uses the calculation adapter.
5. Observation/measurement/event schemas are shared across all four groups.

## Acceptance

Do not add another graph, chart, rules, or math dependency unless the existing adapter cannot satisfy a documented requirement and a replacement/extension decision is recorded.
