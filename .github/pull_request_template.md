## Change channel

- [ ] `content/*` curriculum/evidence/assessment source
- [ ] `feat/*` new capability
- [ ] `fix/*` defect or integration repair
- [ ] `chore/*` maintenance/governance

## Landing check

- [ ] Files are in the source-of-truth directory defined by `docs/INTEGRATION-WORKFLOW.md`.
- [ ] No learner PII, production attempts/scores, signing keys, secrets, or secure production assessment payloads are committed.
- [ ] Immutable IDs and versions were preserved or intentionally versioned.

## Evidence and review

- [ ] Scientific claims/references are mapped where required.
- [ ] Publication/review gates were not set true without matching evidence or human review records.
- [ ] Credential-bearing lesson changes preserve the review sequence: draft -> scientific -> editorial -> approved -> published.
- [ ] Assessment-item changes preserve the item-bank lifecycle and do not directly promote AI-assisted drafts to active.

## Automated gates

- [ ] `npm test` passes.
- [ ] New behavior has validation or regression coverage where applicable.
- [ ] Production release readiness was not weakened to make a draft pass.

## Merge discipline

- [ ] This PR is based on current `main` or has been reconciled with it.
- [ ] This work is not a duplicate of an already squash-merged branch/PR.
- [ ] Failures will be repaired on this branch rather than by opening replacement `-v2`/`-temp` branches.
