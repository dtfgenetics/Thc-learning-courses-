# Course 2 Visual Production Status

**Course:** `COURSE-LH-TECH1-002 — Plant Observation, Growth Stages & Crop Records`

## Batch 1 produced learner visuals

The first Course 2 visual-learning batch is produced as responsive, accessible SVG and published from the canonical repository public asset path:

`apps/web/public/assets/course2/`

Produced assets:

1. `VIS-LH-TECH1-002-001` — **Representative crop-walk route and sample context**
   - lesson: `LESSON-LH-TECH1-002-01`
   - purpose: representative route, spatial coverage, denominator and room-level inference boundaries
   - public path: `/assets/course2/representative-crop-walk-route.svg`
2. `VIS-LH-TECH1-002-002` — **Morphology-based developmental staging**
   - lesson: `LESSON-LH-TECH1-002-02`
   - purpose: separate observable developmental morphology from calendar-only staging
   - public path: `/assets/course2/morphology-stage-evidence.svg`
3. `VIS-LH-TECH1-002-003` — **Diagnostic photo evidence set**
   - lesson: `LESSON-LH-TECH1-002-04`
   - purpose: context view, whole-plant view, close detail, image identity and color-fidelity principles
   - public path: `/assets/course2/diagnostic-photo-evidence-set.svg`

## Delivery contract

`visuals/COURSE2-ASSET-REGISTRY.json` is the Course 2 learner-visual registry. The registry is intentionally expandable and has no artificial asset-count ceiling.

`scripts/test-course2-visual-registry.mjs` enforces that produced Course 2 learner visuals:

- use stable Course 2 visual IDs;
- exist in the canonical public asset directory;
- include SVG `<title>` and `<desc>` accessibility metadata;
- include a `viewBox` for responsive rendering;
- have canonical raw GitHub download URLs;
- are mapped into canonical Course 2 lesson image blocks;
- use lesson image paths that match the registry;
- include meaningful learner-facing alt text and captions;
- are not left as orphaned produced assets.

The visual contract is imported by `scripts/test-tech1-course2.mjs`, so the normal Course 2 deterministic CI path validates the visual layer automatically.

## Source and scope controls

Visuals are teaching diagrams. They do not replace canonical lesson text or authoritative sources.

- The crop-walk diagram explicitly states that its route is an example and that actual route/sample size follow the facility plan.
- The developmental-stage diagram treats published timing as context and does not define universal cultivar timing or harvest readiness.
- The photo-evidence diagram supports documentation quality and does not represent photographs as proof of diagnosis.

## Next visual batch

Course 2 still needs additional visual support, especially:

- observation vs interpretation vs diagnosis boundary;
- spatial-pattern comparison: isolated, zonal, edge-associated and widespread;
- crop-record reconstruction / handoff chain;
- reproductive morphology comparison references after source/copyright review;
- learner activity worksheets and downloadable room-map practice sheets.

Lesson 3 remains the largest visual gap and should receive the next diagram once its connector-safe editing path is resolved.
