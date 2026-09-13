# Course 1 Public Visual Asset Index

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`

This index defines the public view/download locations for learner-facing Course 1 visual assets. Full-resolution production masters and image-generation drafts remain in the controlled Google Drive visual-production folder; approved web assets are published from this public repository so they can be embedded in the course and downloaded without Drive permissions.

## Public assets

| Asset | Primary lesson(s) | Public view/download |
|---|---|---|
| Cultivation workplace hazard-recognition scan | 1.1; supporting use in 1.3 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/cultivation-work-area-hazard-scan.svg |
| Hierarchy of controls and Technician I decision boundaries | 1.1 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/hazard-control-decision-flow.svg |
| PPE task guide and hazard-communication information map | 1.2 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/ppe-hazcom-decision-map.svg |
| Biosecurity pathway map | 2.1 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/biosecurity-pathway-map.svg |
| Cleaning and disinfection sequence | 2.2 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/cleaning-disinfection-sequence.svg |
| Quarantine, hold, and restricted-entry comparison | 2.3 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/quarantine-hold-rei-comparison.svg |
| Controlled-document anatomy | 3.1 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/controlled-document-anatomy.svg |
| Material genealogy | 4.1 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/material-genealogy.svg |
| Inventory reconciliation flow | 4.2–4.3 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/inventory-reconciliation-flow.svg |
| Operator-care versus servicing boundary | 5.1–5.2 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/operator-care-servicing-boundary.svg |
| Maintenance-ready fault report | 5.3 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/maintenance-fault-report.svg |
| Professional shift-handoff model | 6.2–6.3 | https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/apps/web/public/assets/course1/shift-handoff-model.svg |

## Delivery contract

- **Course repo:** canonical public web assets live under `apps/web/public/assets/course1/`.
- **Canonical lesson data:** lesson image blocks reference `/assets/course1/<asset>.svg` so the standalone course app can serve the same files.
- **Live WordPress course:** approved lesson visuals use the public raw GitHub URL from the same canonical asset.
- **Downloads:** raw GitHub URLs are deliberately public and may be opened or saved directly without learner authentication.
- **Google Drive:** retains full-resolution PNG production masters, alternates and review drafts; Drive is not the public delivery dependency.
- **Accessibility:** public SVGs must have an accessible title/description; WordPress embeddings must also supply lesson-specific `alt` text and captions.
- **Change control:** replacing an approved public asset at the same repo path updates both the standalone course and any WordPress lesson configured to consume its raw URL without changing the lesson identifier.

## Current WordPress publication mapping

- Lesson 1.1 primary visual: `cultivation-work-area-hazard-scan.svg`
- Lesson 1.2 primary visual: `ppe-hazcom-decision-map.svg`
- Remaining lessons stay on the production queue until their visual has passed lesson-content, factual, accessibility and responsive-layout QA.

The asset count is intentionally not capped. Additional diagrams, reference sheets, downloadable job aids and alternate accessible formats may be added whenever they improve learning.