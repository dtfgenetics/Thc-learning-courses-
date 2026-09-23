# Production Evidence Reconciliation and Course 1 Raster Verification

This layer separates **code-ready controls** from **real deployment-backed operational evidence**.

## Production controls

The existing `registry/production-validation-evidence.json` defines 12 live production controls. Evidence records belong in `content/production-control-evidence/` and are validated against those control IDs.

A live readiness flag may be true only when the corresponding control has an exact `approved` production evidence record. `evidence-complete` is intentionally not enough.

Commands:

- `npm run production-evidence:validate`
- `npm run production-evidence:reconcile`
- `npm run production-evidence:reconcile:check`

The check detects drift in either direction: a readiness flag cannot turn true without approved evidence, and an approved evidence record cannot coexist with a stale false readiness flag.

## Course 1 raster closure

Course 1 is the only canonical course whose older completion ledger still reports machine-resolvable work.

`npm run course1:raster-public:verify` checks the live site against all **23** release-approved raster paths from `visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json`, verifies exact build identity, and reports failed paths.

Use `--write` only after a successful live verification. That records the deployment evidence and closes the Course 1 legacy machine queue without altering any human or credential-release gate.

The verifier does not substitute for rendered WCAG/UX review.
