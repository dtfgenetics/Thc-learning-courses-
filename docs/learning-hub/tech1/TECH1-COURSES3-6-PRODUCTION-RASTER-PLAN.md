# Technician I Courses 3–6 Production Raster Replacement Plan

Updated: 2026-09-22

## Release objective

Replace the 30 learner-facing SVG compatibility baselines in Technician I Courses 3–6 with production-quality raster instructional assets. Deterministic SVG-to-WebP renders are compatibility candidates only and MUST NOT be treated as final production artwork.

## Global production contract

- Final instructional formats: PNG, WebP, or JPEG only. No learner-facing SVG release target.
- Minimum short side: 1600 px; master artwork should be produced larger when practical.
- Embedded teaching images must communicate the lesson concept without relying on decorative cannabis imagery.
- Photorealistic/documentary assets should show believable cultivation environments, tools, plant material, measurement practice, sanitation, scouting, harvest, or postharvest handling as applicable.
- Charts and workflow graphics must be purpose-built raster compositions with controlled typography, readable labels, legends, units, and source-aware captions.
- Printable practice assets must prioritize legibility, whitespace, completion fields, and print usability over decorative styling.
- Text accuracy, factual accuracy, accessibility text, responsive rendering, download metadata, and public-path integrity are release gates.
- Do not universalize study-specific VPD, PPFD, pH, EC, nutrient, irrigation, propagation, or postharvest values.
- Existing SVG files may remain only as compatibility/provenance baselines until the replacement passes release QA.

## Course 3 — Environment, Lighting & Monitoring

| Asset | Concept | Production mode |
|---|---|---|
| VIS-LH-TECH1-003-001 | Temperature, RH and VPD measurement context | educational composite: photoreal grow-room measurement scene + branded explanatory overlays |
| VIS-LH-TECH1-003-002 | PPFD grid measurement | photoreal meter/canopy scene + raster measurement-grid diagram |
| VIS-LH-TECH1-003-003 | Sensor representativeness and triage | educational composite showing correct/poor sensor placement and verification workflow |
| VIS-LH-TECH1-003-004 | Alarm, trend and handoff workflow | branded raster workflow/chart |
| VIS-LH-TECH1-003-005 | Environment measurement practice | printable raster practice sheet |
| VIS-LH-TECH1-003-006 | PPFD/sensor verification practice | printable raster practice sheet |

## Course 4 — Water, Root Zone & Nutrition Measurements

| Asset | Concept | Production mode |
|---|---|---|
| VIS-LH-TECH1-004-001 | Sample identity, pH and EC measurement context | photoreal measurement workstation + labeled educational overlays |
| VIS-LH-TECH1-004-002 | Root-zone moisture, drainage and dryback trend | branded raster chart with substrate/root-zone visual context |
| VIS-LH-TECH1-004-003 | Nutrition-context differential | educational diagnostic comparison composite; avoid symptom-as-diagnosis claims |
| VIS-LH-TECH1-004-004 | Irrigation work-order delivery | photoreal irrigation-system context + workflow overlay |
| VIS-LH-TECH1-004-005 | Irrigation fault handoff | branded raster workflow |
| VIS-LH-TECH1-004-006 | Water/solution measurement practice | printable raster practice sheet |
| VIS-LH-TECH1-004-007 | Irrigation verification practice | printable raster practice sheet |

## Course 5 — Propagation, Canopy & IPM

| Asset | Concept | Production mode |
|---|---|---|
| VIS-LH-TECH1-005-001 | Propagation identity and traceability | photoreal propagation station + identity/traceability overlay |
| VIS-LH-TECH1-005-002 | Canopy work-order scope and stop boundary | photoreal canopy/work scene + decision overlay |
| VIS-LH-TECH1-005-003 | IPM scouting route patterns | photoreal crop-room context + branded raster scouting-route diagram |
| VIS-LH-TECH1-005-004 | Sign versus symptom evidence | photoreal macro comparison board with conservative labels |
| VIS-LH-TECH1-005-005 | Biosecurity and quarantine flow | photoreal sanitation/quarantine context + raster flow diagram |
| VIS-LH-TECH1-005-006 | Integrated crop-care handoff | branded raster workflow with documentary crop-care context |
| VIS-LH-TECH1-005-007 | Propagation workstation practice | printable raster practice sheet |
| VIS-LH-TECH1-005-008 | IPM scouting practice | printable raster scouting sheet |
| VIS-LH-TECH1-005-009 | Canopy work-order practice | printable raster practice sheet |

## Course 6 — Harvest, Postharvest & Traceability

| Asset | Concept | Production mode |
|---|---|---|
| VIS-LH-TECH1-006-001 | Harvest readiness and stop-work decision | photoreal harvest-readiness scene + conservative decision overlay |
| VIS-LH-TECH1-006-002 | Harvest receiving flow | photoreal controlled harvest/receiving context + raster workflow |
| VIS-LH-TECH1-006-003 | Source-to-output genealogy | branded raster traceability diagram |
| VIS-LH-TECH1-006-004 | Reconciliation discrepancy | branded raster reconciliation/exception diagram |
| VIS-LH-TECH1-006-005 | Dry-room handoff | photoreal dry-room/handoff scene + controlled annotation |
| VIS-LH-TECH1-006-006 | Harvest readiness practice | printable raster practice sheet |
| VIS-LH-TECH1-006-007 | Traceability reconciliation practice | printable raster practice sheet |
| VIS-LH-TECH1-006-008 | Dry-room handoff practice | printable raster practice sheet |

## Release sequence

1. Produce the new raster master.
2. Run image-format, dimensions, corruption and duplicate checks.
3. Verify visible text and units against the lesson copy lock.
4. Perform factual/content review against the lesson evidence dossier.
5. Record accessibility text and manual responsive/print review.
6. Mark the individual asset release-approved.
7. Change the lesson and visual registry public path from SVG to the approved raster asset.
8. Run course visual-registry, raster-policy, curriculum, accessibility, download and staging tests.
9. Retain the prior SVG only as controlled provenance/compatibility material; do not expose it as the preferred learner asset.

## Current status

The 30 existing lossless WebP files are automated-QA compatibility renders from SVG baselines. They are not approved as final production replacements. This plan is the production specification for creating the higher-quality raster assets required before cutover.
