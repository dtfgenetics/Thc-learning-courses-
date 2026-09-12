import assert from 'node:assert/strict';
import { createPostgresEnrollmentCompletionStore } from '../apps/api/src/postgres-enrollment-completion-store.mjs';

const calls = [];
const query = async (text, params) => {
  calls.push({ text, params });
  if (text.includes("event_type in ('course-enrollment-academic-completed','course-enrollment-academic-reopened')")) {
    return { rows: [{
      event_type: 'course-enrollment-academic-completed',
      metadata: {
        fromStatus: 'active', toStatus: 'completed', reason: 'academic-requirements-satisfied',
        courseId: 'COURSE-LH-TECH1-001', courseVersion: '1.0.0', previousCompletedAt: null,
        completedAt: '2026-09-21T12:00:00.000Z', academicSnapshot: { completedLessonCount: 18 }
      },
      created_at: '2026-09-21T12:00:01.000Z'
    }] };
  }
  return { rows: [{
    course_id: 'COURSE-LH-TECH1-001', course_version: '1.0.0', status: 'completed',
    enrolled_at: '2026-09-01T12:00:00.000Z', completed_at: '2026-09-21T12:00:00.000Z',
    changed: true, audit_event_id: '42'
  }] };
};

const store = createPostgresEnrollmentCompletionStore({ query });
const saved = await store.setEnrollmentAcademicStatus('subject-learner-1', {
  courseId: 'COURSE-LH-TECH1-001',
  courseVersion: '1.0.0',
  status: 'completed',
  completedAt: '2026-09-21T12:00:00.000Z',
  reason: 'academic-requirements-satisfied',
  academicSnapshot: { requiredLessonCount: 18, completedLessonCount: 18, missingRequirements: [] }
});
assert.equal(saved.changed, true);
assert.equal(saved.auditEventId, 42);
assert.equal(saved.enrollment.status, 'completed');
assert.equal(calls.length, 1);
assert.match(calls[0].text, /for update/i, 'enrollment transition must lock the current row');
assert.match(calls[0].text, /audit_events/i, 'status transition and audit event must share one statement');
assert.match(calls[0].text, /course-enrollment-academic-completed/);
assert.match(calls[0].text, /course-enrollment-academic-reopened/);
assert.match(calls[0].text, /c\.status <> 'withdrawn'/, 'academic automation must not overwrite withdrawal');
assert.equal(calls[0].params[0], 'subject-learner-1');
assert.equal(calls[0].params[1], 'COURSE-LH-TECH1-001');
assert.equal(calls[0].params[2], '1.0.0');
assert.equal(calls[0].params[3], 'completed');
assert.equal(calls[0].text.includes('subject-learner-1'), false, 'subject must be parameterized');
assert.equal(calls[0].text.includes('private notes'), false);

const history = await store.listEnrollmentAcademicHistory('subject-learner-1', { courseId: 'COURSE-LH-TECH1-001' });
assert.equal(history.length, 1);
assert.equal(history[0].fromStatus, 'active');
assert.equal(history[0].toStatus, 'completed');
assert.equal(history[0].academicSnapshot.completedLessonCount, 18);
assert.equal(calls[1].params[0], 'subject-learner-1');
assert.equal(calls[1].params[1], 'COURSE-LH-TECH1-001');
assert.match(calls[1].text, /subject_type = 'learner'/);
assert.match(calls[1].text, /metadata ->> 'courseId' = \$2/);

assert.throws(() => createPostgresEnrollmentCompletionStore(), /requires a query/);
await assert.rejects(
  () => store.setEnrollmentAcademicStatus('subject-learner-1', { courseId: 'COURSE-LH-TECH1-001', courseVersion: '1.0.0', status: 'withdrawn', reason: 'bad' }),
  /must be active or completed/
);

console.log('Audited PostgreSQL academic enrollment completion persistence contract passed.');
