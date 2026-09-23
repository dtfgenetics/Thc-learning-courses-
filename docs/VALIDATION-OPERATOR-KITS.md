# Validation Operator Kits

The certification project now generates exact-version operator kits for validation work that can proceed before final credential authorization.

Commands:

- `npm run certification:operator-kits`
- `npm run certification:operator-kits:json`
- `npm run certification:operator-kits:write`
- `npm run certification:operator-kits:test`

The generator creates:

- 15 course pilot kits;
- 15 rendered accessibility/UX review kits;
- 17 practical/capstone assessor-calibration kits;
- 2 occupational program-validation kits;
- 12 production-control validation kits.

Calibration kits contain a **private input template** for paired ratings. That template is not evidence and should not be committed with real candidate/person data. Only de-identified aggregate output from the calibration aggregator belongs in the repository.

Pilot, accessibility, occupational and production kits call the fail-closed intake CLI. Each kit also points operators toward the consolidated evidence-submission workflow after underlying evidence reaches a reviewable state.

These kits coordinate execution; they do not approve evidence or credentials.
