# Course 1 Visual QA Gate

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`

This gate separates production drafts from learner-facing assets. A visually polished image is not approved for publication until its wording, examples, lesson numbering, authorization boundaries, facility-specific claims, source alignment, accessibility text, and responsive use have been checked against the canonical lesson object.

## QA status legend

- `preferred-review-candidate` — preferred draft for correction/QA; not yet public.
- `revise-before-publication` — concept is useful but wording or scope must be corrected before learner use.
- `blocked` — contains a material instructional conflict with the canonical lesson and must not replace the current public asset.
- `pending-review` — not yet through detailed factual/copy review.

## Current findings

| Asset | Lesson | Status | QA finding / required correction |
|---|---|---|---|
| `01-HAZARD-SCAN` | 1.1 | preferred-review-candidate | Keep hazard-recognition purpose. Remove any wording that turns generic examples into universal facility rules. Preserve Technician I stop/isolate/escalate boundaries. |
| `02-HIERARCHY-CONTROLS` | 1.1 | revise-before-publication | Keep elimination → substitution → engineering → administrative → PPE framework. Cannabis examples must not imply a worker can independently substitute products, biological controls, equipment or engineering controls outside authorization. |
| `03-PPE-TASK` | 1.2 | revise-before-publication | Do not publish a universal PPE-by-task matrix. Canonical lesson requires task hazard assessment, product label/SDS, site procedure and restrictions to control PPE selection. Respirator use must not imply clearance, fit testing or authorization is automatic. |
| `04-SDS-ANATOMY` | 1.2 | preferred-review-candidate | Use only as a training example after copy reconciliation. Fictional product/company data must be clearly labeled fictional. Do not imply the example SDS replaces the actual product SDS or facility HazCom program. |
| `05-CONTAMINATION-ROUTES` | 2.1 | revise-before-publication | Preserve source → route → receiving-area reasoning. Remove absolute clean/dirty claims and any universal zone hierarchy. Zone names and transition rules are facility-specific. |
| `06-CLEAN-DIRTY-FLOW` | 2.1 | blocked | Draft says to always move clean → dirty and never backtrack. Canonical Lesson 2.1 explicitly warns against a universal clean-to-dirty rule and requires use of the facility's actual zone map, current risk status and transition procedure. Rebuild before public use. |
| `07-SANITATION-SEQUENCE` | 2.2 | blocked | Draft uses a simplified universal rinse/dry sequence. Canonical sanitation lesson requires exact product identity/preparation, label/SOP-defined contact conditions, finish steps only where required, inspection, protection from recontamination and documentation. Rebuild to match the nine decision points. |
| `08-AUTHORITY-ESCALATION` | 3.2 | revise-before-publication | Generic escalation roles can be shown only as examples. The worker must follow the facility's actual escalation chain and role authority. Do not imply every facility uses the same supervisor/manager/compliance ladder. |
| `09-CONTROLLED-DOCUMENT` | 3.1 | preferred-review-candidate | Structure is useful. Example document identifiers/dates/approval fields must remain clearly illustrative. Emphasize current controlled version and official source rather than a universal SOP format. |
| `10-GENEALOGY` | 4.1 | revise-before-publication | Keep identity continuity concept. Remove universal claims such as 'required for compliance' unless the statement is tied to a specific jurisdiction or controlling program. Example strain/batch data must be labeled illustrative. |
| `11-MOVEMENT-RECORD` | 4.2 | revise-before-publication | Keep reconstructable movement fields. Do not imply one universal movement form or data set applies everywhere. Compliance claims must be jurisdiction/program-specific. |
| `12-RECONCILIATION` | 4.3 | blocked | Draft language such as 'find and fix discrepancies' can encourage forced balancing. Canonical course requires preserving the discrepancy, verifying evidence, documenting confirmed facts and escalating without inventing a balancing transaction. Rebuild. |
| `13-EQUIPMENT-PREUSE` | 5.1 | revise-before-publication | Keep pre-use/readiness concept. Checklist items must be presented as examples controlled by manufacturer instructions, site SOP and worker authorization; not every Technician I performs every listed equipment check. |
| `14-OPERATOR-VS-MAINTENANCE` | 5.2 | revise-before-publication | Clarify operator care versus servicing boundary. Avoid implying that adjusting settings, calibrating systems, electrical/plumbing/HVAC work or internal troubleshooting is permitted unless specifically trained and authorized. |
| `15-FAULT-REPORT` | 5.3 | preferred-review-candidate | Preserve observation → permitted checks → operational impact → escalation. Avoid unsupported root-cause diagnosis. Fault records should distinguish observed facts from assumptions. |
| `16-RECORD-CORRECTION` | 6.1 | revise-before-publication | Keep original/audit-trail principle, but do not state one paper-record correction method as universal. Correction method must follow the approved record system, SOP and applicable requirements. |
| `17-SHIFT-HANDOFF` | 6.2 | preferred-review-candidate | Structure is useful if framed as a model. Exact fields and sign-off rules remain facility-specific. Include open conditions, ownership and unresolved risk rather than only routine status. |
| `18-INTEGRATED-WORKFLOW` | 6.3 | revise-before-publication | Keep cross-domain synthesis. Remove tasks outside the Technician I role or frame them as system context rather than worker authority. Integrated workflow must reinforce safety, SOP, biosecurity, traceability, equipment boundaries and truthful records. |

## Immediate rebuild priority

The following drafts are blocked from learner publication and should be corrected first:

1. `VIS-LH-TECH1-001-06-CLEAN-DIRTY-FLOW`
2. `VIS-LH-TECH1-001-07-SANITATION-SEQUENCE`
3. `VIS-LH-TECH1-001-12-RECONCILIATION`

## Preferred duplicate review candidates

Where multiple drafts exist, use these as the current review starting points rather than publishing every variant:

- `01-HAZARD-SCAN`: review `v2` first.
- `02-HIERARCHY-CONTROLS`: review `v2` first, but revise authorization wording.
- `03-PPE-TASK`: review `v2` first, but rebuild task-specific PPE claims around the canonical decision model.
- `04-SDS-ANATOMY`: review `v3` first, with fictional-example labeling and source/copy reconciliation.

Alternates remain in Drive for comparison but are not public candidates unless they solve a documented QA issue better than the preferred version.

## Public release gate for every visual

A learner-facing visual may move to `apps/web/public/assets/course1/` only after all of the following are true:

1. canonical lesson title and lesson number are correct;
2. all factual claims match the lesson and cited authoritative sources;
3. facility-specific procedures are labeled as examples or controlled by the site SOP;
4. Technician I authority boundaries are preserved;
5. no generated QR code, phone number, supplier, legal requirement, product label, chemical concentration or emergency instruction is presented as real unless verified and intentionally sourced;
6. caption and meaningful learner text alternative are written outside the image;
7. mobile presentation remains readable without forcing the learner to decode tiny poster text;
8. asset ID, version, linked lesson, objective and references are registered in `visuals/ASSET-REGISTRY.json`;
9. canonical lesson JSON points to the approved public asset;
10. previous public asset is retained until the replacement passes path/render verification.

## Integration policy

The existing SVG assets remain the public baseline while these PNG production masters are corrected. Replacing a functioning SVG with a visually richer but instructionally inaccurate PNG is a regression and is not allowed.
