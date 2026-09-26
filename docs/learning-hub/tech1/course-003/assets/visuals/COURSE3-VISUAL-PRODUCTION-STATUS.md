# Course 3 Visual & Practice Asset Production Status

**Course:** `COURSE-LH-TECH1-003 — Environmental, Light & Sensor Fundamentals`

## Canonical learner delivery

Course 3 learner assets are WebP files published from `apps/web/public/assets/course3/`. Converted assets retain accessible SVG provenance sources, while the native VPD science visual retains its PNG master and Drive identifiers. The repository/public WebP is the learner-delivery source of truth.

## Controlled Drive mirror

Folder: **Course 3 — Environmental & Light Learning Boards**

- folder ID: `1U5aTbJBIYEJMzlp_vMYnWu5SYdlHWPqU`
- folder URL: `https://drive.google.com/drive/folders/1U5aTbJBIYEJMzlp_vMYnWu5SYdlHWPqU`

All seven produced Course 3 learner assets are recorded in `visuals/COURSE3-ASSET-REGISTRY.json`; converted assets retain their legacy Drive provenance and the native-raster asset records both its WebP and PNG-master Drive mirrors.

## Embedded teaching visuals

1. `VIS-LH-TECH1-003-001` — **Temperature, relative humidity and VPD measurement context** — Lesson 1  
   public path `/assets/course3/environment-measurement-context.svg` · Drive `1XgNkzqjJFx9bxJ54jdj7TOBeziQnOUsw`
2. `VIS-LH-TECH1-003-002` — **Repeatable canopy PPFD grid measurement** — Lesson 2  
   public path `/assets/course3/ppfd-grid-measurement.svg` · Drive `19V-hi5oJs07ygw35zAxaLxRfzMpzRF8i`
3. `VIS-LH-TECH1-003-003` — **Sensor placement and representativeness triage** — Lesson 3  
   public path `/assets/course3/sensor-representativeness-triage.svg` · Drive `1PkxPswkVjL4sCJk_fco-zKzwrbdZfgOF`
4. `VIS-LH-TECH1-003-004` — **Alarm, trend, verification and handoff workflow** — Lesson 4  
   public path `/assets/course3/alarm-trend-handoff-workflow.svg` · Drive `1QSblfA3xwMgshyuTWUwaZcEOqovv8mWK`

## Downloadable practice assets

5. `VIS-LH-TECH1-003-005` — **Environmental measurement record practice worksheet**  
   linked from Lessons 1 and 4 · public path `/assets/course3/environment-measurement-practice.svg` · Drive `1f0q2gjMnAme6eikxUL3a0zsq_BPgMGov`
6. `VIS-LH-TECH1-003-006` — **PPFD grid and sensor verification practice worksheet**  
   linked from Lessons 2 and 3 · public path `/assets/course3/ppfd-sensor-verification-practice.svg` · Drive `1Pd-eLG_fh4FQBoITJHInTDDzCgE_Tnht`

## Delivery contract

`scripts/test-course3-visual-registry.mjs` now requires at least seven produced Course 3 learner assets, including at least five embedded visuals and two downloadable practice sheets. It verifies:

- unique Course 3 asset IDs and learner paths;
- public source files under the Course 3 asset directory;
- production WebP integrity plus SVG accessibility metadata for converted assets and PNG/WebP/Drive provenance for native-raster assets;
- canonical raw GitHub download URLs;
- Drive file IDs/URLs and mirrored status;
- at least one embedded visual in each Course 3 lesson;
- downloadable-resource blocks that match registry learner paths;
- meaningful learner alt text/descriptions/captions;
- no produced asset orphaned from canonical lessons.

The contract is imported by `scripts/test-tech1-course3.mjs` and runs through the deterministic Technician I structure/quality path.

## Source and scope controls

- VPD is environmental drying-demand context, not a universal cannabis target chart.
- PPFD example values are illustrative and are not production targets.
- one PPFD point, fixture setting or average is not proof of whole-canopy distribution.
- sensor placement can affect representativeness; an outlier does not automatically prove either a bad sensor or a room-wide condition.
- alarms and trends support investigation but do not independently establish biological damage or root cause.
- operator-level verification is kept separate from unauthorized repair, protected calibration or control redesign.
- public/peer-reviewed sources support concepts; original diagrams do not copy source figures.

## Current learner-asset status

The planned Course 3 learner-asset layer is complete for the current course design: all four lessons have dedicated embedded visual support and two printable practice tools cover the core measurement/verification workflows. Further assets remain allowed because the registry has no hard content ceiling.

Optional future work includes PDF exports derived from the canonical SVG worksheets after layout/accessibility review. Human technical and rendered accessibility review remain required before any draft-to-release credential status change.
