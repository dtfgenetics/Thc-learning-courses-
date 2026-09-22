# AI Content Authoring Guide

This is the entry point for ChatGPT, Codex, and other contributors adding or editing THC Academy material. Preserve useful existing work and extend the canonical graph; do not create a parallel curriculum.

## 1. Establish current state

1. Read `AGENTS.md` and `skills/thc-academy-builder/SKILL.md`.
2. Run `git status --short` and identify the active branch and uncommitted work.
3. Read `docs/CERTIFICATION-COMPLETION-MATRIX.md` and the nearest course/package manifest.
4. Search by topic and intended ID across `content/`, `registry/`, `docs/`, and `apps/` before creating anything.
5. Classify the work as reuse, revision, missing content, or integration/QA.

Never overwrite or discard unrelated work in a dirty tree. Never mark human review, pilot evidence, accreditation, certification authorization, or production readiness complete without its required evidence record.

## 2. Put material in the correct source directory

| Material | Canonical location | Notes |
| --- | --- | --- |
| Competency | `content/competencies/` | Measurable capability, stable `COMP-*` ID |
| Objective | `content/learning-objectives/` | Maps to a competency, stable `LO-*` ID |
| Lesson | `content/lessons/` | Maps to objectives, competencies, and references |
| Module/course/program | `content/modules/`, `content/courses/`, `content/programs/` | Composition objects; reference IDs rather than copying content |
| Question/assessment | `content/questions/`, `content/assessments/` | Keep answer keys server-side; draft items are not certification-authorized |
| Practical | `content/performance-assessments/` | Include observable criteria, records, critical errors, and role boundaries |
| Evidence | `content/references/`, `content/claims/` | Do not convert uncertain claims into universal rules |
| 420 Encyclopedia entry | Standalone `dtfgenetics/Thc` encyclopedia (`THC-ENC-001`–`THC-ENC-420`) | Separate from certification; reference-only and cannot satisfy course/test requirements |
| Learner worksheet/log/job aid | `content/downloads/` and `apps/web/public/downloads/` | Metadata and file must agree; draft files are preview-only |
| Human approval | `content/reviews/` | Immutable evidence record; never fabricate approval |
| Runtime/API/UI | `apps/`, `openapi/` | Add a deterministic test for every public contract change |

## 3. Certification Course and Test authoring boundary

A Certification Course is a dedicated instructional product. Required knowledge for every scored objective must be taught directly in that course's own lessons, examples, practice, scenarios, visuals, and remediation.

A Certification Course Test is also dedicated. Build its blueprint and items only from the exact current course objectives and material actually taught or practiced in that course.

Do not:
- count a 420 Encyclopedia entry as a Certification Course lesson;
- use a 420 Encyclopedia entry to satisfy a course objective;
- generate required test items from encyclopedia-only content;
- let another Certification Course's lesson satisfy this course's test blueprint;
- count optional references toward course completion.

The Encyclopedia may be linked as optional background or deeper reading only.

## 4. Wire a certification course slice in dependency order

Use this order so every reference can resolve:

`reference/claim -> competency -> objective -> lesson -> question -> assessment -> module -> course -> program/credential`

For an existing course, reuse its IDs and increment semantic versions when behavior or learner content changes. A course final must use a dedicated item bank, map to the course objectives/competencies, and remain noncredential or `not-authorized` until the credential gates are actually satisfied.

## 5. Status and publication rules

- New machine-authored content starts as `draft` unless a schema requires `planned`.
- `published`, `approved`, `active`, or certification-authorized states require the repository's documented evidence and release path.
- Public academic visibility is separate from credential authorization.
- Do not put learner PII, production attempts, private keys, signing secrets, or secure operational exam banks in Git or public API payloads.
- SOPs must identify scope, owner/role, prerequisites, ordered procedure, records, exceptions/escalation, version, and effective-state boundary. A training example is not an approved site SOP.

## 6. Downloads and printable tools

Create one JSON record per file in `content/downloads/` using `schemas/download.schema.json`. Store the file in `apps/web/public/downloads/` and use a controlled `/downloads/<filename>` path. Map the tool to at least one course or resource when applicable. CSV templates must have a header row and no formulas, macros, learner data, or embedded secrets.

The staging API is `GET /api/downloads`; `GET /api/downloads/:id` returns one safe metadata record. Production exposes only records whose status is `published` and whose release status is `public`.

## 7. Required checks

After content or data work, run:

```bash
npm run schema:validate
npm run validate
npm run registry:build
npm run registry:validate
```

Also run the closest focused test. For learner downloads, run `npm run downloads:test`. For course/test/catalog changes, run `npm run academy:web:test`, the course-specific test, and the relevant credential coverage report. Use deterministic Node checks for DTFSeeds QA; do not add Playwright as a release requirement.

## 8. Completion handoff

Report changed object IDs, status boundaries, registry changes, tests run, known human gates, and the next machine-actionable gap. Do not report the system as production-ready while `npm run status:json` or `npm run production:readiness` says otherwise.
