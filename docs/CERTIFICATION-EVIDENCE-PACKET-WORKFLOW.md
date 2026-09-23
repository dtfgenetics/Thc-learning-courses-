# Certification Evidence Packet Workflow

The certification architecture now has nine distinct evidence gates. This workflow turns the current repository state into execution-ready packets without fabricating completion.

Run:

- `npm run certification:evidence-packets` for a dry-run inventory;
- `npm run certification:evidence-packets:json` for machine-readable packet inventory;
- `npm run certification:evidence-packets:write` to generate Markdown + JSON packets under `generated/certification-evidence-packets/`;
- `npm run certification:evidence-packets:test` to verify all 15 current course packets can be generated;
- `npm run certification:legacy-ledgers:audit` to inspect old completion-ledger machine queues.

Every packet is generated from the current course version, credential-program version, final-assessment version where applicable, performance-assessment anchors, pilot protocol path, and the current nine-gate certification execution registry.

The packets are execution aids only. Reviewers and operators use them to collect and reference real evidence. Gate closure still comes only from validated exact-version evidence records recognized by `scripts/report-certification-evidence-reconciliation.mjs`.

## Current legacy-ledger boundary

The 15 older course-completion ledgers remain useful for package-level work tracking, but they are not the certification release authority.

A machine-complete ledger must not keep stale machine actions. Conversely, a machine-open ledger must identify concrete executable work. The audit enforces that contract while the newer evidence reconciler remains authoritative for certification readiness.
