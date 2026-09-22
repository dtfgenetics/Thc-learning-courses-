# Course 2 Visual & Practice Asset Production Status

**Course:** `COURSE-LH-TECH1-002 — Plant Observation, Growth Stages & Crop Records`

## Canonical learner delivery

Course 2 currently uses ten responsive, accessible SVG files as a **legacy compatibility baseline** published from `apps/web/public/assets/course2/`. They remain in place only to avoid breaking the verified learner surface. Current production policy requires high-resolution PNG/WebP/JPEG/JPG replacements. The repository/public web asset remains the learner-delivery source of truth; Google Drive is a controlled production/reference mirror.

## Controlled Drive mirror

Folder: **Course 2 — Visual Learning Boards**

- folder ID: `1pZCMSaiS5MiJpwgokjsR6mhZr_dbR58o`
- folder URL: `https://drive.google.com/drive/folders/1pZCMSaiS5MiJpwgokjsR6mhZr_dbR58o`

All ten current compatibility assets are mirrored and recorded in `visuals/COURSE2-ASSET-REGISTRY.json`. Each now carries an explicit fail-closed raster-replacement requirement.

## Embedded teaching visuals

1. `VIS-LH-TECH1-002-001` — Representative crop-walk route and sample context — Lesson 1
2. `VIS-LH-TECH1-002-002` — Morphology-based developmental staging — Lesson 2
3. `VIS-LH-TECH1-002-003` — Diagnostic photo evidence set — Lesson 4
4. `VIS-LH-TECH1-002-004` — Spatial pattern comparison — Lesson 1
5. `VIS-LH-TECH1-002-005` — Reconstructable crop-record and shift-handoff chain — Lesson 4
6. `VIS-LH-TECH1-002-008` — Observation, interpretation, and diagnostic-boundary workflow — Lesson 3
7. `VIS-LH-TECH1-002-009` — Reproductive morphology reference — Lesson 2

## Downloadable practice assets

8. `VIS-LH-TECH1-002-006` — Crop-walk room-map practice worksheet — Lesson 1
9. `VIS-LH-TECH1-002-007` — Observation record and handoff practice worksheet — Lesson 4
10. `VIS-LH-TECH1-002-010` — **Photo evidence audit practice worksheet** — Lesson 4
    - public path: `/assets/course2/photo-evidence-audit-practice.svg`
    - Drive file: `1frurg0HF-WpsWx_-EPAdjaJZFMv64TdO`
    - practice: audit synthetic example image sets for context, whole-plant coverage, close detail, identity/time, comparison value, lighting consistency, material image edits, original-file preservation and retake/additional-image needs
    - evidence boundary: learners evaluate documentation quality rather than diagnosing the plant shown in the synthetic examples

## Delivery contract

`scripts/test-course2-visual-registry.mjs` validates both asset delivery types:

- `embedded-visual` assets must appear as canonical lesson image blocks with matching public paths, meaningful alt text and captions;
- `downloadable-practice` assets must appear as lesson resource blocks with matching learner download paths and learner-facing descriptions/labels;
- all produced assets must exist in the public Course 2 directory;
- while legacy SVG compatibility files remain live, they must include `<title>`, `<desc>` and `viewBox` accessibility/responsive metadata;
- no SVG may be treated as the final production target; every live SVG entry must retain an open raster-replacement record until a PNG/WebP/JPEG/JPG replacement passes release QA;
- all produced assets must have canonical raw GitHub download URLs;
- all produced assets must be mirrored to Drive with file ID and URL metadata;
- no produced asset may remain orphaned from its canonical lesson.

The contract is imported by `scripts/test-tech1-course2.mjs` and runs through the normal deterministic Technician I CI path.

## Source and scope controls

These assets teach evidence collection, reproductive/developmental morphology, diagnostic-reasoning boundaries and record quality. They do not replace facility procedures, diagnostic authority, jurisdiction-specific requirements or human technical review.

- sample routes and sizes remain facility/purpose-specific;
- spatial pattern describes distribution and does not prove cause;
- developmental timing is context, not a universal cultivar rule;
- photographs support documentation and do not prove diagnosis;
- synthetic photo-practice examples teach evidence quality and do not depict confirmed plant disorders;
- symptoms, timing, environment and work history can narrow a diagnostic differential without independently confirming one cause;
- visible pistillate or staminate structures establish what was observed, not why sexual expression occurred;
- exact handoff forms, roles, escalation paths and correction controls remain facility-specific.

## Remaining Course 2 learner-asset priorities

- produce high-resolution raster replacements for all ten legacy SVG compatibility assets;
- verify factual copy, accessibility, responsive layout, registry mapping and public delivery for each replacement before retiring its SVG baseline;
- optional printable/PDF exports derived from approved raster worksheet masters after layout/accessibility review;
- human technical and accessibility review before any draft-to-release status change;
- any additional performance-validation artifacts identified by the Technician I credential/practical audit.

All four Course 2 lessons have dedicated visual support, and the planned observation, morphology, diagnostic-boundary, photo-evidence, room-map and handoff practice layers now have learner-facing assets. Course 2 remains draft-gated pending human review and required performance validation.
