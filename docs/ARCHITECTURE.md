# THC Academy Architecture

## Purpose

This repository is the version-controlled source of truth for curriculum, competencies, assessments, credential definitions, standards mappings, validation rules, and build tooling for the THC Academy.

Runtime learner data does not belong in Git. Learner identities, enrollments, progress, assessment attempts, scores, issued credentials, and audit events must live in a transactional application database.

## Core model

Scientific evidence -> claims -> competencies -> learning objectives -> lessons -> assessments -> demonstrated mastery -> credentials.

## Boundaries

- `content/` stores reviewed curriculum source objects.
- `schemas/` defines machine-validatable contracts.
- `scripts/` validates referential integrity and publishing rules.
- `docs/` records governance, standards mappings, and operating rules.
- Future `apps/` will contain learner, admin, verifier, and API applications.
- Future `packages/` will contain domain, curriculum, assessment, credential, search, media, analytics, auth, and validation libraries.
- Future `database/` will contain migrations and row-level policies, but never real learner data.

## Lifecycle

Content states: `draft -> review -> approved -> published -> superseded -> retired`.

Credential-bearing material must be approved before publication. Published curriculum versions are immutable. Corrections require a new semantic version.

## Security principles

- Never expose secure answer keys to the browser bundle.
- Score summative and credential assessments server-side.
- Never store secrets or signing keys in this repository.
- Use least-privilege roles and append-only audit events for sensitive actions.
- Separate staging issuer identities and signing keys from production.

## Accessibility

Target WCAG 2.2 AA. All instructional media needs alt text or an equivalent accessible representation. Assessment accommodations must be policy-driven rather than implemented by duplicating tests.
