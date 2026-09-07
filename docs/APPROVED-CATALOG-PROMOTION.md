# Approved catalog promotion

This branch promotes the project-owner-approved catalog through the repository lifecycle without fabricating pilot or production evidence.

Promoted on this branch:
- lessons -> approved
- courses -> approved
- assessment definitions -> approved
- credential definitions -> approved
- exact-version scientific, editorial, and assessment review records created from the snapshot-bound catalog attestation

Intentionally not promoted:
- question items remain at their pre-pilot lifecycle status until observed pilot evidence exists
- no active item pool is claimed
- no pilot statistics are fabricated
- no production signing, security, accessibility runtime, staging, backup/restore, or monitoring evidence is claimed

The promotion workflow runs the complete repository test suite before committing generated lifecycle changes. Normal pull-request validation remains read-only.
