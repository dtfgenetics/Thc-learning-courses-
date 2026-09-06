# THC Academy operator status

Use the unified status command before starting review, pilot, release, or deployment work:

```bash
npm run status
```

For machine-readable output:

```bash
npm run status:json
```

CI uses:

```bash
npm run status:check
```

The report summarizes:

- staging usability and production readiness;
- course, module, lesson, assessment, question, credential, encyclopedia, and glossary inventory;
- status distribution across major content types;
- summative/credential question depth and active-item count;
- approved review records and pending scientific/editorial/assessment reviews;
- pilot-record counts and completed pilot evidence;
- every unresolved production-readiness gate.

`stagingUsable: true` means the repository meets the staging contract defined in `docs/STAGING-RUNBOOK.md`. It does not mean production credential issuance is permitted.

`productionReady: true` is only possible when `registry/system-readiness.json` claims production readiness and no readiness gate remains false. The report never flips gates automatically.
