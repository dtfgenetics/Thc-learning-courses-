# Public Authoritative Source Review Packets

The certification curriculum already separates course content from the 420-topic encyclopedia and requires references on every canonical lesson. This workflow makes those sources easier to review and refresh without silently changing published course content.

## Current public-source refresh

The repository now includes newly verified public references for:

- EPA Worker Protection Standard access to pesticide-labeling information;
- EPA Worker Protection Standard Application Exclusion Zone guidance;
- NIOSH prevention of work-related asthma using the hierarchy of controls;
- CDC/NIOSH investigation of fatal occupational asthma in cannabis production.

Existing NIOSH, EPA, OSHA PPE, and OSHA Hazard Communication records used by Technician I Course 1 also carry fresh verification metadata.

These sources support durable safety and worker-protection principles. They do not replace actual pesticide labels, employer procedures, state-plan requirements, site hazard assessments, medical evaluation, or role authorization.

## Exact-version supplemental mappings

`registry/public-authoritative-source-supplements.json` records reviewed source-to-lesson mappings for current lesson versions where a public source can strengthen technical review without rewriting the lesson.

The exact-version mappings now cover 15 high-value lessons across Technician I Courses 1, 4, 5, and 6:

- PPE, chemical labels, WPS entry/exclusion boundaries, and workplace respiratory exposure;
- irrigation-water quality, pH, EC, and root-zone/media interpretation;
- propagation media, greenhouse disease-risk pathways, scouting, sanitation, and IPM biosecurity;
- postharvest drying/storage risk context;
- the integrated Technician I workflow case.

The extension sources are used to strengthen general protected-crop practice. Crop-specific numeric thresholds, pesticide decisions, disinfectant choices, and finished-product specifications remain controlled by validated cannabis/facility evidence rather than copied from unrelated crops.

A supplemental mapping is **review support**, not lesson approval. If a reviewer decides the published lesson text should change, the lesson version must advance and exact-version scientific/editorial review must reopen.

## Generate source review packets

- `npm run certification:sources:review`
- `npm run certification:sources:review:json`
- `npm run certification:sources:review:write`
- `npm run certification:sources:review:check`
- `npm run certification:sources:review:test`

The generator traverses the 15 canonical Technician courses and their 284 lessons, resolves direct lesson references, merges exact-version supplemental review sources, and reports:

- direct reference counts;
- direct authoritative-source coverage;
- supplemental authoritative sources;
- unique source inventory;
- source verification timestamps;
- unresolved reference IDs or stale supplement mappings.

The check fails on missing course/module/lesson objects, unresolved source IDs, or supplemental mappings whose pinned lesson version is stale.

## Maintenance rule

Public web sources can change after a course is published. Source verification metadata should therefore be refreshed periodically, while lesson text changes remain versioned. This avoids two opposite errors: treating an old URL as permanently verified, or changing approved instructional content merely because a source page received a non-substantive web update.
