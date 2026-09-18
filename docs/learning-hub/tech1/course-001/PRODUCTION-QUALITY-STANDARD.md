# Course 1 Production Quality Standard

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`

## Why this exists

Course 1 already has substantial canonical instruction, assessments, practical work, references, and a functional learner runtime. The remaining production-quality problem is not a lack of material. It is that several parts of the delivery system historically used structural validity as a proxy for production quality.

A file can be technically valid and still be unsuitable for a learner. A visual can render, have a valid path, include alt text, and still be low resolution, text-heavy, factually wrong, duplicated, poorly branded, or unreadable on mobile. A lesson can contain sound content while the learner-facing presentation exposes internal IDs and development metadata that makes the material look unfinished.

This standard separates those conditions permanently.

## Current causes identified

1. **Technical delivery was stronger than the production gate.** Existing automated checks verify IDs, paths, formats, mappings and accessibility fields, but those checks alone do not establish visual or editorial quality.
2. **Low-resolution review graphics were being produced as if they were potential masters.** The authenticated v3 PNGs for Course 1 concepts 13–18 are only `384 × 512` pixels. That is review-image resolution, not production infographic resolution.
3. **Generated graphics contained copy drift.** The same v3 set includes wrong module labels, credential branding that does not match the public academic course boundary, and role/authorization wording that requires correction.
4. **The Drive production folder contained exact duplicate binaries.** Duplicate files with the same names and byte sizes existed beside the QA-referenced masters, weakening provenance and making it unclear which file was canonical.
5. **Generated image text was doing too much instructional work.** Baked-in generated copy is harder to verify, revise, translate and make accessible than canonical text rendered by the learner application.
6. **Learner UI exposed development metadata.** Figure captions displayed internal asset IDs, and evidence blocks exposed raw reference identifiers directly in the main reading flow.
7. **"Produced" could be mistaken for "production approved."** In the public asset registry, `produced` means a learner asset exists and is delivered. It does not mean a richer replacement candidate has passed final factual, visual, responsive and accessibility QA.

## Required quality states

Course material should be interpreted through these states:

- `draft` — incomplete source work;
- `review-candidate` — complete enough to inspect, but not learner-approved;
- `baseline-public` — safe, functional learner material currently used while a stronger replacement is prepared;
- `production-approved` — final learner-facing material that has passed the applicable factual, editorial, responsive, accessibility, provenance and delivery checks;
- `retired` — preserved for history but no longer active.

Technical existence is never equivalent to `production-approved`.

## Instructional-content standard

A published Course 1 lesson must continue to provide controlled learning objectives, references, a meaningful overview, multiple instructional block types and at least one applied learning mechanism such as a scenario, activity, comparison, table, steps model, document model or instructional visual.

Published learner material must not contain placeholder language such as `TODO`, `TBD`, `lorem ipsum`, fake download text, draft-only notes or unresolved internal production instructions.

The canonical lesson object—not generated image text—is the authority for instructional wording. Visuals support the lesson; they do not replace its controlled explanation.

## Visual-production standard

For a primary instructional raster replacement:

- use one primary instructional concept per learner asset;
- keep a single canonical Drive master per approved version;
- use the release manifest to identify the canonical source file ID;
- reconcile all visible instructional wording against the canonical lesson before release;
- do not treat AI-generated text inside an image as authoritative copy;
- add dense labels and factual copy from controlled source text during layout/compositing rather than relying on image-generation text;
- maintain meaningful external caption and learner text alternative;
- preserve Technician I role and authorization boundaries;
- mark facility-specific examples as examples and defer controlled actions to current SOPs, labels, SDSs, manufacturer instructions or authorized roles as applicable;
- provide a mobile-readable presentation; if an infographic requires tiny text to work, create a simplified mobile variant or move the detail into semantic HTML;
- verify the committed public path before retiring the existing baseline asset.

### Resolution floor

Primary Course 1 instructional PNG/JPEG/WebP replacements must have a shortest side of at least **1200 px**. This does not apply to small UI icons. It prevents review-size `384 × 512` graphics from being promoted as production instructional posters.

## Learner-interface standard

The learner-facing course should look like finished education material rather than a development console.

Therefore:

- internal asset IDs belong in DOM/data metadata, not the primary figure caption;
- raw evidence/reference IDs should live behind an expandable `Sources & evidence` control instead of interrupting the main lesson flow;
- instructional visuals should provide a clear full-size link;
- figures should remain contained in the reading layout rather than forcing oversized poster scrolling;
- captions should explain why the visual matters, not expose internal production bookkeeping.

## Drive master-control rule

The controlled Drive folder may retain alternates and rejected drafts, but duplicates and rejected binaries must be moved out of the active production-master surface into a quarantine/archive location. The release manifest must point to exactly one canonical source file ID for an approved version.

Drive presence alone never authorizes learner publication.

## Release rule

A new visual or replacement may not be represented as production-approved unless:

1. the canonical lesson and concept mapping are correct;
2. factual and copy QA are complete;
3. role/authorization boundaries are correct;
4. the asset is not a contact sheet, montage, multi-concept generation board or duplicate master;
5. a primary raster replacement meets the resolution floor;
6. caption and learner text alternative are present outside the image;
7. responsive/mobile review is complete;
8. public registry and lesson mappings resolve to the committed asset;
9. the public path has been verified;
10. the release manifest explicitly marks the candidate `public-approved` and `releaseApproved: true`.

## Current Course 1 interpretation

The existing learner-facing SVG set is the safe public baseline. It should remain available until superior replacements pass this standard. The rejected/review PNGs are source material only and must not be substituted merely because they appear visually richer.

This is intentionally a quality gate, not a content ceiling. Lessons, tests, visuals, references, practice, scenarios and assets remain fully editable and extensible.
