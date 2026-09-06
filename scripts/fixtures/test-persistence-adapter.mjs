export async function createPersistenceAdapters() {
  const progress = new Map();
  const enrollments = new Map();
  return {
    credentialStore: {
      kind: 'test-persistent',
      async ping() { return true; },
      async schemaVersion() { return '4'; },
      async getByVerificationId() { return null; },
      async listStatusHistoryByVerificationId() { return []; },
      async count() { return 0; }
    },
    credentialWriter: {
      kind: 'test-writer',
      async transitionById(credentialId, nextStatus, options = {}) {
        return { credential: { id: credentialId, status: nextStatus }, event: { credentialId, status: nextStatus, actorId: options.actorId ?? null, reason: options.reason ?? null } };
      }
    },
    learnerStore: {
      kind: 'test-learner-runtime',
      async listEnrollments(subject) { return [...(enrollments.get(subject) ?? [])]; },
      async enroll(subject, record) {
        const rows = enrollments.get(subject) ?? [];
        const existing = rows.find((row) => row.courseId === record.courseId && String(row.courseVersion) === String(record.courseVersion));
        if (existing) return existing;
        const stored = {
          courseId: record.courseId,
          courseVersion: String(record.courseVersion),
          status: 'active',
          enrolledAt: '2026-09-06T13:00:00.000Z',
          completedAt: null
        };
        rows.push(stored);
        enrollments.set(subject, rows);
        return stored;
      },
      async listProgress(subject) { return [...(progress.get(subject) ?? [])]; },
      async setLessonProgress(subject, record) {
        const rows = progress.get(subject) ?? [];
        const next = rows.filter((row) => !(row.lessonId === record.lessonId && String(row.lessonVersion) === String(record.lessonVersion)));
        const stored = {
          lessonId: record.lessonId,
          lessonVersion: String(record.lessonVersion),
          status: record.status,
          completedAt: record.status === 'completed' ? (record.completedAt ?? new Date().toISOString()) : null
        };
        next.push(stored);
        progress.set(subject, next);
        return stored;
      },
      async listCredentialEvidence(subject, { credentialDefinitionId } = {}) {
        return {
          learnerId: subject,
          credentialDefinitionId,
          assessmentAttempts: [],
          assessments: [],
          competencies: [],
          performanceAssessments: [],
          portfolioArtifacts: []
        };
      }
    }
  };
}
