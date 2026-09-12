import { createPersistenceAdapters as createBaseAdapters } from './test-persistence-adapter.mjs';

export async function createPersistenceAdapters(options = {}) {
  const adapters = await createBaseAdapters(options);
  const history = [];
  adapters.enrollmentCompletionStore = {
    kind: 'test-enrollment-completion',
    async setEnrollmentAcademicStatus(subject, { courseId, courseVersion, status, completedAt, reason, academicSnapshot } = {}) {
      history.push({ subject, courseId, courseVersion: String(courseVersion), status, completedAt: completedAt ?? null, reason, academicSnapshot: structuredClone(academicSnapshot ?? {}) });
      return { enrollment: { courseId, courseVersion: String(courseVersion), status, enrolledAt: null, completedAt: status === 'completed' ? (completedAt ?? null) : null }, changed: true, auditEventId: history.length };
    },
    async listEnrollmentAcademicHistory(subject, { courseId } = {}) {
      return history.filter((row) => row.subject === subject && row.courseId === courseId).map((row, index) => ({
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
  };
  return adapters;
}
