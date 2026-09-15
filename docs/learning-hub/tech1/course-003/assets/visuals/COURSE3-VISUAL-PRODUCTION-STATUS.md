# Course 3 Visual & Practice Asset Production Status

**Course:** `COURSE-LH-TECH1-003 — Environmental, Light & Sensor Fundamentals`

## Canonical learner delivery

Course 3 learner assets are responsive, accessible SVG files published from:

`apps/web/public/assets/course3/`

The repository/public web asset is the learner-delivery source of truth. Google Drive is a controlled production/reference mirror.

## Controlled Drive mirror

Folder: **Course 3 — Environmental & Light Learning Boards**

- folder ID: `1U5aTbJBIYEJMzlp_vMYnWu5SYdlHWPqU`
- folder URL: `https://drive.google.com/drive/folders/1U5aTbJBIYEJMzlp_vMYnWu5SYdlHWPqU`

All three produced Course 3 learner assets in this foundation batch are mirrored and recorded in `visuals/COURSE3-ASSET-REGISTRY.json`.

## Embedded teaching visuals

1. `VIS-LH-TECH1-003-001` — **Temperature, relative humidity and VPD measurement context** — Lesson 1
   - public path: `/assets/course3/environment-measurement-context.svg`
   - Drive file: `1XgNkzqjJFx9bxJ54jdj7TOBeziQnOUsw`
   - purpose: pair temperature/RH for VPD interpretation and keep target, measurement and alarm as separate record roles
2. `VIS-LH-TECH1-003-002` — **Repeatable canopy PPFD grid measurement** — Lesson 2
   - public path: `/assets/course3/ppfd-grid-measurement.svg`
   - Drive file: `19V-hi5oJs07ygw35zAxaLxRfzMpzRF8i`
   - purpose: preserve the measurement plane and full canopy distribution rather than substituting one point, fixture setting or average
3. `VIS-LH-TECH1-003-003` — **Sensor placement and representativeness triage** — Lesson 3
   - public path: `/assets/course3/sensor-representativeness-triage.svg`
   - Drive file: `1PkxPswkVjL4sCJk_fco-zKzwrbdZfgOF`
   - purpose: evaluate location, peer agreement, verification status, trend/logging context and operator authority before escalating an outlier

## Delivery contract

`scripts/test-course3-visual-registry.mjs` validates that every produced Course 3 asset:

- is registered with a unique Course 3 asset ID and public learner path;
- exists under the public Course 3 asset directory;
- includes `<title>`, `<desc>` and `viewBox` accessibility/responsive metadata;
- has a canonical raw GitHub download URL;
- is mirrored to Drive with file ID and URL metadata;
- is reachable from a canonical Course 3 lesson as an image/resource block;
- is not silently orphaned from the course.

The contract is imported by `scripts/test-tech1-course3.mjs` and runs through the deterministic Technician I structure/quality path.

## Source and scope controls

- VPD is presented as environmental drying-demand context, not as a universal cannabis target chart.
- PPFD example values in the visual are explicitly illustrative and are not production targets.
- one PPFD point, fixture setting or average is not presented as proof of whole-canopy distribution.
- sensor placement can affect representativeness; an outlier does not automatically prove either a bad sensor or a room-wide condition.
- operator-level verification is kept separate from unauthorized repair, protected calibration or control redesign.
- public/peer-reviewed sources support concepts; original diagrams do not copy source figures.

## Remaining Course 3 learner-asset priorities

- Lesson 4 alarm/trend/verification/handoff visual;
- printable environmental measurement record practice sheet;
- printable PPFD grid and sensor-verification practice sheet;
- optional PDF exports derived from canonical SVG worksheets after layout/accessibility review;
- human technical and rendered accessibility review before any draft-to-release credential status change.
