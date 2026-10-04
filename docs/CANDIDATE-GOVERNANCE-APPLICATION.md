# Candidate Governance Application

Candidate-governance approval evidence and the live governance-control registry are intentionally separate.

An approved evidence record does **not** automatically authorize operational use. After the designated authorities have approved the exact current controls version, apply that decision with:

`npm run candidate-governance:apply -- --record CANDGOVAPP-... --confirm-operational-use --write`

The command refuses to apply anything unless the record:

- is exact-version matched to the current governance controls;
- has `status=approved`;
- includes all six required approval domains;
- contains approved attempt-limit, waiting-period, fee and retention policies;
- contains non-empty retention periods for every governed record category.

Application updates the controlled registry from the approved record, records the approval provenance, and sets `operationalUseAuthorized=true`.

Credential authorization remains blocked until both the approved evidence record **and** the applied operational-use state exist.
