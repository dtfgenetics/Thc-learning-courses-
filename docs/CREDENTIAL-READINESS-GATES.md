# Credential readiness gates

A credential definition existing in the repository does **not** mean it is issuable.

`npm run credential:specialist:readiness` evaluates the complete definition chain for every credential: credential -> course -> required assessment -> secure item source.

Two assessment models are supported:

- **Static specialist assessment:** every item explicitly listed by the assessment must be active.
- **Blueprint-generated assessment:** every blueprint competency must meet the assessment's `minimumActiveItemsPerCompetency` using active summative/credential items. When reference-backed items are required, only active items with evidence references count toward the pool.

The report marks `issuanceReady=true` only when the definition is structurally valid, the credential/course/required assessments are published, and the appropriate static-item or blueprint-pool active gate is satisfied.

For THC Cultivation Foundations, the current production pool gate is 15 active items for each of 12 competencies, or at least 180 active eligible pool items distributed correctly. The 60-item learner form is generated from those pools; the assessment therefore must not be reported as `0/0` merely because its static `items` array is intentionally empty.

This is intentionally stricter than authoring readiness. Draft, technical-review, editorial-review and pilot items are development content and cannot satisfy the active-item gate.

The current specialist assessments use small development forms. They still require item-bank expansion, technical/editorial/assessment review, pilot evidence, challenge review and standard-setting work before any production issuance decision.
