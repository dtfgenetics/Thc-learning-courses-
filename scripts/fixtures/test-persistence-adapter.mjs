export async function createPersistenceAdapters() {
  const progress = new Map();
  const enrollments = new Map();
  const attempts = new Map();
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
      async findOpenAssessmentAttempt(subject, { assessmentId } = {}) {
        return [...attempts.values()].find((row) => row.learnerId === subject && row.assessmentId === assessmentId && ['started', 'submitted'].includes(row.status)) ?? null;
      },
      async getAssessmentAttempt(subject, { attemptId } = {}) {
        const row = attempts.get(attemptId);
        return row?.learnerId === subject ? structuredClone(row) : null;
      },
      async createAssessmentAttempt(subject, { attempt } = {}) {
        const stored = structuredClone({ ...attempt, learnerId: subject });
        attempts.set(stored.id, stored);
        return structuredClone(stored);
      },
      async saveAssessmentResponses(subject, { attemptId, responses } = {}) {
        const row = attempts.get(attemptId);
        if (!row || row.learnerId !== subject || row.status !== 'started') throw new Error('assessment-response-write-mismatch');
        for (const response of responses) {
          const item = row.items.find((entry) => entry.itemId === response.itemId && Number(entry.itemVersion) === Number(response.itemVersion));
          if (!item) throw new Error('assessment-response-write-mismatch');
          item.response = structuredClone(response.response);
        }
        return { attemptId, saved: responses.length };
      },
      async saveAssessmentScore(subject, { attempt } = {}) {
        const current = attempts.get(attempt.id);
        if (!current || current.learnerId !== subject || current.status !== 'started') throw new Error('assessment-score-write-conflict');
        const stored = structuredClone({ ...attempt, learnerId: subject });
        attempts.set(stored.id, stored);
        return structuredClone(stored);
      },
      async listCourseEvidence(subject, { assessmentId, performanceAssessmentId = null } = {}) {
        return {
          learnerId: subject,
          assessmentId,
          performanceAssessmentId,
          assessmentAttempts: [...attempts.values()].filter((row) => row.learnerId === subject && row.assessmentId === assessmentId).map((row) => ({
            assessmentId: row.assessmentId,
            assessmentVersion: row.assessmentVersion,
            formId: row.formId,
            status: row.status,
            startedAt: row.startedAt,
            submittedAt: row.submittedAt,
            scoredAt: row.scoredAt,
            scorePercent: row.scorePercent,
            passed: row.passed
          })),
          performanceAssessment: null
        };
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
