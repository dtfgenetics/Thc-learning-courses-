# Legacy 420 Catalog Reconciliation

## Decision

The 420-item catalog is a comprehensive educational resource library. It is not a list of 420 certification courses.

Certification courses remain purpose-built Learning Hub packages derived from occupations, job roles, tasks, competencies, learning objectives, instruction, practice and assessment. Resources from the 420-item library may be assigned to those courses, but a resource does not become credential-bearing merely because it contains lessons or a quiz.

## Existing source placement

| Material | Canonical placement | Treatment |
|---|---|---|
| Plant-science explainers and encyclopedia pages | `content/encyclopedia` and the THC public encyclopedia repository | Reuse or upgrade |
| Occupational courses | `content/courses`, `content/modules`, `content/lessons` | Keep as certification curriculum |
| Course questions and finals | `content/questions` and `content/assessments` | Keep separate from credential forms |
| Practicals and capstones | `docs/academy-v2` plus machine-readable assessment objects | Preserve performance evidence |
| Credential eligibility and issuance | `content/credentials`, runtime packages, API and database | Keep fail-closed |
| Visuals | `visuals` and learner runtime assets | Link to objectives and source records |
| Legacy document packages | Controlled archive | Inventory, deduplicate and map before reuse |

## Reconciliation rules

1. Search existing encyclopedia, lesson, claim and reference objects before creating content.
2. Convert a legacy THC-C topic into a resource object unless an occupational analysis independently requires a course.
3. Never count a resource quiz as a secure credential assessment.
4. Keep original IDs in an archival crosswalk; do not replace current course IDs with legacy IDs.
5. Mark source, evidence, review, visual and accessibility status independently.
6. Publish only through the current repository pipelines and preserve truthful readiness labels.

## Reconciled production slices

Legacy topic `THC-C002 Cannabis Taxonomy and Classification` is represented as `ENC-CANNABIS-TAXONOMY-016`. The resource reuses existing plant-biology, genetics, breeding-identity and Technician I observation lessons instead of creating a duplicate credential course.

Content-level reconciliation is complete for the non-capstone resources in the first five catalog domains:

- `THC-A01 Plant Science Foundations`: 20 confirmed mappings; capstone `THC-C021` unresolved.
- `THC-A02 Responsible Practice and Safety`: 21 confirmed mappings.
- `THC-A03 Measurement, Data and Records`: 19 confirmed mappings; `THC-C044` and capstone `THC-C063` unresolved.
- `THC-A04 Grow Systems Foundations`: 20 confirmed mappings; capstone `THC-C084` unresolved.
- `THC-A05 Seed and Propagation Practice`: 20 confirmed mappings; capstone `THC-C105` unresolved.
- `THC-A06 Root Zone, Media and Nutrition`: 20 confirmed mappings; capstone `THC-C126` unresolved.

The current registry totals are 3 confirmed reuse records, 119 confirmed upgrade records, 298 records awaiting content review and 252 records without a candidate target. A `create` decision remains prohibited until content review confirms that neither repository contains suitable canonical material.

## Machine-readable inventory

`registry/legacy-420-resource-reconciliation.json` preserves all 420 legacy records and records exact or candidate matches against the current `dtfgenetics/Thc` encyclopedia. Exact normalized-title matches may be marked `reuse`. Similarity matches remain candidates, and records without a candidate remain in manual review. Neither state authorizes new content by itself.

`npm run registry:validate` verifies the global curriculum registry and this reconciliation registry together. It rejects missing or duplicate legacy IDs, reordered ranges, inconsistent summary counts, non-exact confirmed matches and malformed resource links. When the `dtfgenetics/Thc` repository is checked out beside this repository, validation also resolves cross-repository files (including multi-lesson draft bundles) and verifies target IDs and titles.

## Remaining work

The remaining records must be classified topic by topic as reuse, upgrade or create through content-level review and cross-linked to the public encyclopedia and current Learning Hub curriculum. Human science, editorial, assessment and accessibility review remain separate release gates.
