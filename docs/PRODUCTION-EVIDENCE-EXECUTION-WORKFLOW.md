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

## Learner subject-isolation verification

Use two dedicated short-lived learner **test** identities to exercise deployed persistence separation:

`THC_VERIFY_LEARNER_A_TOKEN=... THC_VERIFY_LEARNER_B_TOKEN=... npm run production:learner-isolation-verify -- --base-url https://<academy-host>`

The verifier writes verification-only progress markers under each test identity, confirms each learner sees its own marker and cannot see the other learner's marker, then resets both markers to `not-started`.

This provides deployed application-level evidence that learner persistence is scoped by the authenticated subject. It does **not** independently prove direct database RLS behavior against privileged/database-level access, so the database policy/version and direct authorization tests remain separate evidence requirements.
