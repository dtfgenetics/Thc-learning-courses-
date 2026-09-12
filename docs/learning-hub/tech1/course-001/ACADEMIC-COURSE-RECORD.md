# Course 1 Academic Course Record

## Purpose

The Course 1 academic course record gives an authenticated learner one coherent view of their instructional and course-assessment history for `COURSE-LH-TECH1-001` — **Safety, Responsible Practice & Cultivation Workflows**.

It is an academic learning record. It is **not** a professional credential, license, certification, credential-eligibility decision, or substitute for the separate THC Cultivation Technician credential system.

Course 1 remains public academic content. Authentication is required only for the learner-specific record described here.

## Record sources

The learner-facing record is derived from existing authoritative Academy records rather than stored as a second progress system:

- the published Academy catalog for the current Course 1/module/lesson structure;
- authenticated lesson-progress records from `/api/v1/me/progress`;
- authenticated enrollment/version and academic-transition history from `/api/v1/me/enrollments`;
- authenticated public-course final and course-practical evidence from `/api/v1/me/courses/COURSE-LH-TECH1-001/evidence`.

The rendered record can therefore be regenerated from the controlled curriculum plus the learner's existing records.

## Academic completion model

Course 1 academic completion is derived only when all three course-level requirements are satisfied:

1. every canonical Course 1 lesson ID has at least one authoritative `completed` progress record;
2. the public Course 1 final assessment has a recorded passing outcome;
3. the Course 1 practical has a recorded `passed` outcome with no disqualifying critical errors.

This derived academic status does not issue, imply, or modify a professional credential.

## Enrollment completion synchronization

The current Course 1 enrollment record is synchronized to that same academic model instead of maintaining a second, unrelated completion decision.

- When all three academic requirements are satisfied, an `active` Course 1 enrollment becomes `completed` and receives a completion timestamp derived from the latest required academic evidence.
- If a completed enrollment no longer satisfies the current canonical academic requirements, it returns to `active` and its current `completed_at` value is cleared.
- A later return to completion records a new completion timestamp from the evidence that restored the requirements.
- An administrative `withdrawn` enrollment is never changed by academic automation.
- Reconciliation is idempotent: reading or recalculating an already-correct status does not create duplicate transition events.

Synchronization runs after enrollment, lesson-progress writes, course-final scoring and practical-evaluation writes. It also runs when authenticated enrollment state is read. Read-time reconciliation is how a published curriculum change can reopen a requirement without waiting for the learner to submit some unrelated new record.

Every real `active → completed` or `completed → active` transition writes an immutable `audit_events` entry. The event stores only the previous/current enrollment state, reason, course/version and a minimal academic-requirements snapshot. It does not store learner assessment responses, private evaluator notes, practical evidence references, or credential decisions.

The learner enrollment projection includes version-matched `academicStatusHistory` so a sequence such as **Completed → Reopened → Completed** can be shown without overwriting prior transitions.

## Academic completion transition timeline

The Course Record renders the learner-safe enrollment transition history as its own timeline/table.

Each learner-visible transition may show:

- whether the event completed or reopened academic requirements;
- course version;
- prior and resulting enrollment state;
- event timestamp;
- the minimal academic snapshot recorded with the event: completed/required lesson count, public course-final status, practical status and practical critical-error count.

The transition timeline is chronological and historical. A learner who is currently complete may still have a previous reopening event, and that history remains visible after the requirements are satisfied again.

The timeline is academic enrollment history only. It is not a credential-status history and does not contain credential issuance, revocation, renewal or eligibility decisions.

## Lesson version preservation

Course content remains continuously editable. A later lesson revision must not erase valid historical completion evidence.

For each canonical lesson, the record preserves:

- whether the learner has a completed record for that lesson ID;
- the version associated with the latest recorded completion;
- the completion timestamp;
- all lesson versions represented in the learner's progress history.

Academic completion is therefore associated with the canonical lesson identity while preserving the actual version history. Updating a lesson from, for example, `1.2.0` to a later version does not automatically revoke a previously recorded completion.

Adding a new canonical lesson is different from revising an already-completed lesson identity: the new lesson becomes a current academic requirement and may reopen the current Course 1 enrollment until that requirement is satisfied. This preserves historical completion evidence without pretending the learner has completed newly added work.

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

Course enrollment records are displayed separately from lesson progress. The learner may see each recorded Course 1 enrollment version, enrollment state, enrollment date and any current enrollment completion timestamp. The separate academic transition timeline preserves prior completion/reopen events even when the current row has returned to `active`.

This is historical context, not a rule that prevents content from being edited or expanded.

## Learner interface

The Academy `Course Record` surface includes:

- overall academic Course 1 status;
- completed lesson count;
- public course-final status;
- practical status and follow-up;
- expandable module/lesson completion history;
- recorded lesson version/date information;
- chronological academic completion/reopen transition history;
- minimal requirement snapshot for each transition;
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
- audit actor identity or unrelated audit events;
- credential-exam secure material;
- credential signing or issuance records unrelated to this academic course view.

Academic enrollment audit snapshots are intentionally minimal and must remain separate from professional credential audit/issuance records.

## Extensibility

This record does not create a content ceiling. Course modules, lessons, supporting materials, assessments and instructional design may continue to be added, revised, reorganized or replaced.

The record should follow the current canonical Course 1 structure while preserving historical learner evidence by stable object identity, recorded versions and audited enrollment-state transitions. Quality gates should protect privacy, data integrity and semantic correctness rather than freeze the course at today's lesson count or version set.
