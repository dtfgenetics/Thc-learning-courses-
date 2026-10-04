# Standard Setting and Secure Form Approval Transitions

Panel-complete standard-setting evidence and draft/evidence-complete secure-form evidence now have controlled append-only approval transitions.

## Standard-setting adoption

After the panel record is complete, the performance-level description is approved, sensitivity/impact review is complete, and the governance authority has made a decision:

`npm run evidence:approve:standard-setting -- --source STDSET-... --production-cut-percent 81 --decision-authority GOVERNANCE-AUTHORITY --rationale "..." --confirm-adopt --write`

The command refuses to adopt if:

- the source is not `panel-complete`;
- the exact course or final version is stale;
- the stable item count no longer matches;
- the performance-level description is not approved;
- sensitivity review is incomplete;
- explicit `--confirm-adopt` is missing.

It writes a new approved evidence record rather than mutating the panel record.

## Secure operational form approval

After a real equivalence/security review has been completed:

`npm run evidence:approve:secure-form -- --source FORMEQ-... --authority SECURITY-AUTHORITY --confirm-private-items --confirm-blueprint-equivalence --confirm-cognitive-equivalence --confirm-critical-content-equivalence --confirm-scored-opportunity-equivalence --confirm-retest-review --confirm-private-store --confirm-answer-exclusion --confirm-exposure-tracking --confirm-quarantine --quantitative-status preliminary --write`

Every required equivalence/security confirmation is explicit. The command refuses stale course/final versions and writes a new approved record.

Only opaque form IDs, revisions, item counts and fingerprints remain in repository evidence. Secure items, answer keys, private manifests and credentials stay outside the public repository.

These approval transitions do not bypass the certification dependency graph; they only create valid gate evidence after the responsible human authorities have made the underlying decisions.
