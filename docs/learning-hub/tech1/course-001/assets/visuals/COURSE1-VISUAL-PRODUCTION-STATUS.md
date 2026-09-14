# Course 1 Visual Production Status

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`

Full-resolution PNG production masters and review drafts are stored in Google Drive under:

`THC Education System / 06 Visual Education / 12 Source Photos & Reference Images / Course 1 — Visual Learning Boards`

Folder ID: `1cRDJn8stRWOKkcmsbjD12qjvt5g031oN`

## Current produced drafts

The primary Course 1 visual-production set `VIS-LH-TECH1-001-01` through `VIS-LH-TECH1-001-18` has at least one produced PNG draft in controlled Drive storage. Duplicate review drafts exist for hazard scan, hierarchy of controls, PPE and SDS anatomy.

## QA gate

Detailed QA findings are controlled in:

`docs/learning-hub/tech1/course-001/assets/visuals/COURSE1-VISUAL-QA-GATE.md`

No PNG production draft should replace an existing learner-facing SVG solely because it is visually richer. The existing public SVG remains the baseline until the replacement passes factual, copy, authorization-boundary, accessibility and responsive QA.

### Blocked from learner publication

The first content QA pass identified three material conflicts that require rebuild before public use:

1. `VIS-LH-TECH1-001-06-CLEAN-DIRTY-FLOW` — current draft presents clean-to-dirty / no-backtracking as a universal rule; canonical Lesson 2.1 requires the facility's actual zone map, current risk status and controlled transition procedure.
2. `VIS-LH-TECH1-001-07-SANITATION-SEQUENCE` — current draft compresses sanitation into a universal rinse/dry sequence; canonical Lesson 2.2 requires exact approved product/preparation, label/SOP-defined contact conditions, finish steps only where required, inspection, recontamination protection and truthful documentation.
3. `VIS-LH-TECH1-001-12-RECONCILIATION` — current draft uses language that can imply discrepancies should be 'fixed' or forced to balance; canonical Course 1 requires preservation of the discrepancy, evidence verification, factual documentation and escalation without inventing a balancing transaction.

### Preferred duplicate review candidates

- `01-HAZARD-SCAN`: `v2`
- `02-HIERARCHY-CONTROLS`: `v2` after authorization-language correction
- `03-PPE-TASK`: `v2` after replacing universal task-PPE claims with the canonical task + hazard assessment + label/SDS + site-procedure decision model
- `04-SDS-ANATOMY`: `v3` after clearly marking fictional/example data and reconciling all text to canonical instruction

Alternate versions remain controlled Drive references and are not public candidates unless they resolve a documented QA problem better than the preferred review candidate.

## Live/public mapping

The learner-facing repository currently serves canonical Course 1 SVG assets from `apps/web/public/assets/course1/`. Approved PNG replacements should be published under that same public asset directory, registered in `visuals/ASSET-REGISTRY.json`, and referenced by the canonical lesson JSON only after QA passes.

## Current work order

1. Rebuild the three blocked assets (`06`, `07`, `12`) using canonical lesson language.
2. Correct preferred duplicate candidates (`01`–`04`) and mark alternates as non-public references.
3. QA `05`, `08`–`11`, `13`–`18` against canonical lesson text and source boundaries.
4. Write final captions and learner text alternatives outside the image.
5. Publish only approved assets to `apps/web/public/assets/course1/`.
6. Update `visuals/ASSET-REGISTRY.json` with public path, lesson, objective, references, version and accessibility metadata.
7. Update canonical lesson JSON image blocks.
8. Verify public raw URLs, no broken paths, mobile readability and responsive rendering.

Generated-image text is not authoritative instructional copy. Before learner publication, every graphic must be reconciled against canonical lesson text, authoritative sources, Course 1 authorization boundaries and WCAG-oriented text alternatives.
