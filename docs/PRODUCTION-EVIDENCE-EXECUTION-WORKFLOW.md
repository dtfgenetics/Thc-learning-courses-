# Production Evidence Execution Workflow

The repository now distinguishes **code-ready controls** from **deployment-backed approval evidence**. This workflow makes the remaining 13 production controls executable without pretending they are already complete.

Commands:

- `npm run production-evidence:packets` — dry-run packet inventory;
- `npm run production-evidence:packets:json` — machine-readable inventory;
- `npm run production-evidence:packets:write` — generate Markdown + JSON execution packets;
- `npm run production-evidence:packets:test` — verify all 13 packets can be generated.

The generated packets cover:

- production PostgreSQL/API persistence;
- admin MFA;
- row-level authorization;
- independent security review;
- practical evidence submission/evaluator workflow;
- staging;
- production;
- backup/restore;
- monitoring/alerting;
- issuer identity;
- private secure assessment-store integration;
- credential signing;
- revocation persistence.

Each packet includes the exact mapped `system-readiness.json` gate, the canonical required-evidence list, a live execution checklist, and a safe evidence-record section.

A completed checklist is not approval. The mapped readiness gate advances only after an actual `content/production-control-evidence/*.json` record is validated and reaches `approved`.

## Deployment identity binding

When a production evidence record is tied to an actual deployment, create it with the exact deployment identity rather than only a generic run reference. The production intake command accepts:

- `--source-sha` — the exact 40-character certification repository commit;
- `--image-digest` — the deployed container digest in `sha256:<64 hex>` form;
- `--attestation-ref` — the signed provenance attestation reference;
- optional `--service-id`, `--build-id`, and `--schema-version`.

If any deployment-identity argument is supplied, source SHA, image digest, and attestation reference become mandatory. This keeps deployment-backed evidence traceable to the exact image that was built and attested rather than only to a branch, tag, or operator description.

## External live deployment smoke verification

After the exact attested image is deployed, run:

`npm run production:live-verify -- --base-url https://<academy-host> --source-sha <exact-40-char-sha>`

The verifier is intentionally tokenless and safe to attach to an evidence packet. It checks:

- exact public build identity at `/api/build-info`;
- `/healthz` liveness;
- `/readyz` readiness with schema version 7;
- anonymous denial on `/api/v1/admin/diagnostics` with a Bearer challenge;
- baseline API security headers.

The JSON output includes request identifiers, safe status metadata, timing, build identity, and explicit limitations. It does **not** include credentials or authorization headers and does not claim MFA, row-level isolation, private assessment behavior, backup/restore, monitoring, signing, revocation, independent security review, or professional credential authorization.

## Authenticated scope and MFA boundary verification

After tokenless production smoke verification passes, use dedicated short-lived **test identities** to validate the deployed authentication boundary:

`THC_VERIFY_LEARNER_TOKEN=... THC_VERIFY_EVALUATOR_TOKEN=... THC_VERIFY_ADMIN_NO_MFA_TOKEN=... THC_VERIFY_ADMIN_MFA_TOKEN=... npm run production:auth-boundary-verify -- --base-url https://<academy-host>`

The verifier checks that:

- the learner token can read its own learner progress route;
- the learner token is denied evaluator and admin scopes;
- the evaluator token can read evaluator capabilities and is denied admin scope;
- an admin-scoped token without MFA is rejected with `admin-mfa-required`;
- an MFA-asserted admin token can read admin diagnostics;
- the admin token is denied learner scope when it does not carry learner permission;
- learner, evaluator, and admin test identities resolve to distinct subjects.

Returned subjects are hashed before evidence output. Tokens are accepted only from environment variables and are never written to the report. Use short-lived dedicated test identities; never use ordinary learner or staff credentials for verification.

This verifies authentication/scope/MFA behavior only. It does not establish learner-to-learner row isolation, secure assessment integrity, backup/restore, monitoring, signing, revocation, independent security review, or credential-release authorization.

## Learner subject-isolation verification

Use two dedicated short-lived learner **test** identities to exercise deployed persistence separation:

`THC_VERIFY_LEARNER_A_TOKEN=... THC_VERIFY_LEARNER_B_TOKEN=... npm run production:learner-isolation-verify -- --base-url https://<academy-host>`

The verifier writes verification-only progress markers under each test identity, confirms each learner sees its own marker and cannot see the other learner's marker, then resets both markers to `not-started`.

This provides deployed application-level evidence that learner persistence is scoped by the authenticated subject. It does **not** independently prove direct database RLS behavior against privileged/database-level access, so the database policy/version and direct authorization tests remain separate evidence requirements.

## Secure assessment store read-only verification

With an MFA-asserted dedicated admin test token and the expected private bank version:

`THC_VERIFY_ADMIN_MFA_TOKEN=... THC_VERIFY_SECURE_BANK_VERSION=... npm run production:secure-store-verify -- --base-url https://<academy-host>`

The verifier confirms the private bank summary is reachable, the exact bank version matches, the bank is `approved-operational`, at least one approved operational item exists, and the response does not contain protected prompts, choices, answer keys, rationales, or scoring keys.

This is intentionally read-only. It does not substitute for separate live evidence covering operational item selection, form recording/exposure tracking, quarantine exclusion, or learner delivery projection.

## Direct PostgreSQL RLS verification

Use a dedicated validation database role plus two synthetic learner rows:

`THC_VERIFY_RLS_DATABASE_URL=... THC_VERIFY_RLS_LEARNER_A_ID=... THC_VERIFY_RLS_LEARNER_B_ID=... npm run production:direct-rls-verify`

Requirements enforced by the verifier:

- PostgreSQL TLS must be required;
- the validation role must not be superuser and must not have `BYPASSRLS`;
- all protected Academy learner tables must have both RLS enabled and `FORCE ROW LEVEL SECURITY`;
- every protected table must have at least one deployed policy;
- learner A must see its own `learners` row and not learner B's row;
- learner B must see its own row and not learner A's row.

The check runs inside a read-only transaction and emits only counts plus hashed role/learner identifiers. It never emits the database URL or row contents. Use dedicated synthetic validation learners only.

## Credential revocation execution path

The production API exposes an MFA-admin-only revocation route:

`POST /api/v1/admin/credentials/<credential-uuid>/revoke`

with JSON:

`{"reason":"<controlled revocation reason>"}`

The route requires `admin:write`, which is MFA-enforced by the production authorizer. It uses the transactional credential writer to persist the status transition, credential-status event, and audit event. Repeating the same revocation is idempotent and does not create duplicate status/audit writes.

After revocation, the public verification route for the credential's verification ID must return `valid: false` and `status: "revoked"`.

Use only a dedicated controlled test credential for production revocation verification. A successful controlled revocation test is evidence for the revocation-persistence control only; it does not authorize credential issuance.

## Structured production evidence requirements

Production evidence completion and approval now derive required verification keys directly from each control's canonical `requiredEvidence` list. Generic confirmation flags and evidence references are no longer sufficient by themselves.

Generated production evidence packets show the exact key for every required evidence item. The record's `verification` object must contain a meaningful boolean, string, or finite numeric value for every listed key before it can transition to `evidence-complete`. Approval revalidates the same keys before applying any readiness gate.

For operator-generated evidence, `scripts/complete-production-control-evidence.mjs` also accepts `--verification-json <path>` to merge a JSON object into the source record before validating completeness.

## Verification template generator

To scaffold the exact structured fields for a production control without inventing values:

`npm run production-evidence:verification-template -- --control <control-id>`

The command emits every required verification key with a `null` value plus the human-readable evidence label. Replace each `null` only with real deployment-backed evidence before passing the object to `--verification-json` during completion.

## Credential signer identity verification

With an MFA-asserted admin test token:

`THC_PUBLIC_BASE_URL=https://<academy-host> THC_VERIFY_ADMIN_MFA_TOKEN=... npm run production:signer-identity-verify`

The existing admin diagnostics endpoint exposes only whitelisted signer metadata: whether a signer is configured, the signer adapter kind, and public issuer identity (`issuerId`, name, HTTPS URL). No private key, signature, seed, PEM, or provider secret is exposed.

This verifies deployed signer/issuer configuration only. It does not perform the controlled signing smoke test, validate key custody, or satisfy credential-signing approval by itself.
