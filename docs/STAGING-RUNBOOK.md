# THC Academy staging operations runbook

This runbook defines the repeatable path for using THC Academy before production credential issuance is enabled.

## 1. Validate the repository

```bash
npm ci
npm test
npm run staging:readiness
```

`staging:readiness` must report `stagingUsable: true`. This is a repository/runtime capability claim, not a production certification claim.

## 2. Start the learner application

```bash
npm run academy:dev
```

Open `http://localhost:4173/academy`.

Development and staging mode may display draft lessons with a visible **Staging preview** label. `NODE_ENV=production` automatically suppresses draft content.

## 3. Start the development API

In another process:

```bash
THC_API_ADMIN_TOKEN='replace-with-a-random-secret-at-least-32-characters' npm run api:dev
```

Default API address: `http://localhost:8787`.

Smoke checks:

```bash
curl -fsS http://localhost:8787/healthz
curl -fsS http://localhost:8787/readyz
curl -fsS -H "Authorization: Bearer $THC_API_ADMIN_TOKEN" http://localhost:8787/api/v1/admin/diagnostics
```

The development API intentionally uses non-production adapters unless explicit persistent adapters are supplied. Do not interpret a green development readiness endpoint as authorization for production issuance.

## 4. Reviewer workflow

Review work is governed through repository records rather than informal approvals.

```bash
npm run review:queue
npm run review:packet -- --lane=scientific
npm run review:packet -- --lane=editorial
npm run review:packet -- --lane=assessment
```

Reviewers create version-specific review evidence. AI-generated content cannot approve itself.

## 5. Pilot workflow

For an item selected for pilot:

```bash
npm run pilot:template -- --item=ITEM-ID --write
npm run pilot:validate
npm run pilot:readiness
```

Populate pilot statistics only from real pilot administrations. Do not fabricate sample size, difficulty, discrimination, distractor, timing, or challenge-history data.

## 6. Course release check

A release is always explicitly scoped:

```bash
npm run release:check -- --course=COURSE-CULT-FOUNDATIONS-001
```

Specialist example:

```bash
npm run release:check -- --course=COURSE-GENETICS-ADVANCED-001 --credential=CRED-GENETICS-ADVANCED-001
```

The command is expected to fail until that course has completed its real publication, review, active-bank, and credential gates.

## 7. Production boundary

Do not set `productionReady=true` or publish/issue production credentials until the repository truthfully records completion of all required gates, including:

- scientific and editorial curriculum review;
- human assessment review;
- real pilot statistics and active item pools;
- production persistence and authorization;
- production issuer identity, signing, and revocation persistence;
- administrator MFA and security review;
- accessibility verification;
- live staging/production environments;
- backup/restore testing;
- monitoring and alerting.

## Definition of staging usable

Staging usable means the repository can be installed reproducibly, validated, navigated through the learner app, exercised through the development API, reviewed, piloted, and evaluated through deterministic release checks. It does not mean the Academy is accredited, government-approved, occupationally licensed, or ready to issue production certificates.
