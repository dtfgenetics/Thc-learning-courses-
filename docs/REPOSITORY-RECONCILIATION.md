# Repository Reconciliation Baseline

Date: 2026-09-07

## Purpose

This document defines the current source-of-truth baseline for the THC Learning Courses certification repository and the order of work required to move from active development to a repeatable certification release pipeline.

## Verified baseline

- Canonical repository: `dtfgenetics/Thc-learning-courses-`
- Canonical integration branch: `main`
- Baseline commit at reconciliation start: `0f6bf6e3c3493e9bacb7d521ee86c15409623584`
- The baseline `Curriculum quality gates` workflow is passing.
- The repository already contains curriculum registries, validation scripts, assessment tooling, credential logic, learner/API runtime code, database definitions, operational readiness checks, and web academy code.
- New work must extend the current architecture rather than create parallel registries, duplicate course structures, or replacement certification systems.

## Branch reconciliation finding

PR #211 (`feat/backup-monitoring-readiness`) was evaluated during this reconciliation. Its head is substantially stale relative to current `main`: the histories have diverged, with the PR branch hundreds of commits behind the current baseline. Its failing curriculum quality gate is therefore not evidence that current `main` is broken.

Do not merge stale feature branches solely because individual changes remain desirable. Relevant changes must be re-evaluated against current `main` and transplanted onto a fresh branch only when they still satisfy current validation, security, persistence, and release contracts.

## Release architecture

The canonical education hierarchy is:

`Program -> Certification -> Course -> Module -> Lesson -> Activity -> Assessment -> Credential`

Curriculum definitions belong in version-controlled source/registry files. Learner state, attempts, scores, progress, mastery, and issued credentials belong in runtime persistence.

## Immediate work queue

1. Reconcile stale PRs and branches against current `main`; salvage only still-relevant changes.
2. Verify that the global curriculum registry and schemas represent every published course, module, lesson, assessment, and credential without orphaned or duplicate identifiers.
3. Establish one complete reference certification vertical: THC Cultivation Foundations.
4. Audit Foundations lessons for learning objectives, evidence, activities, assessment coverage, review status, and release status.
5. Close assessment-bank gaps and enforce approval/review records before certification use.
6. Verify enrollment, learner progress, completion, attempt policy, mastery, credential eligibility, issuance, revocation, and public verification end to end.
7. Complete learner-facing and admin-facing release UX after the domain and persistence contracts pass.
8. Require scientific/evidence QA, editorial QA, assessment QA, accessibility QA, automated tests, and production smoke checks before a certification is released.

## Merge discipline

- Start new work from current green `main`.
- Do not create `-v2`, `-v3`, `-temp`, or replacement branches when an active branch can be reconciled cleanly.
- Do not merge a red branch into `main`.
- Prefer a small, reviewable PR for each coherent change set.
- Generated registry output must be reproducible from canonical source objects.
- A release-readiness flag must never substitute for executable evidence that the corresponding gate passes.

## Definition of done for the first certification

THC Cultivation Foundations is release-ready only when all required lessons and activities are published, every required learning objective has approved assessment coverage, the final assessment is generated from an eligible item pool, learner completion and credential eligibility are deterministic and persisted, certificate issuance and public verification pass, evidence/review requirements pass, accessibility checks pass, and the full repository quality gate remains green.
