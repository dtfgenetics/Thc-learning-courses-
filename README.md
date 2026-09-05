# THC Learning Courses / THC Academy

Version-controlled curriculum, assessment, review, and credentialing source for Teaching Healthy Cultivation.

## Mission

Build a standards-aware education platform in which scientific evidence supports competencies, competencies drive learning objectives, lessons teach those objectives, assessments measure them, and credentials are issued only after defined requirements are satisfied.

## Repository responsibilities

This repository owns curriculum source files, competency definitions, learning objectives, evidence/claim records, assessment source objects, credential definitions, standards mappings, schemas, validation tooling, public API contracts, and release-gate logic.

It must **not** store learner identities, production assessment attempts or scores, issued credential secrets, private signing keys, production databases, or public-client copies of secure assessment answer data.

## Current state

The Cultivation Foundations track currently includes:

- a 12-domain competency, module, lesson, and objective map;
- substantive structured first-pass lesson content across all 12 domains;
- evidence and scientific-claim registries;
- a 60-item summative assessment blueprint and draft pilot bank;
- deterministic development exam-form generation;
- deterministic credential-eligibility checks;
- test-only credential issuance, integrity verification, and privacy-safe public verification projection;
- explicit scientific/editorial/assessment/accessibility/legal review records and workflow contracts;
- review-readiness and item-bank-readiness reporting;
- full curriculum/credential CI quality gates;
- a separate fail-closed production release gate.

This is **not yet a production certification release**. The registry intentionally keeps publication, human scientific/editorial review, active item-pool, and credential-readiness gates closed until the required evidence and approvals exist.

## Validate development work

Run the complete gate locally:

```bash
npm test
```

The suite checks referential integrity and publication safeguards, generates a deterministic development exam form, tests credential eligibility and test issuance/verification, verifies the public credential projection does not leak private fields, and reports review/item-bank readiness.

## Production release check

Production publication is a separate operation:

```bash
npm run release:check
```

The release check fails closed unless the curriculum registry is publication-ready, every configured release gate is true, mapped lessons/course/assessment are in production-eligible states, and required scientific/editorial review records exist for the exact lesson versions.

## Integration workflow

See `docs/INTEGRATION-WORKFLOW.md` for branch channels, source-of-truth directories, promotion rules, PR gates, release gates, and stale-branch/squash-merge handling.

## Publication rule

Draft/scaffold material is not production educational content. A source record, generated lesson, passing development test, or registry boolean is not a substitute for human review. Credential-bearing material must complete the documented review workflow and production release gate before publication.
