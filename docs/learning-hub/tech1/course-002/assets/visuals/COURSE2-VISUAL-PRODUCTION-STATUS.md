# Course 2 Visual Production Status

**Course:** `COURSE-LH-TECH1-002 — Plant Observation, Growth Stages & Crop Records`

## Canonical learner delivery

Course 2 learner visuals are responsive, accessible SVG files published from the canonical repository path:

`apps/web/public/assets/course2/`

The repository/public web asset is the learner-delivery source of truth. Google Drive is a controlled production/reference mirror and does not replace the canonical repo asset.

## Controlled Drive mirror

Folder: **Course 2 — Visual Learning Boards**

- folder ID: `1pZCMSaiS5MiJpwgokjsR6mhZr_dbR58o`
- folder URL: `https://drive.google.com/drive/folders/1pZCMSaiS5MiJpwgokjsR6mhZr_dbR58o`

Verified mirrored files:

- `VIS-LH-TECH1-002-001` → Drive file `1bFsloLImhTHIkbKhtecwFRrVUdPRF_Be`
- `VIS-LH-TECH1-002-002` → Drive file `1kGi-w_LUEDfixKqLH1DSBNaKlkW7Hhza`
- `VIS-LH-TECH1-002-003` → Drive file `1_yIa32k-99B6QSLl721tMn1ny5ZIlRgq`
- `VIS-LH-TECH1-002-004` → Drive file `1F0QeitcZwsqkHokVoVsqm92Cs1MzHea7`
- `VIS-LH-TECH1-002-005` → Drive file `1R64EMjV4jtRsGJD3JWptXOF_murzcLU8`

All five produced Course 2 visuals are now mirrored and their Drive IDs are recorded in `visuals/COURSE2-ASSET-REGISTRY.json`.

## Produced learner visuals

### Batch 1

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

### Batch 2

4. `VIS-LH-TECH1-002-004` — **Spatial pattern comparison**
   - lesson: `LESSON-LH-TECH1-002-01`
   - purpose: distinguish isolated, edge-associated, zonal/clustered and widespread distributions while keeping pattern separate from causal interpretation
   - public path: `/assets/course2/spatial-pattern-comparison.svg`
5. `VIS-LH-TECH1-002-005` — **Reconstructable crop-record and shift-handoff chain**
   - lesson: `LESSON-LH-TECH1-002-04`
   - purpose: connect observation, record, action/escalation, handoff and recheck so another qualified person can reconstruct what happened and what remains open
   - public path: `/assets/course2/reconstructable-handoff-chain.svg`

## Delivery contract

`visuals/COURSE2-ASSET-REGISTRY.json` is the Course 2 learner-visual registry. The registry is intentionally expandable and has no artificial asset-count ceiling.

`scripts/test-course2-visual-registry.mjs` requires at least five produced Course 2 visuals and enforces that produced assets:

- use stable Course 2 visual IDs;
- exist in the canonical public asset directory;
- include SVG `<title>` and `<desc>` accessibility metadata;
- include a `viewBox` for responsive rendering;
- have canonical raw GitHub download URLs;
- are mapped into canonical Course 2 lesson image blocks;
- use lesson image paths that match the registry;
- include meaningful learner-facing alt text and captions;
- are not left as orphaned produced assets;
- explicitly track Drive mirror state; and
- include a Drive file ID/URL when marked `mirrored`.

The visual contract is imported by `scripts/test-tech1-course2.mjs`, so the normal Course 2 deterministic CI path validates the visual layer automatically.

## Source and scope controls

Visuals are teaching diagrams. They do not replace canonical lesson text, facility procedures or authoritative sources.

- The crop-walk diagram is an example; actual route/sample size follows the facility plan.
- The spatial-pattern diagram describes distribution and does not claim that a particular pattern proves a cause.
- The developmental-stage diagram treats published timing as context and does not define universal cultivar timing or harvest readiness.
- The photo-evidence diagram supports documentation quality and does not represent photographs as proof of diagnosis.
- The handoff-chain diagram is a continuity model; exact forms, roles, escalation paths and correction methods remain facility-specific.

## Remaining visual priorities

Course 2 still needs additional support, especially:

- observation vs interpretation vs diagnosis boundary;
- reproductive morphology comparison references after source/copyright review;
- learner activity worksheets and downloadable room-map practice sheets;
- a photo-evidence practice packet with accessible text alternatives;
- a future Lesson 3 visual when its connector-safe editing path is resolved.

Lesson 3 remains the largest visual gap. It should not be force-edited through a workaround that bypasses normal connector/safety controls.
