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

All eight produced Course 2 learner assets are mirrored and recorded in `visuals/COURSE2-ASSET-REGISTRY.json`.

## Embedded teaching visuals

1. `VIS-LH-TECH1-002-001` — Representative crop-walk route and sample context — Lesson 1
2. `VIS-LH-TECH1-002-002` — Morphology-based developmental staging — Lesson 2
3. `VIS-LH-TECH1-002-003` — Diagnostic photo evidence set — Lesson 4
4. `VIS-LH-TECH1-002-004` — Spatial pattern comparison — Lesson 1
5. `VIS-LH-TECH1-002-005` — Reconstructable crop-record and shift-handoff chain — Lesson 4
6. `VIS-LH-TECH1-002-008` — **Observation, interpretation, and diagnostic-boundary workflow** — Lesson 3
   - public path: `/assets/course2/observation-interpretation-diagnosis-boundary.svg`
   - Drive file: `1RmCMeNyBaC9LN-cRCjBPPW3SDGcZQ6Fw`
   - purpose: separate direct observation, pattern/context, provisional interpretation and confirmation/escalation
   - public source support: Penn State Extension, `Overview of Plant Diagnostics`

## Downloadable practice assets

7. `VIS-LH-TECH1-002-006` — **Crop-walk room-map practice worksheet**
   - lesson: `LESSON-LH-TECH1-002-01`
   - public path: `/assets/course2/crop-walk-room-map-practice.svg`
   - Drive file: `19yfPykI9EjTLyDM1x7R7Zb28CRMROfXX`
   - practice: route design, observation points, denominator, spatial pattern, direct observation, context, uncertainty, escalation
8. `VIS-LH-TECH1-002-007` — **Observation record and handoff practice worksheet**
   - lesson: `LESSON-LH-TECH1-002-04`
   - public path: `/assets/course2/observation-handoff-practice.svg`
   - Drive file: `15QdqMlqJZmjy_xg4AgRK8twEm3GyxapA`
   - practice: identity/timing, direct evidence, photo checks, context, action, uncertainty, escalation, next check, cross-check and correction history

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

These assets teach evidence collection, reasoning boundaries and record quality. They do not replace facility procedures, diagnostic authority, jurisdiction-specific requirements or human technical review.

- sample routes and sizes remain facility/purpose-specific;
- spatial pattern describes distribution and does not prove cause;
- developmental timing is context, not a universal cultivar rule;
- photographs support documentation and do not prove diagnosis;
- symptoms, timing, environment and work history can narrow a diagnostic differential without independently confirming one cause;
- exact handoff forms, roles, escalation paths and correction controls remain facility-specific.

## Remaining Course 2 learner-asset priorities

- reproductive morphology comparison references after source/copyright review;
- photo-evidence practice packet with example image sets and accessible text alternatives;
- optional printable/PDF exports derived from the canonical SVG worksheets after layout/accessibility review;
- human technical and accessibility review before any draft-to-release status change.

Lesson 3 now has a normal connector-safe visual and source-depth improvement. No bypass of connector or safety controls was used.
