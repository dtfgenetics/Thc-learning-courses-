# Production Validation Evidence Packet

This packet is the operational handoff for gates that cannot be closed by repository construction alone.

Canonical machine-readable contract: `registry/production-validation-evidence.json`.

## Use

For each control, collect evidence from the real staging/production system, keep secrets and learner PII outside Git, and store only safe identifiers, timestamps, hashes, approvals and controlled evidence references in the repository.

A green CI run does not satisfy a deployment gate.

## Required control groups

- production PostgreSQL and API database integration;
- administrator MFA enforcement;
- PostgreSQL row-level/equivalent authorization;
- independent security review;
- learner practical-submission/evaluator workflow;
- staging environment;
- production environment;
- backup and restore drill;
- monitoring and alert delivery;
- production issuer identity;
- managed credential signing;
- revocation persistence.

## Advancement rule

Only advance a mapped readiness gate after the real deployment has been tested, required evidence is referenced, findings are dispositioned, and the repository's truthfulness tests are deliberately updated to reflect the verified state.

Never place signing secrets, database passwords, raw authentication tokens, private candidate files, medical/accommodation details or learner PII in this packet.
