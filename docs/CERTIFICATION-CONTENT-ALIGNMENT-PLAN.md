# Certification Content Alignment Plan

**Status:** active migration  
**Updated:** 2026-09-22  
**Goal:** align the repository to a dedicated certification-course model without rebuilding the working platform.

## Canonical systems

### 1. THC Plant Science Encyclopedia
- IDs: `THC-ENC-001` through `THC-ENC-420`
- Purpose: encyclopedia-style topics and explanations
- May contain: scientific explanation, key terms, examples, misconceptions, visuals, references, evidence limits, related topics
- Certification role: optional reference/deeper study only
- Never counts as certification instruction, test coverage, course completion, practical evidence, or credential eligibility

### 2. Certification curriculum
- Courses: `COURSE-LH-*`
- Lessons: `LESSON-LH-*`
- Objectives: `LO-LH-*`
- Course assessments: `ASSESS-LH-*`
- Course items: `ITEM-LH-*`
- Practicals/capstones: controlled pathway-specific performance objects

Every certification course is a dedicated teaching package. It must directly teach the objectives its tests assess.

### 3. Credential assessment
Credential-level exams, practical decisions, standard setting, issuance, and verification remain separately governed from course tests.

## Migration rules

1. Do not create new certification material under `THC-C###`, `COURSE-THC-*`, or encyclopedia IDs.
2. Preserve legacy/prototype material for source recovery; retire/supersede it rather than deleting potentially useful work.
3. A legacy course may be migrated only when an actual certification pathway needs that content.
4. Migration means rewriting/wiring the useful material into a dedicated `COURSE-LH-*` package with its own objectives, lessons, practice, tests, and performance mapping.
5. Course tests are built from the course's taught material. Encyclopedia-only or external-reading-only content cannot be scored.
6. Do not count public noncredential courses in certification completion.
7. Do not combine Encyclopedia completion and Certification completion into one percentage.

## Current protected assets

Preserve and improve:
- Technician I `COURSE-LH-TECH1-001` through `007`;
- Technician II `COURSE-LH-TECH2-001` through `008`;
- existing dedicated `LESSON-LH-*`, `LO-LH-*`, `ASSESS-LH-*`, practical and capstone objects;
- learner progress, assessment runtime, course records, practical workflows, credential verification, schemas, QA and deployment tooling;
- production raster visual pipeline.

## Migration backlog

`npm run certification:inventory` is the canonical audit for course classification.

The inventory separates:
- **canonicalCertificationDevelopment** — `COURSE-LH-*`;
- **migrationBacklog** — older credential-bearing course objects outside `COURSE-LH-*`;
- **publicNoncredential** — intentionally noncredential education;
- **retiredLegacy420** — `COURSE-THC-C###` prototypes preserved only for provenance/source recovery.

Migration-backlog objects are not automatically discarded. Their useful science, activities, questions, or practical concepts can be reused only after being deliberately migrated into the appropriate dedicated Learning Hub course.

## Course production sequence

For each certification course:

`pathway -> course purpose -> competencies -> course objectives -> dedicated instruction -> examples -> practice -> scenarios -> visuals/job aids -> formative checks -> course final -> remediation/reassessment -> practical/capstone mapping -> QA -> release`

A course is not considered instructionally complete because files exist or a minimum package contract passes.

## Immediate implementation order

1. Maintain the encyclopedia/certification boundary in CI.
2. Retire active `COURSE-THC-C###` prototypes and mark associated documents archival.
3. Inventory all non-`COURSE-LH-*` credential-bearing objects as migration backlog.
4. Produce a certification-only completion/readiness projection.
5. Audit Technician I Course 2 against Course 1 for instructional depth.
6. Expand Course 2 until every tested objective has sufficient dedicated teaching, practice, visuals and remediation.
7. Re-audit/rewrite Course 2 tests strictly against current course material.
8. Repeat Courses 3-7.
9. Repeat Technician II Courses 1-8.
10. Migrate specialist/advanced prototypes only when their dedicated credential pathway enters production.

## Definition of aligned

The project is aligned when:
- encyclopedia and certification inventories are independently counted;
- all active certification courses use `COURSE-LH-*`;
- all active certification lessons/tests are course-owned;
- no scored certification item depends on untaught encyclopedia-only material;
- legacy/prototype course objects are archived or explicitly queued for migration;
- the certification readiness dashboard reports only certification materials;
- course content depth, not mere file presence, drives the production queue.
