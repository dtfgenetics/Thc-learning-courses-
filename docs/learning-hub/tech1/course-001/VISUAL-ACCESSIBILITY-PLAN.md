# Visual and Accessibility Plan — COURSE-LH-TECH1-001

Visuals are instructional objects, not decoration. Every visual requires a learning purpose, caption, text alternative, source/provenance record, and revision owner.

Visual production is continuously editable and expandable. The 12 visuals below are the first core set, not a maximum asset count. Additional diagrams, reference images, comparisons, simulations, document examples, and media may be added whenever they improve learning.

Canonical asset status and learner paths are tracked in `visuals/ASSET-REGISTRY.json`.

## Core instructional visuals

1. **Produced** — Hazard-control decision flow: routine control → stop/isolate where authorized → escalate. Learner asset: `/assets/course1/hazard-control-decision-flow.svg`.
2. **Produced** — PPE/HazCom information map linking task, hazard assessment, label, SDS, site procedure, restrictions, and PPE decision. Learner asset: `/assets/course1/ppe-hazcom-decision-map.svg`.
3. **Produced** — Cultivation work-area hazard scan showing representative electrical, water, pathway, ladder/tool, lighting, gas-alarm, and cultivation-exposure concerns without implying equal risk in every facility. Learner asset: `/assets/course1/cultivation-work-area-hazard-scan.svg`.
4. **Produced** — Biosecurity pathway map showing cleaner/sensitive areas, controlled transition boundaries, higher-risk/unresolved areas, and worker/tool/cart/hose/plant/debris movement. Learner asset: `/assets/course1/biosecurity-pathway-map.svg`.
5. **Produced** — Cleaning-before-disinfection sequence showing material control, debris removal, cleaning, product verification, approved application/contact conditions, finish step, inspection, and documentation. Learner asset: `/assets/course1/cleaning-disinfection-sequence.svg`.
6. **Produced** — Quarantine / hold / pesticide restricted-entry comparison that keeps plant-health, operational-status, and worker-protection controls conceptually separate. Learner asset: `/assets/course1/quarantine-hold-rei-comparison.svg`.
7. **Produced** — Controlled-document anatomy graphic showing identity, revision/effective status, prerequisites, sequence, acceptance criteria, records, and escalation. Learner asset: `/assets/course1/controlled-document-anatomy.svg`.
8. **Produced** — Material genealogy diagram from source material through propagation/movement, harvest container, sample, and later disposition links. Learner asset: `/assets/course1/material-genealogy.svg`.
9. **Produced** — Inventory reconciliation flow showing physical count, record count, verification, discrepancy preservation, and escalation. Learner asset: `/assets/course1/inventory-reconciliation-flow.svg`.
10. **Produced** — Operator-care versus servicing boundary diagram separating assigned routine care from protected access, disassembly, and hazardous-energy servicing. Learner asset: `/assets/course1/operator-care-servicing-boundary.svg`.
11. **Produced** — Maintenance-ready fault report example separating observation, permitted check, result, operational impact, and unsupported hypothesis. Learner asset: `/assets/course1/maintenance-fault-report.svg`.
12. **Produced** — Shift-handoff model showing outgoing preparation, written record, two-way exchange, incoming cross-check, and open-condition ownership. Learner asset: `/assets/course1/shift-handoff-model.svg`.

## Rich-content delivery

Course lessons may use ordered rich-content blocks for text, safety/evidence callouts, images, step sequences, comparisons, tables, decision scenarios, applied activities, document examples, resource links, and dividers. The block array has no project-defined maximum length. Legacy lesson fields remain supported while content is migrated into the richer delivery model.

## Accessibility requirements

- Provide meaningful text alternatives for all non-text content.
- Do not communicate hazard/status by color alone; pair color with labels/icons/patterns.
- Ensure diagrams can be understood in logical reading order.
- Provide data tables or equivalent text for charts.
- Caption video and provide transcripts for audio.
- Make interactions keyboard operable with visible focus.
- Avoid timed tasks unless time is the competency being measured; allow approved extended-time accommodations.
- For image-based safety/observation items where visual interpretation is the competency, provide an equivalent accessible assessment path that measures the same decision capability where feasible and document the accommodation decision.

## Production QA

Before release, verify alt text, captions, keyboard operation, heading structure, link purpose, table headers, contrast, zoom/reflow, error identification, and assessment accessibility against the current WCAG 2.2 AA target used by the project.

For learner-facing assets, QA must also verify that the web server actually serves the referenced asset path; an asset committed to the repository but unreachable from the learner interface does not count as delivered.
