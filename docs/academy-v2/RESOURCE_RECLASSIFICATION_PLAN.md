# 420 Comprehensive Educational Resources — Reclassification Plan

## Goal

Convert the existing 420-item THC Learning Academy catalog from a course-oriented naming model into a **Comprehensive Educational Resource** model without destroying stable IDs, historical references, review records, or cross-links.

## Controlled terminology

- **Legacy course ID:** existing `THC-C###` identifier used by the original 420-item catalog.
- **Comprehensive Educational Resource:** the new object type for those 420 items.
- **Certification Course:** a separate Learning Hub object designed specifically for one or more professional credential pathways.

The 420-item catalog must no longer be described as 420 courses.

## Migration rules

1. Preserve each legacy `THC-C###` identifier as a permanent alias during migration.
2. Do not renumber the 420 catalog solely to reflect the terminology change.
3. Add a resource object/metadata layer that distinguishes resource type, domain, title, evidence status, format, accessibility status, review status, and certification mappings.
4. Existing manuscripts may be reused as resource content after science/instructional review.
5. Remove certification-bearing implications from 420-resource metadata unless an item is separately incorporated into a Learning Hub certification course.
6. Certification courses receive independent `COURSE-LH-*` IDs and their own objectives, lesson structure, assessments, practicals, and release gates.
7. Resource-to-course reuse occurs by mapping/reference rather than uncontrolled copy/paste.
8. Preserve redirects and historical crosswalks so existing links continue to resolve.

## Resource-type taxonomy

A Comprehensive Educational Resource may be one or more of:

- scientific explainer
- illustrated guide
- reference article
- diagnostic atlas
- visual identification guide
- interactive calculator
- decision tree
- data exercise
- case study
- troubleshooting flow
- reference chart
- glossary/reference entry
- SOP reference
- research summary
- comparison tool
- virtual experiment
- downloadable worksheet
- dataset
- infographic/visual reference

The format should follow the instructional purpose. There is no requirement that all 420 resources have identical length, assessment, image count, or document structure.

## Required metadata for each resource

Planned fields:

- stable resource ID
- legacy alias (`THC-C###`)
- title
- 20-domain catalog placement
- resource type(s)
- audience level
- purpose/scope
- evidence status
- evidence/claim references
- last science review date
- accessibility status
- visual/interactive assets
- related resources
- certification-course mappings
- competency mappings
- release status
- version

## Existing 20-domain organization

Retain the current 20-domain × 21-resource structure as the initial controlled catalog because it provides complete coverage and stable ordering. Reorganization may occur later through metadata, tags, pathways, and cross-links without breaking the canonical 420-item identity map.

The current domain sequence remains:

1. Plant Science Foundations
2. Responsible Practice and Safety
3. Measurement, Data, and Records
4. Grow Systems Foundations
5. Seed and Propagation Practice
6. Root Zone, Media, and Nutrition
7. Environment, Lighting, and Irrigation
8. Canopy, Flowering, and Crop Cycle
9. Scouting and Diagnostic Reasoning
10. Integrated Pest Management
11. Plant Disease and Biosecurity
12. Corrective Action and Crop Recovery
13. Controlled-Environment Engineering
14. Advanced Fertigation and Crop Steering
15. Advanced Methods and Automation
16. Harvest, Postharvest, and Quality
17. Genetics, Selection, and Breeding
18. Seed Preservation and Tissue Culture
19. Research, Trials, and Evidence
20. SOPs, QA, Teaching, and Leadership

## Resource review priority

### Priority 1 — foundation and cross-cutting resources

Audit resources used by many certification pathways first:

- safety
- measurement
- environmental fundamentals
- pH/EC/water
- root-zone science
- plant nutrition
- IPM/biosecurity
- propagation
- traceability/records
- harvest/postharvest
- genetics fundamentals
- SOP/QA fundamentals

### Priority 2 — credential-specific high-value resources

Audit the resources that directly support the eight professional credential course maps.

### Priority 3 — advanced/deep-reference resources

Audit advanced engineering, automation, research, tissue culture, breeding, and other specialist reference material after the core credential-supporting evidence base is stable.

## First reference resource

The legacy item `THC-C001 — Cannabis as a Plant: Origins, Uses, and Study` becomes the first reference implementation under the resource model.

It should be re-audited for:

- resource purpose rather than course-completion framing;
- scientific accuracy and source verification;
- claim-level evidence mapping;
- removal of unnecessary course-only structures;
- appropriate interactive/visual resource opportunities;
- accessibility;
- related-resource links;
- certification-course mappings where relevant;
- version/release status.

Its existing manuscript, questions, worksheets, and instructor content should not be discarded. Components that no longer belong in the resource itself may be preserved as source material or reassigned to certification courses when pedagogically appropriate.

## Migration phases

### Phase 1 — architecture lock

- approve system architecture;
- approve eight professional credential catalog;
- approve controlled terminology;
- freeze creation of new 420 "course" labels.

### Phase 2 — metadata/schema

- define Comprehensive Educational Resource schema;
- create resource registry/crosswalk;
- map legacy `THC-C###` IDs to resource identities;
- add resource type and evidence metadata.

### Phase 3 — first resource conversion

- convert/audit THC-C001;
- validate rendering/search/navigation/cross-link behavior;
- use it as the production reference.

### Phase 4 — high-value migration

- convert resources supporting Technician I and common prerequisites;
- then Technician II;
- then specialist credentials;
- preserve the broader Academy build in parallel.

### Phase 5 — full catalog completion

- complete all 420 resource audits;
- verify domain coverage;
- verify resource-to-resource links;
- verify certification mappings;
- verify accessibility and evidence freshness.

## Definition of migrated

A legacy 420 item is considered successfully migrated only when:

- its stable identity is preserved;
- it is typed as a Comprehensive Educational Resource;
- course/certification terminology is corrected;
- science/evidence status is known;
- the resource has a valid release status;
- accessibility status is recorded;
- related-resource and credential mappings resolve;
- no certification is implied solely by completing or viewing the resource;
- automated repository checks pass.
