# Certification Instructional-Depth Audit

**Scope:** the 15 canonical Technician certification courses only  
**Purpose:** distinguish real instructional depth from mere file/package presence.

## Quality model

This audit intentionally does **not** use arbitrary word-count or lesson-count quotas as a proxy for quality.

Instead, each canonical lesson is expected to contain:

- at least one controlled learning objective;
- direct references;
- an instructional overview;
- explanatory content (rich blocks or structured sections);
- applied practice, worked examples, or scenario/application work;
- a summary.

The report also tracks, without making them artificial hard quotas:

- worked examples;
- common mistakes/troubleshooting or misconception handling;
- estimated instructional time;
- lesson/objective counts;
- assessment item count;
- course-derived assessment provenance.

A four-lesson course may be appropriate if those lessons fully teach and practice the controlled objectives. A larger course may be needed where the competency scope requires it. The audit is designed to expose **thin teaching**, not reward page count.

## Assessment boundary

All 15 canonical courses must retain the certification-content boundary:

- conventional finals must be course-derived;
- integrated-lab readiness checks must be course-derived;
- encyclopedia substitution must be forbidden;
- untaught scored material must be forbidden.

The 420-topic Encyclopedia remains a separate science/reference product.

## Commands

Human-readable JSON report:

`npm run certification:instructional-depth`

Fail-closed structural check:

`npm run certification:instructional-depth:check`

## How to use the report

Prioritize a course for content expansion when the report shows one or more of these conditions:

1. a lesson lacks meaningful explanation;
2. a lesson lacks applied practice;
3. an objective is represented only by thin explanatory material;
4. troubleshooting/misconceptions are absent from a domain where error patterns matter;
5. the estimated instructional time is implausibly small for the competency scope;
6. the assessment is broader than the instruction;
7. the learner-support package lacks enough examples, job aids, visuals, or remediation to make the course usable without relying on the Encyclopedia as hidden required instruction.

The audit is a production tool, not a claim of external validation or credential approval.
