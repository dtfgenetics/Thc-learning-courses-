import { createPersistenceAdapters as createBaseAdapters } from './test-persistence-adapter.mjs';

export async function createPersistenceAdapters(options = {}) {
  const adapters = await createBaseAdapters(options);
  const history = [];
  function historyRows() {
    return history.map((row, index) => ({
      learnerSubject: row.subject,
      eventType: row.status === 'completed' ? 'course-enrollment-academic-completed' : 'course-enrollment-academic-reopened',
      fromStatus: row.status === 'completed' ? 'active' : 'completed',
      toStatus: row.status,
      reason: row.reason,
      courseId: row.courseId,
      courseVersion: row.courseVersion,
      previousCompletedAt: null,
      completedAt: row.completedAt,
      academicSnapshot: structuredClone(row.academicSnapshot),
      occurredAt: new Date(1700000000000 + index * 1000).toISOString()
    }));
  }
  adapters.enrollmentCompletionStore = {
    kind: 'test-enrollment-completion',
    async setEnrollmentAcademicStatus(subject, { courseId, courseVersion, status, completedAt, reason, academicSnapshot } = {}) {
      history.push({ subject, courseId, courseVersion: String(courseVersion), status, completedAt: completedAt ?? null, reason, academicSnapshot: structuredClone(academicSnapshot ?? {}) });
      return { enrollment: { courseId, courseVersion: String(courseVersion), status, enrolledAt: null, completedAt: status === 'completed' ? (completedAt ?? null) : null }, changed: true, auditEventId: history.length };
    },
    async listEnrollmentAcademicHistory(subject, { courseId } = {}) {
      return historyRows().filter((row) => row.learnerSubject === subject && row.courseId === courseId).map(({ learnerSubject, ...row }) => row);
    },
    async listCourseAcademicHistory(courseId) {
      return historyRows().filter((row) => row.courseId === courseId);
    }
  };
  return adapters;
}
