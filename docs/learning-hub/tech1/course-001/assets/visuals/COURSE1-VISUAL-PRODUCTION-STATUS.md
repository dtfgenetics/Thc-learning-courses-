# Course 1 Visual Production Status

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`

Full-resolution PNG production masters and review drafts are stored in Google Drive under:

`THC Education System / 06 Visual Education / 12 Source Photos & Reference Images / Course 1 — Visual Learning Boards`

Folder ID: `1cRDJn8stRWOKkcmsbjD12qjvt5g031oN`

## Current produced drafts

The primary Course 1 visual-production set `VIS-LH-TECH1-001-01` through `VIS-LH-TECH1-001-18` has at least one produced PNG draft in controlled Drive storage. Duplicate review drafts exist for hazard scan, hierarchy of controls, PPE and SDS anatomy.

## Corrected blocker rebuild

The three material instructional blockers identified during the first QA pass have been rebuilt as corrected review candidates in:

`course1-visual-blocker-rebuild-board-v1.png`

Drive file ID: `1qzh2JHuHuIemiKktd-tLWw8XhWqpL4Lt`

Coverage:

- `06-CLEAN-DIRTY-FLOW` — now frames directional movement as facility/SOP-controlled rather than universal.
- `07-SANITATION-SEQUENCE` — now includes preparation, cleaning, approved product use, controlled contact conditions, finish-as-applicable, inspection and documentation.
- `12-RECONCILIATION` — now preserves discrepancy investigation and resolve-as-authorized behavior rather than forcing a balance.

These rebuilds remove the original concept-level blockers but are still review candidates, not public replacements. Final copy, accessibility, responsive and source-alignment QA remain required.

## QA gate

Detailed QA findings are controlled in:

`docs/learning-hub/tech1/course-001/assets/visuals/COURSE1-VISUAL-QA-GATE.md`

No PNG production draft should replace an existing learner-facing SVG solely because it is visually richer. The existing public SVG remains the baseline until the replacement passes factual, copy, authorization-boundary, accessibility and responsive QA.

## Preferred duplicate review candidates

- `01-HAZARD-SCAN`: `v2`
- `02-HIERARCHY-CONTROLS`: `v2` after authorization-language correction
- `03-PPE-TASK`: `v2` after replacing universal task-PPE claims with the canonical task + hazard assessment + label/SDS + site-procedure decision model
- `04-SDS-ANATOMY`: `v3` after clearly marking fictional/example data and reconciling all text to canonical instruction
- `06`, `07`, `12`: use the corrected blocker-rebuild board as the current reference starting point

Alternate versions remain controlled Drive references and are not public candidates unless they resolve a documented QA problem better than the preferred review candidate.

## Live/public mapping

The learner-facing Course 1 lesson set now serves approved raster production assets (PNG) from `apps/web/public/assets/course1/`. Retired SVG files remain provenance/compatibility records only and must not be reintroduced by lesson JSON or shared renderer overrides. New raster replacements must remain registered in `visuals/ASSET-REGISTRY.json`, mapped to canonical lessons, and protected by the raster-policy regression tests.

## Current work order

1. Correct preferred duplicate candidates (`01`–`04`).
2. QA `05`, `08`–`11`, `13`–`18` against canonical lesson text and source boundaries.
3. Write final captions and learner text alternatives outside the image.
4. Create mobile-friendly alternatives where poster density is too high for responsive use.
5. Publish only approved assets to `apps/web/public/assets/course1/`.
6. Update `visuals/ASSET-REGISTRY.json` with public path, lesson, objective, references, version and accessibility metadata.
7. Update canonical lesson JSON image blocks.
8. Verify public raw URLs, no broken paths, mobile readability and responsive rendering.

Generated-image text is not authoritative instructional copy. Before learner publication, every graphic must be reconciled against canonical lesson text, authoritative sources, Course 1 authorization boundaries and WCAG-oriented text alternatives.
