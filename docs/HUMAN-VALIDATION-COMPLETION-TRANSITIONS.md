# Human Validation Completion Transitions

Three ready-now human evidence classes now have append-only completion commands instead of requiring direct JSON editing.

- `npm run evidence:complete:pilot`
- `npm run evidence:complete:accessibility`
- `npm run evidence:complete:occupational`

Each command starts from an exact-version draft/in-progress record, requires explicit confirmations for the evidence it is claiming, verifies the current course/program version, and writes a new `evidence-complete` record. The source record remains unchanged.

Pilot completion requires learner feedback, data-quality review, fairness/accessibility review and disposition, plus current-version knowledge/performance evidence when those components are required.

Accessibility completion requires at least three explicitly supplied review environments, full required coverage, zero unresolved failures, and confirmation that applicable Level A/AA failures were resolved or dispositioned.

Occupational validation completion requires explicit technical curriculum, **public-source review**, JTA, SME/employer, blueprint, and performance-validation confirmations plus current program/course locks. The completed record pins the current `public-authoritative-source-supplements` registry ID/date in the technical-review section and evidence references.

`evidence-complete` is not the same as approval. The dependency-aware work queue moves these gates to ready-for-approval; the designated authority can then record the gate decision through the existing certification gate evidence workflow.
