# Final Approval and Application Transitions

The remaining human and production validation evidence now has controlled promotion paths instead of direct JSON editing.

## Derived certification gate approval

For gates whose underlying evidence is already derived by the authoritative reconciler:

`npm run evidence:approve:derived-gate -- --course COURSE-LH-TECH1-001 --gate pilotExecution --authority PILOT-AUTHORITY --decision-notes "Reviewed complete pilot evidence." --write`

This command is restricted to:

- `pilotExecution`
- `itemAnalysis`
- `practicalAssessorCalibration`
- `accessibilityUxHumanReview`
- `occupationalProgramValidation`

The gate must already be exactly `evidence-complete` in the live reconciler. The command cannot approve prepared/in-progress evidence and cannot be used for standard setting, secure forms, or credential authorization, which have their own governed workflows.

## Production evidence completion

Start from an `in-progress` production-control record:

`npm run evidence:complete:production -- --source PRODEVID-... --authority CONTROL-OWNER --confirm-required-evidence --confirm-findings-dispositioned --write`

This creates a new `evidence-complete` record and leaves live readiness unchanged.

## Production approval + readiness application

After the designated authority reviews the deployment-backed evidence:

`npm run evidence:approve:production -- --source PRODEVID-...-COMPLETE-... --authority CONTROL-AUTHORITY --decision-notes "..." --confirm-live-verification --confirm-apply-readiness --write`

The command:

- requires an exact `evidence-complete` source;
- requires real evidence references and findings disposition;
- creates a new append-only `approved` production evidence record;
- marks the matching production-validation control approved;
- records evidence provenance on that control;
- applies only that control's mapped live readiness booleans in `registry/system-readiness.json`;
- leaves overall `productionReady=false` until the separate final readiness/credential release workflow authorizes it.

The production reconciler now treats a mismatch between approved evidence, the control registry, and mapped readiness booleans as a structural problem.
