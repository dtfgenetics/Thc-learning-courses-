# Program Validation and Candidate Governance Packets

The repository can now generate the remaining program-level human review packets separately from course-level validation.

Commands:

- `npm run certification:program-review-packets`
- `npm run certification:program-review-packets:json`
- `npm run certification:program-review-packets:write`
- `npm run certification:program-review-packets:test`

Two occupational-validation packets are generated, one for Technician I and one for Technician II. Each locks the current credential-program and course versions, lists current practical/capstone anchors, and provides dedicated technical-review, JTA, SME/employer, blueprint and performance-validation sections.

A third candidate-governance packet exposes the currently unresolved decisions without inventing values: final attempt limit, waiting period, fee policy and evidence-retention periods remain unresolved until the appropriate authorities approve them.

The packets are review aids only. They do not change evidence or authorization state.
