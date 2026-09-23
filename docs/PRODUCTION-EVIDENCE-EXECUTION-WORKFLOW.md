# Production Evidence Execution Workflow

The repository now distinguishes **code-ready controls** from **deployment-backed approval evidence**. This workflow makes the remaining 12 production controls executable without pretending they are already complete.

Commands:

- `npm run production-evidence:packets` — dry-run packet inventory;
- `npm run production-evidence:packets:json` — machine-readable inventory;
- `npm run production-evidence:packets:write` — generate Markdown + JSON execution packets;
- `npm run production-evidence:packets:test` — verify all 12 packets can be generated.

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
- credential signing;
- revocation persistence.

Each packet includes the exact mapped `system-readiness.json` gate, the canonical required-evidence list, a live execution checklist, and a safe evidence-record section.

A completed checklist is not approval. The mapped readiness gate advances only after an actual `content/production-control-evidence/*.json` record is validated and reaches `approved`.
