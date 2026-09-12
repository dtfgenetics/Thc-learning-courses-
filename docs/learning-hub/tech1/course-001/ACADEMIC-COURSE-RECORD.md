# Course 1 Academic Course Record

## Purpose

The Course 1 academic course record gives an authenticated learner one coherent view of their instructional and course-assessment history for `COURSE-LH-TECH1-001` — **Safety, Responsible Practice & Cultivation Workflows**.

It is an academic learning record. It is **not** a professional credential, license, certification, credential-eligibility decision, or substitute for the separate THC Cultivation Technician credential system.

Course 1 remains public academic content. Authentication is required only for the learner-specific record described here.

## Record sources

The learner-facing record is derived from existing authoritative Academy records rather than stored as a second progress system:

- the published Academy catalog for the current Course 1/module/lesson structure;
- authenticated lesson-progress records from `/api/v1/me/progress`;
- authenticated enrollment/version history from `/api/v1/me/enrollments`;
- authenticated public-course final and course-practical evidence from `/api/v1/me/courses/COURSE-LH-TECH1-001/evidence`.

The rendered record can therefore be regenerated from the controlled curriculum plus the learner's existing records.

## Academic completion model

Course 1 academic completion is derived only when all three course-level requirements are satisfied:

1. every canonical Course 1 lesson ID has at least one authoritative `completed` progress record;
2. the public Course 1 final assessment has a recorded passing outcome;
3. the Course 1 practical has a recorded `passed` outcome with no disqualifying critical errors.

This derived academic status does not issue, imply, or modify a professional credential.

## Lesson version preservation

Course content remains continuously editable. A later lesson revision must not erase valid historical completion evidence.

For each canonical lesson, the record preserves:

- whether the learner has a completed record for that lesson ID;
- the version associated with the latest recorded completion;
- the completion timestamp;
- all lesson versions represented in the learner's progress history.

Academic completion is therefore associated with the canonical lesson identity while preserving the actual version history. Updating a lesson from, for example, `1.2.0` to a later version does not automatically revoke a previously recorded completion.

The authoritative progress API accepts the numeric semantic lesson-version format used by Course 1, including versions such as `1.2.0`.

## Assessment record

The course record keeps the public course final and the performance practical distinct.

### Course final

The record may show:

- final-assessment identity/title;
- current outcome (`passed`, `not-passed`, `in-progress`, or `not-attempted`);
- attempt count;
- best recorded percentage;
- configured passing percentage;
- latest start/scoring timestamps.

It does not expose correct answers, answer keys, scoring keys, rationales prohibited by the assessment feedback policy, or secure credential-exam material.

### Course practical

The current learner-safe practical record may show:

- practical identity;
- status;
- recorded percentage;
- critical-error count;
- evaluation/update dates;
- controlled follow-up/remediation state;
- reassessment target date;
- learner-facing assessor feedback.

Learner-safe prior practical revisions/reassessment records may contain only status, score, critical-error count, evaluation date, follow-up state, target date, and learner-facing feedback.

They must not expose evaluator identity, private evaluator notes, domain-score evidence, evidence-output locators, attachment references, audit metadata, or other evaluator-private evidence.

## Course-version history

Course enrollment records are displayed separately from lesson progress. The learner may see each recorded Course 1 enrollment version, enrollment state, enrollment date and any recorded enrollment completion timestamp.

This is historical context, not a rule that prevents content from being edited or expanded.

## Learner interface

The Academy `Course Record` surface includes:

- overall academic Course 1 status;
- completed lesson count;
- public course-final status;
- practical status and follow-up;
- expandable module/lesson completion history;
- recorded lesson version/date information;
- course-version enrollment history;
- a print-friendly rendering.

Printing is a learner convenience. A printed page is not a cryptographically verifiable professional credential.

## Privacy boundary

The course record is private to the authenticated learner. It must not expose:

- evaluator identity;
- evaluator assignment data;
- private evaluator notes;
- detailed practical evidence references;
- assessment answer keys or raw response payloads;
- credential-exam secure material;
- credential signing or issuance records unrelated to this academic course view.

## Extensibility

This record does not create a content ceiling. Course modules, lessons, supporting materials, assessments and instructional design may continue to be added, revised, reorganized or replaced.

The record should follow the current canonical Course 1 structure while preserving historical learner evidence by stable object identity and recorded versions. Quality gates should protect privacy, data integrity and semantic correctness rather than freeze the course at today's lesson count or version set.
