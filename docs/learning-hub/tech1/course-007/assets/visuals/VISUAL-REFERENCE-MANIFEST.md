# Course 7 Integrated Visual Reference Manifest

**Course:** `COURSE-LH-TECH1-007 — Integrated Cultivation Technician Practice Lab`  
**Profile:** integrated performance / capstone  
**Status:** controlled development plan  
**Date:** 2026-09-16

## Purpose

Course 7 integrates previously taught Technician I work rather than introducing a separate visual vocabulary. Its primary learner visuals and printable practice surfaces therefore reuse governed assets from Courses 2–6 where the same task, evidence type, or operational boundary is being assessed.

This reuse is intentional. Course 7 must not create duplicate diagrams with different wording, thresholds, authority boundaries, or identifiers merely to increase asset count.

## Canonical visual sources

| Integrated lab area | Canonical source registry | Use in Course 7 |
|---|---|---|
| crop observation, plant context, records | `visuals/COURSE2-ASSET-REGISTRY.json` | room/crop observation and record evidence |
| environment, light, sensors | `visuals/COURSE3-ASSET-REGISTRY.json` | measurement context and sensor verification |
| water, root zone, nutrition, irrigation | `visuals/COURSE4-ASSET-REGISTRY.json` | pH/EC context, delivery verification, root-zone evidence |
| propagation, canopy, IPM | `visuals/COURSE5-ASSET-REGISTRY.json` | scouting, biosecurity, propagation/canopy work-order evidence |
| harvest, postharvest, traceability | `visuals/COURSE6-ASSET-REGISTRY.json` | harvest readiness, genealogy, reconciliation and handoff |

## Course 7-specific surfaces

Course 7 adds integration through its controlled documents rather than duplicating domain graphics:

- `INTEGRATED-LAB-LEARNER-PACKET.md` — station sequence and evidence package;
- `OBJECTIVE-PERFORMANCE-CROSSWALK.md` — objective-to-performance mapping;
- `REMEDIATION-RETEST-MATRIX.md` — domain remediation and equivalent-form retest controls;
- `assessor/CAPSTONE-ASSESSOR-GUIDE.md` — scoring/evidence controls;
- `accessibility/COURSE7-INTEGRATED-LAB-ACCESSIBILITY-UX-REVIEW.md` — integrated accessibility/accommodation review packet.

## Reuse rules

1. Reuse only assets whose registry status is `produced` and whose canonical repository source still exists.
2. Preserve the original asset ID, source registry, title/description, reference boundaries and learner path.
3. Do not copy an asset into a new Course 7 file merely to rename it.
4. Do not change numeric thresholds, diagnostic meaning, authority boundaries or legal claims in a reused asset.
5. A station packet must identify the asset/source course when the same visual could otherwise be ambiguous.
6. Practice/readiness forms may expose teaching visuals and feedback; secure credential forms must follow the separate form-security rules in `registry/technician-i-integrated-lab-plan.json`.
7. Accessibility requirements from the source asset remain in force: meaningful visuals require text alternatives and must not rely on color alone.

## New-asset trigger

A new Course 7 asset should be created only when the integrated task requires a genuinely new cross-domain representation that cannot be expressed accurately by combining existing governed surfaces. Any new asset must receive a unique governed ID, source references, accessibility metadata, placement mapping and review status before learner use.

## Credential boundary

This manifest controls visual reuse for development and learner practice. It does not authorize secure credential-form exposure, validate an assessment form, or imply professional credential release approval.
