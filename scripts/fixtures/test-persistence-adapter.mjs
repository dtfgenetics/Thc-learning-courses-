export async function createPersistenceAdapters() {
  const progress = new Map();
  const enrollments = new Map();
  const attempts = new Map();
  const practicalResults = new Map();
  const assignments = new Map();

  function assignmentKey(subject, courseId, assessmentId, assessmentVersion) {
    return `${subject}:${courseId}:${assessmentId}:${assessmentVersion}`;
  }
  function queueRows(courseId, assessmentId, assessmentVersion) {
    const rows = [];
    for (const [subject, subjectEnrollments] of enrollments) {
      const enrollment = subjectEnrollments.find((row) => row.courseId === courseId);
      if (!enrollment) continue;
      const practical = practicalResults.get(`${subject}:${assessmentId}:${assessmentVersion}`) ?? null;
      const assignment = assignments.get(assignmentKey(subject, courseId, assessmentId, assessmentVersion)) ?? null;
      rows.push({
        learnerSubject: subject,
        enrollmentStatus: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        practicalStatus: practical?.status ?? 'not-recorded',
        scorePercent: practical?.scorePercent ?? null,
        criticalErrorCount: practical?.criticalErrorCount ?? 0,
        followUpStatus: practical?.evidence?.followUpStatus ?? 'none',
        reassessmentTargetDate: practical?.evidence?.reassessmentTargetDate ?? '',
        assignedEvaluatorId: assignment?.evaluatorId ?? null,
        assignedBy: assignment?.assignedBy ?? null,
        assignedAt: assignment?.assignedAt ?? null,
        evaluatedAt: practical?.evaluatedAt ?? null,
        updatedAt: practical?.updatedAt ?? null
      });
    }
    return rows;
  }

  return {
    credentialStore: {
      kind: 'test-persistent',
      async ping() { return true; },
      async schemaVersion() { return '3'; },
      async getByVerificationId() { return null; },
      async count() { return 0; }
    },
    credentialWriter: { kind: 'test-writer' },
    practicalEvaluatorStore: {
      kind: 'test-practical-evaluator',
      async listCourseLearners({ courseId, assessmentId, assessmentVersion, search = '', practicalStatus = '', assignmentFilter = '', evaluatorId = '', page = 1, pageSize = 25 } = {}) {
        let rows = queueRows(courseId, assessmentId, assessmentVersion);
        if (search) rows = rows.filter((row) => row.learnerSubject.includes(search));
        if (practicalStatus) rows = rows.filter((row) => row.practicalStatus === practicalStatus);
        if (assignmentFilter === 'mine') rows = rows.filter((row) => row.assignedEvaluatorId === evaluatorId);
        if (assignmentFilter === 'assigned') rows = rows.filter((row) => row.assignedEvaluatorId);
        if (assignmentFilter === 'unassigned') rows = rows.filter((row) => !row.assignedEvaluatorId);
        const total = rows.length;
        const start = (page - 1) * pageSize;
        return { items: rows.slice(start, start + pageSize), page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
      },
      async listCourseReportRows({ courseId, assessmentId, assessmentVersion } = {}) {
        return queueRows(courseId, assessmentId, assessmentVersion);
      },
      async getEvaluation(subject, { courseId = 'COURSE-LH-TECH1-001', assessmentId, assessmentVersion } = {}) {
        const key = `${subject}:${assessmentId}:${assessmentVersion}`;
        return {
          learnerExists: true,
          evaluation: practicalResults.get(key) ? structuredClone(practicalResults.get(key)) : null,
          assignment: structuredClone(assignments.get(assignmentKey(subject, courseId, assessmentId, assessmentVersion)) ?? null)
        };
      },
      async claimEvaluator(subject, { courseId, assessmentId, assessmentVersion, evaluatorId, assignedBy = evaluatorId } = {}) {
        const key = assignmentKey(subject, courseId, assessmentId, assessmentVersion);
        const current = assignments.get(key);
        if (current && current.evaluatorId !== evaluatorId) return { learnerExists: true, conflict: true, assignment: null };
        const stored = { evaluatorId, assignedBy, assignedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        assignments.set(key, stored);
        return { learnerExists: true, conflict: false, assignment: structuredClone(stored) };
      },
      async setEvaluatorAssignment(subject, { courseId, assessmentId, assessmentVersion, evaluatorId, assignedBy } = {}) {
        const key = assignmentKey(subject, courseId, assessmentId, assessmentVersion);
        if (!evaluatorId) {
          assignments.delete(key);
          return { learnerExists: true, assignment: null };
        }
        const stored = { evaluatorId, assignedBy, assignedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        assignments.set(key, stored);
        return { learnerExists: true, assignment: structuredClone(stored) };
      },
      async releaseEvaluator(subject, { courseId, assessmentId, assessmentVersion, evaluatorId } = {}) {
        const key = assignmentKey(subject, courseId, assessmentId, assessmentVersion);
        const current = assignments.get(key);
        if (!current || current.evaluatorId !== evaluatorId) return { learnerExists: true, released: false };
        assignments.delete(key);
        return { learnerExists: true, released: true };
      },
      async saveEvaluation(subject, record = {}) {
        const key = `${subject}:${record.assessmentId}:${record.assessmentVersion}`;
        const stored = structuredClone({ ...record, updatedAt: new Date().toISOString() });
        practicalResults.set(key, stored);
        return { learnerExists: true, evaluation: structuredClone(stored) };
      }
    },
    learnerStore: {
      kind: 'test-learner-runtime',
      async listEnrollments(subject) { return [...(enrollments.get(subject) ?? [])]; },
      async enroll(subject, record) {
        const rows = enrollments.get(subject) ?? [];
        const existing = rows.find((row) => row.courseId === record.courseId && String(row.courseVersion) === String(record.courseVersion));
        if (existing) return existing;
        const stored = { courseId: record.courseId, courseVersion: String(record.courseVersion), status: 'active', enrolledAt: '2026-09-06T13:00:00.000Z', completedAt: null };
        rows.push(stored);
        enrollments.set(subject, rows);
        return stored;
      },
      async listProgress(subject) { return [...(progress.get(subject) ?? [])]; },
      async setLessonProgress(subject, record) {
        const rows = progress.get(subject) ?? [];
        const next = rows.filter((row) => !(row.lessonId === record.lessonId && String(row.lessonVersion) === String(record.lessonVersion)));
        const stored = { lessonId: record.lessonId, lessonVersion: String(record.lessonVersion), status: record.status, completedAt: record.status === 'completed' ? (record.completedAt ?? new Date().toISOString()) : null };
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
        const practicalKey = performanceAssessmentId ? `${subject}:${performanceAssessmentId}:1.0.0` : null;
        const practical = practicalKey ? practicalResults.get(practicalKey) : null;
        return {
          learnerId: subject,
          assessmentId,
          performanceAssessmentId,
          assessmentAttempts: [...attempts.values()].filter((row) => row.learnerId === subject && row.assessmentId === assessmentId).map((row) => ({
            assessmentId: row.assessmentId, assessmentVersion: row.assessmentVersion, formId: row.formId, status: row.status,
            startedAt: row.startedAt, submittedAt: row.submittedAt, scoredAt: row.scoredAt, scorePercent: row.scorePercent, passed: row.passed
          })),
          performanceAssessment: practical ? {
            assessmentId: practical.assessmentId, assessmentVersion: practical.assessmentVersion, status: practical.status,
            scorePercent: practical.scorePercent, criticalErrorCount: practical.criticalErrorCount, evaluatedAt: practical.evaluatedAt, updatedAt: practical.updatedAt
          } : null
        };
      },
      async listCredentialEvidence(subject, { credentialDefinitionId } = {}) {
        return { learnerId: subject, credentialDefinitionId, assessmentAttempts: [], assessments: [], competencies: [], performanceAssessments: [], portfolioArtifacts: [] };
      }
    }
  };
}
