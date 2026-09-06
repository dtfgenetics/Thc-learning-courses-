export async function createPersistenceAdapters() {
  const progress = new Map();
  return {
    credentialStore: {
      kind: 'test-persistent',
      async ping() { return true; },
      async schemaVersion() { return '2'; },
      async getByVerificationId() { return null; },
      async count() { return 0; }
    },
    credentialWriter: { kind: 'test-writer' },
    learnerStore: {
      kind: 'test-learner-progress',
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
