# Course 2 Visual & Practice Asset Production Status

**Course:** `COURSE-LH-TECH1-002 — Plant Observation, Growth Stages & Crop Records`

## Canonical learner delivery

Course 2 learner assets are responsive, accessible SVG files published from:

`apps/web/public/assets/course2/`

The repository/public web asset is the learner-delivery source of truth. Google Drive is a controlled production/reference mirror.

## Controlled Drive mirror

Folder: **Course 2 — Visual Learning Boards**

- folder ID: `1pZCMSaiS5MiJpwgokjsR6mhZr_dbR58o`
- folder URL: `https://drive.google.com/drive/folders/1pZCMSaiS5MiJpwgokjsR6mhZr_dbR58o`

All nine produced Course 2 learner assets are mirrored and recorded in `visuals/COURSE2-ASSET-REGISTRY.json`.

## Embedded teaching visuals

1. `VIS-LH-TECH1-002-001` — Representative crop-walk route and sample context — Lesson 1
2. `VIS-LH-TECH1-002-002` — Morphology-based developmental staging — Lesson 2
3. `VIS-LH-TECH1-002-003` — Diagnostic photo evidence set — Lesson 4
4. `VIS-LH-TECH1-002-004` — Spatial pattern comparison — Lesson 1
5. `VIS-LH-TECH1-002-005` — Reconstructable crop-record and shift-handoff chain — Lesson 4
6. `VIS-LH-TECH1-002-008` — Observation, interpretation, and diagnostic-boundary workflow — Lesson 3
7. `VIS-LH-TECH1-002-009` — **Reproductive morphology reference** — Lesson 2
   - public path: `/assets/course2/reproductive-morphology-reference.svg`
   - Drive file: `12HYzvOKia-ECsVE50CiwTtWfTFAd_yWa`
   - purpose: original schematic for documenting visible pistillate and staminate structures and unexpected/mixed expression without unsupported causal inference
   - source support: existing `REF-FLOWER-MORPH-2023-001` plus an open-access review on Cannabis sexual-expression plasticity
   - copyright control: original teaching schematic; no published source figure reproduced

## Downloadable practice assets

8. `VIS-LH-TECH1-002-006` — Crop-walk room-map practice worksheet — Lesson 1
9. `VIS-LH-TECH1-002-007` — Observation record and handoff practice worksheet — Lesson 4

## Delivery contract

`scripts/test-course2-visual-registry.mjs` validates both asset delivery types:

- `embedded-visual` assets must appear as canonical lesson image blocks with matching public paths, meaningful alt text and captions;
- `downloadable-practice` assets must appear as lesson resource blocks with matching learner download paths and learner-facing descriptions/labels;
- all produced assets must exist in the public Course 2 directory;
- all SVGs must include `<title>`, `<desc>` and `viewBox` accessibility/responsive metadata;
- all produced assets must have canonical raw GitHub download URLs;
- all produced assets must be mirrored to Drive with file ID and URL metadata;
- no produced asset may remain orphaned from its canonical lesson.

The contract is imported by `scripts/test-tech1-course2.mjs` and runs through the normal deterministic Technician I CI path.

## Source and scope controls

These assets teach evidence collection, reproductive/developmental morphology, reasoning boundaries and record quality. They do not replace facility procedures, diagnostic authority, jurisdiction-specific requirements or human technical review.

- sample routes and sizes remain facility/purpose-specific;
- spatial pattern describes distribution and does not prove cause;
- developmental timing is context, not a universal cultivar rule;
- photographs support documentation and do not prove diagnosis;
- symptoms, timing, environment and work history can narrow a diagnostic differential without independently confirming one cause;
- visible pistillate or staminate structures establish what was observed, not why sexual expression occurred;
- the reproductive-morphology schematic is not to scale and must not be used to predict sex from vegetative appearance;
- exact handoff forms, roles, escalation paths and correction controls remain facility-specific.

## Remaining Course 2 learner-asset priorities

- photo-evidence practice packet with example image sets and accessible text alternatives;
- optional printable/PDF exports derived from the canonical SVG worksheets after layout/accessibility review;
- human technical and accessibility review before any draft-to-release status change.

All four Course 2 lessons now have dedicated visual support. Course 2 remains draft-gated pending human review and any additional performance-validation work required by the program.
