# Integrated Standard-Setting Approval and Operator Kits

The two integrated performance pathways now have a complete execution path from panel recommendation through governance adoption.

## Generate operator kits

- `npm run integrated-standard-setting:kits`
- `npm run integrated-standard-setting:kits:json`
- `npm run integrated-standard-setting:kits:write`

One exact-version kit is generated for Technician I Course 7 and one for Technician II Course 8. Each kit reads the dependency-aware certification queue, lists every current practical/capstone version, and provides commands for panel intake and governance approval.

Current provisional thresholds from the performance files are displayed only as context. They are **not** copied into panel recommendations or governance decisions.

## Governance adoption

After real panel-complete evidence exists:

`npm run evidence:approve:integrated-standard-setting -- --source IPSTDSET-... --decision-authority GOVERNANCE-AUTHORITY --rationale "..." --component "PRACTICAL-...|<ADOPTED-PERCENT>" ... --component "CAPSTONE-...|<ADOPTED-PERCENT>" --confirm-all-components-pass --confirm-no-critical-errors --confirm-noncompensatory --confirm-adopt --write`

The command requires an adopted threshold for every current required practical/capstone and explicit confirmation of the integrated decision rules:

- every required component must pass;
- critical errors are disqualifying;
- compensatory aggregate scoring is not allowed.

It refuses stale course/component versions, missing or extra components, non-panel-complete source evidence, or missing confirmations. It writes a new approved record rather than mutating the panel record.

This completes the machine workflow only. The actual panel recommendations and governance adoption remain human evidence.
