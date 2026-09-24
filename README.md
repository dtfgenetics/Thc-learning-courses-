# THC Learning Courses / THC Academy

Version-controlled curriculum, assessment, evidence, review, and credentialing source for Teaching Healthy Cultivation.

## Mission

Build a standards-aware education platform in which scientific evidence supports occupational competencies, competencies drive learning objectives, lessons teach those objectives, assessments measure them, performance evidence validates applied skill, and credentials are issued only after defined requirements are satisfied.

## Source-of-truth boundary

This repository is the authoritative source for the THC Academy certification system.

- **Certification:** dedicated `COURSE-LH-*` courses, `LESSON-LH-*` lessons, course-derived assessments, practicals/capstones, exact-version review evidence, and credential rules.
- **Encyclopedia:** a separate reference/education system. Encyclopedia material may support optional learning but may not substitute for certification instruction, satisfy course completion, or supply untaught examination content.
- **Legacy 420 catalog:** historical/provenance material only. It is not the certification curriculum.

The machine-enforced boundary is defined in `registry/certification-content-policy.json`.

## Current academic course system

The canonical Technician program contains **15 dedicated certification courses**:

- Technician I: 7 courses.
- Technician II: 8 courses.
- 13 courses use dedicated conventional course finals.
- Technician I Course 7 and Technician II Course 8 use integrated performance labs/capstones instead of conventional finals.

The canonical course packages are academically published for learning use. Their completion registries currently report **machine-resolvable work complete** with no open machine content actions.

The repository also contains course-derived assessment banks, practical/capstone specifications, test-to-teaching audits, credential eligibility and verification logic, exact-version review queues and packets, pilot/calibration/standard-setting evidence contracts, occupational/JTA controls, accessibility controls, public-source provenance tooling, production/security contracts, and fail-closed professional release gates.

## Professional certification status

**Academic publication is not professional credential authorization.**

The professional certification release remains fail-closed until required real evidence is collected, reconciled, and approved for the exact versions in scope. Examples include:

- technical/occupational and assessment review;
- rendered/manual accessibility and learner-UX review;
- controlled pilot execution and item analysis;
- practical/capstone validation and assessor calibration/inter-rater evidence;
- formal standard setting and secure operational form evidence;
- deployed identity, persistence, security, backup/restore, monitoring, signing, revocation, and other production-control evidence;
- final credential-program authorization.

A machine quality pass, source record, owner approval, or generated evidence template must never be represented as pilot results, human review, psychometric evidence, security validation, or another event that did not actually occur.

## Repository responsibilities

This repository owns curriculum source files, competency definitions, learning objectives, evidence/claim records, assessment source objects, practical/capstone definitions, credential definitions, standards mappings, schemas, validation tooling, public API contracts, evidence contracts, and release-gate logic.

It must **not** store learner identities, production assessment attempts or scores, issued credential secrets, private signing keys, production databases, or public-client copies of secure operational assessment answers.

## Current completion workflow

Use `docs/CERTIFICATION-COMPLETION-EXECUTION-PLAN.md` as the project-facing completion sequence.

Useful status commands include:

```bash
npm run certification:inventory
npm run certification:content-readiness
npm run certification:sources:health
npm run finalize:status
npm run certification:release-dependencies
npm run certification:work-queue
```

Run the complete repository quality gate with:

```bash
npm test
```

Run the fail-closed professional release check with:

```bash
npm run release:check
```

## Integration workflow

See `docs/INTEGRATION-WORKFLOW.md` for branch channels, source-of-truth directories, promotion rules, PR gates, release gates, and stale-branch/squash-merge handling.

## Publication and integrity rule

Public academic availability may precede professional credential authorization. Credential-bearing release requires the evidence and production gates defined by the current certification registries. Any change to a scored or reviewed object must follow the repository's versioning and exact-version review rules so stale approvals cannot silently carry forward.
