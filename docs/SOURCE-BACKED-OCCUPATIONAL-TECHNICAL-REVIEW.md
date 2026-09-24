# Source-Backed Occupational Technical Review

Occupational program validation now explicitly consumes the certification public-source review packets.

## Sequence

1. Generate the 15 exact-version course source packets with `npm run certification:sources:review:write`.
2. Use the Technician I or Technician II occupational validation packet/operator kit.
3. Review every locked course version against its source packet before marking technical curriculum review complete.
4. Record material scientific/technical concerns, source-scope limitations and dispositions in the occupational validation evidence.
5. Complete occupational evidence with `--confirm-source-review`; the resulting record pins the current source-review registry ID/date so a later source-registry revision reopens the provenance check.
6. Continue separately with JTA, SME/employer validation, blueprint finalization and practical/capstone validation.

The source packet is designed to make several review failures visible:

- unresolved or stale source identifiers;
- a lesson relying only on a narrow study for a broad operational claim;
- generic greenhouse/extension evidence being treated as a cannabis-specific numerical standard;
- public safety guidance being treated as worker authorization;
- source-page freshness being confused with exact-version lesson approval.

The public-source layer is supporting evidence. It does not perform occupational validation, replace SMEs/employers, or approve the credential.
