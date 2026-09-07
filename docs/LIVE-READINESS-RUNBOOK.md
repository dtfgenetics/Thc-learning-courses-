# THC Academy Live Readiness Runbook

This runbook connects the repository's existing authoring, review, pilot, staging and release tooling. It does not bypass any release gate and it does not convert draft content into approved content automatically.

## 1. Confirm the authoring trunk

Work from current `dev` using one coherent short-lived branch per change. Before human review begins for a release candidate, run:

```bash
npm test
npm run status
npm run credential:coverage
npm run credential:specialist:coverage
```

The status report is informational for production blockers. Ordinary authoring remains allowed while review, pilot and production-only gates are open.

## 2. Complete exact-version human curriculum review

Generate the queue and select review work:

```bash
npm run review:queue
npm run review:next
npm run review:packet -- --object=<LESSON-ID> --format=markdown
```

For Foundations, scientific review must precede editorial approval for the exact lesson version. Review the claims, references, numeric values, causal language, examples, summaries and practical application against the cited evidence.

Record the actual human decision with `npm run review:record` using the required reviewer identity and exact object version. Never create an `approved` record for AI/self-review alone. After any substantive lesson revision, the new version requires new review evidence.

Check progress with:

```bash
npm run review:validate
npm run review:readiness
npm run review:queue:check
npm run review:packets:check
```

## 3. Complete human assessment review

Review assessment definitions and each item for objective/competency alignment, evidence scope, key correctness, distractor quality, Bloom level, difficulty, accessibility, security, feedback policy and legal/safety boundaries.

Use the same packet and review-record workflow. Draft or credential purpose does not imply an item is production eligible.

```bash
npm run review:packet -- --object=<ASSESSMENT-OR-ITEM-ID> --format=markdown
npm run review:record
npm run review:validate
```

## 4. Collect real pilot evidence

Create a blank pilot record only after the intended item version is stable enough to pilot:

```bash
npm run pilot:template -- --item=<ITEM-ID> --analyst=<ANALYST-ID> --write
```

Pilot using approved delivery procedures. Keep learner identities and raw production attempts outside Git. Store only the de-identified aggregate evidence allowed by `schemas/pilot-evidence.schema.json`.

Aggregate and validate observed results:

```bash
npm run pilot:aggregate
npm run pilot:validate
npm run pilot:readiness
npm run itembank:readiness
```

Do not mark pilot evidence complete or activate an item from synthetic data, guessed statistics or AI-generated response samples.

## 5. Build the active assessment pool

Only reviewed, pilot-supported items should advance toward the active pool. Preserve historical review and pilot evidence when an item changes version.

Recheck duplicate detection, coverage and form generation:

```bash
npm run assessment:duplicates:check
npm run itembank:readiness
npm run exam:form:dev
npm run credential:specialist:coverage
npm run credential:coverage
```

The production pool must satisfy the configured minimum size and blueprint/competency coverage. Do not weaken minimums to make the gate green.

## 6. Close security and credential-production gates

Before production credential issuance, verify actual deployed controls for:

- production issuer identity;
- production signing and private-key custody;
- admin MFA enforcement;
- row-level authorization/RLS in the deployed database;
- security review;
- revocation persistence;
- server-side scoring and answer-key boundaries.

Repository tests can validate contracts, but deployed-control gates must not be marked true until the real environment has been verified.

## 7. Complete accessibility review

Close the content, assessment and frontend accessibility gates with actual review/testing evidence. The current WCAG target alone is not completion.

Run the available automated web accessibility test as part of the evidence set:

```bash
npm run academy:accessibility:test
npm run web:qa
```

Automated checks supplement rather than replace appropriate human accessibility review.

## 8. Establish and verify staging

The normal lifecycle is:

`feature/content/fix/chore -> dev -> staging -> main -> explicit production release`

Before promotion to staging:

```bash
npm test
npm run staging:readiness
npm run staging:smoke
npm run status
```

Verify the actual staging environment, authentication/authorization, database integration, assessment delivery, credential verification, observability and public routes. Do not mark `operations.stagingEnvironment` true merely because staging contracts exist in code.

## 9. Complete operations evidence

Production still requires verified environment and operating controls, including:

- production environment;
- backup/restore test;
- monitoring and alerting;
- incident-response readiness;
- production persistence/auth/security controls.

Record readiness facts in the appropriate governed configuration only after verification.

## 10. Run the fail-closed release checks

Immediately before release, run the full quality suite and scoped production release check:

```bash
npm test
npm run status
npm run production:readiness
npm run release:check
```

A production release requires the configured published course/lesson state, exact-version human approvals, active reviewed item pools, credential/runtime readiness and all required system gates. Do not set `productionReady`, `publicationReady`, review gates, pilot gates or security/operations gates to true simply to permit release.

## 11. Promote and release explicitly

Promote a validated release candidate through `staging` to `main`. Merging to `main` does not publish certification content. Use the explicit production release workflow/manual release process or an approved `academy-*` release tag only after the release check is green.

After release, verify public routes, enrollment, learner progress, assessment attempt/scoring behavior, credential issuance/verification where enabled, monitoring, rollback capability and audit logging.

## Current principle

Content completeness is measured during authoring. Production trust is evidence-driven. The system should make it easy to add and improve courses while remaining fail-closed for claims of human review, active assessment validity, credential issuance, security readiness and production publication.
