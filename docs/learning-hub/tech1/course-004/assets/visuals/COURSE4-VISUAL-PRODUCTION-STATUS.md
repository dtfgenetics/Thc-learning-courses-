# Course 4 Visual & Practice Asset Production Status

**Course:** `COURSE-LH-TECH1-004 — Water, Root Zone, Nutrition & Irrigation Fundamentals`

## Canonical learner delivery

Course 4 learner assets are WebP files published from:

`apps/web/public/assets/course4/`

The repository/public web asset is the learner-delivery source of truth. Google Drive is a controlled production/reference mirror.

## Controlled Drive mirror

Folder: **Course 4 — Water, Root Zone & Irrigation Learning Boards**

- folder ID: `13su1HkrSjWqhMtssQos3cju9BkgeqGBv`
- folder URL: `https://drive.google.com/drive/folders/13su1HkrSjWqhMtssQos3cju9BkgeqGBv`

All eight produced Course 4 learner assets are recorded in `visuals/COURSE4-ASSET-REGISTRY.json`; converted assets retain legacy SVG/Drive provenance and the native pH science asset records its WebP and PNG-master Drive mirrors.

## Embedded teaching visuals

1. `VIS-LH-TECH1-004-001` — sample identity, pH and EC measurement context — Lesson 1
2. `VIS-LH-TECH1-004-002` — root-zone moisture, drainage and dryback trend — Lesson 2
3. `VIS-LH-TECH1-004-003` — nutrition-context differential without unsupported diagnosis — Lessons 2 and 4
4. `VIS-LH-TECH1-004-004` — irrigation work order and representative delivery verification — Lesson 3
5. `VIS-LH-TECH1-004-005` — irrigation fault, verification and shift-handoff workflow — Lesson 4

## Downloadable practice assets

6. `VIS-LH-TECH1-004-006` — water and nutrient-solution measurement practice worksheet — Lessons 1 and 4
7. `VIS-LH-TECH1-004-007` — irrigation delivery and root-zone verification practice worksheet — Lessons 2, 3 and 4

## Delivery contract

`scripts/test-course4-visual-registry.mjs` validates that the current Course 4 learner layer contains at least eight produced assets, at least six embedded teaching visuals and at least two downloadable practice assets. It also requires:

- a unique Course 4 asset ID and public learner path;
- a source file under the public Course 4 asset directory;
- production WebP integrity plus SVG accessibility metadata for converted assets and PNG/WebP/Drive provenance for native-raster assets;
- a canonical raw GitHub download URL;
- Drive mirror file ID and URL metadata;
- lesson reachability for every produced asset;
- at least one embedded teaching visual in every Course 4 lesson;
- meaningful alt text/captions for embedded images and descriptions/labels for downloads.

The contract runs through `scripts/test-tech1-course4.mjs` alongside the Practical B crosswalk contract.

## Source and scope controls

- sample identity and sampling method remain attached to pH/EC interpretation;
- EC is treated as overall ionic conductivity, not a nutrient-specific assay;
- root-zone values from unlike sampling methods are not presented as interchangeable;
- dryback is presented as a repeated trajectory rather than a universal elapsed-time target;
- plant symptoms are treated as observations requiring developmental, pH/EC, root-zone, irrigation and environmental context;
- controller completion is kept separate from verified crop delivery;
- operator-level verification is kept separate from unauthorized recipe changes, advanced crop steering, treatment selection or equipment repair;
- public/peer-reviewed sources support concepts; original diagrams do not copy source figures.

## Remaining gates

The learner asset package is complete for the current design and Course 4 is published for owner-approved academic use. Human technical review, assessment review, rendered accessibility review, Practical B validation, pilot evidence, evaluator calibration/inter-rater evidence, standard setting and final program release approval remain unresolved.
