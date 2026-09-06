# Credential readiness gates

A credential definition existing in the repository does **not** mean it is issuable.

`npm run credential:specialist:readiness` evaluates the complete definition chain for every credential: credential -> course -> required assessment -> referenced item versions. The report marks `issuanceReady=true` only when the definition is structurally valid, the credential/course/required assessments are published, and every item referenced by those assessments is active.

This is intentionally stricter than authoring readiness. Draft, technical-review, editorial-review and pilot items are development content and cannot satisfy the active-item gate.

The current specialist assessments use small development forms. They still require item-bank expansion, technical/editorial/assessment review, pilot evidence, challenge review and standard-setting work before any production issuance decision.
