import {
  synchronizeCourseEnrollmentCompletion,
  coursesContainingLesson,
  courseIdForFinalAssessment,
  courseIdForPerformanceAssessment
} from './course-enrollment-completion-service.mjs';

async function synchronizeSafely({ learnerStore, completionStore, subject, courseIds = [] }) {
  const results = [];
  for (const courseId of [...new Set(courseIds.filter(Boolean))]) {
    results.push(await synchronizeCourseEnrollmentCompletion({ learnerStore, completionStore, subject, courseId }));
  }
  return results;
}

async function withAcademicHistory(completionStore, subject, rows = []) {
  if (typeof completionStore.listEnrollmentAcademicHistory !== 'function') return rows;
  const cache = new Map();
  const projected = [];
  for (const row of rows) {
    if (!cache.has(row.courseId)) cache.set(row.courseId, await completionStore.listEnrollmentAcademicHistory(subject, { courseId: row.courseId }));
    const history = (cache.get(row.courseId) ?? []).filter((event) => String(event.courseVersion) === String(row.courseVersion));
    projected.push({ ...row, academicStatusHistory: history });
  }
  return projected;
}

export function addAutomaticEnrollmentCompletion({ learnerStore, practicalEvaluatorStore, completionStore } = {}) {
  if (!learnerStore || !practicalEvaluatorStore || !completionStore) {
    throw new Error('learner, practical evaluator, and enrollment completion stores are required');
  }

  const wrappedLearnerStore = {
    ...learnerStore,
    async listEnrollments(subject) {
      const current = await learnerStore.listEnrollments(subject);
      await synchronizeSafely({ learnerStore, completionStore, subject, courseIds: current.map((row) => row.courseId) });
      return withAcademicHistory(completionStore, subject, await learnerStore.listEnrollments(subject));
    },
    async enroll(subject, record) {
      const enrollment = await learnerStore.enroll(subject, record);
      await synchronizeSafely({ learnerStore, completionStore, subject, courseIds: [record.courseId] });
      const refreshed = await withAcademicHistory(completionStore, subject, await learnerStore.listEnrollments(subject));
      return refreshed.find((row) => row.courseId === record.courseId && String(row.courseVersion) === String(record.courseVersion)) ?? enrollment;
    },
    async setLessonProgress(subject, record) {
      const saved = await learnerStore.setLessonProgress(subject, record);
      await synchronizeSafely({ learnerStore, completionStore, subject, courseIds: coursesContainingLesson(record.lessonId) });
      return saved;
    },
    async saveAssessmentScore(subject, payload) {
      const saved = await learnerStore.saveAssessmentScore(subject, payload);
      await synchronizeSafely({ learnerStore, completionStore, subject, courseIds: [courseIdForFinalAssessment(saved.assessmentId)] });
      return saved;
    }
  };

  const wrappedPracticalEvaluatorStore = {
    ...practicalEvaluatorStore,
    async saveEvaluation(subject, record) {
      const saved = await practicalEvaluatorStore.saveEvaluation(subject, record);
      await synchronizeSafely({ learnerStore, completionStore, subject, courseIds: [courseIdForPerformanceAssessment(record.assessmentId)] });
      return saved;
    }
  };

  return { learnerStore: wrappedLearnerStore, practicalEvaluatorStore: wrappedPracticalEvaluatorStore };
}
