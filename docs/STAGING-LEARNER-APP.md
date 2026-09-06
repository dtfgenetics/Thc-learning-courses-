# THC Academy staging learner app

The staging learner app provides a usable read-only Academy surface before production credential issuance is enabled.

## Run locally

```bash
npm ci
npm run academy:dev
```

Open `http://localhost:4173/academy`.

Development mode shows draft curriculum as a clearly labeled **Staging preview** so scientific/editorial reviewers and product testers can evaluate navigation and lesson presentation before publication.

To test published-only behavior locally:

```bash
ACADEMY_PREVIEW_DRAFTS=0 npm run academy:dev
```

In `NODE_ENV=production`, draft preview is disabled regardless of `ACADEMY_PREVIEW_DRAFTS`.

## Public surface

The staging server exposes only:

- `/academy` and `/` — learner interface
- `/healthz` — service health
- `/api/catalog` — course/module/lesson navigation metadata
- `/api/lessons/:lessonId` — lesson learning content

Question-bank files, correct answers, scoring keys, credential internals, review records, pilot evidence, and admin/runtime data are not loaded into the learner API.

## Release boundary

This application makes the curriculum usable for staging, review, demonstration, and learner UX testing. It does **not** bypass production gates. A course must still complete scientific/editorial review, assessment review, pilot evidence, item activation, accessibility verification, persistence/auth/security requirements, and its explicit production release scope before it can be represented as production-certified content.

## Validation

`npm run academy:web:test` verifies:

- the server boots and reports staging mode;
- the Academy shell is served with security headers;
- a non-empty staging catalog can be built from repository content;
- lesson content can be loaded;
- assessment/question mappings are not exposed;
- traversal-style lesson requests fail closed.

The test is part of the repository-wide `npm test` quality gate.
