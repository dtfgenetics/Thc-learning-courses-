import assert from 'node:assert/strict';
import {
  loadCourseAcademicCompletionBundle,
  evaluateCourseAcademicCompletion,
  synchronizeCourseEnrollmentCompletion
} from '../apps/api/src/course-enrollment-completion-service.mjs';
import { addAutomaticEnrollmentCompletion } from '../apps/api/src/enrollment-completion-adapter.mjs';

const COURSE_ID = 'COURSE-LH-TECH1-001';
const bundle = loadCourseAcademicCompletionBundle(COURSE_ID);
assert.ok(bundle, 'Course 1 completion bundle should resolve');
assert.equal(bundle.lessons.length, 18);

const lessonProgress = bundle.lessons.map((lesson, index) => ({
  lessonId: lesson.id,
  lessonVersion: String(lesson.version),
  status: 'completed',
  completedAt: `2026-09-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`
}));
const evidence = {
  assessmentAttempts: [{
    assessmentId: bundle.assessment.id,
    assessmentVersion: String(bundle.assessment.version),
    status: 'scored',
    passed: true,
    scoredAt: '2026-09-20T12:00:00.000Z'
  }],
  performanceAssessment: {
    assessmentId: bundle.performanceAssessmentId,
    assessmentVersion: '1.0.0',
    status: 'passed',
    criticalErrorCount: 0,
    evaluatedAt: '2026-09-21T12:00:00.000Z'
  }
};

let academic = evaluateCourseAcademicCompletion({ bundle, progress: lessonProgress, evidence });
assert.equal(academic.complete, true);
assert.equal(academic.desiredEnrollmentStatus, 'completed');
assert.equal(academic.requirementCompletedAt, '2026-09-21T12:00:00.000Z');
assert.deepEqual(academic.missingRequirements, []);
assert.equal(academic.snapshot.completedLessonCount, 18);

const evolvedBundle = { ...bundle, lessons: [...bundle.lessons, { id: 'LESSON-LH-TECH1-001-NEW', version: '1.0.0' }] };
academic = evaluateCourseAcademicCompletion({ bundle: evolvedBundle, progress: lessonProgress, evidence });
assert.equal(academic.complete, false, 'adding a new canonical lesson should reopen academic requirements until completed');
assert.deepEqual(academic.missingRequirements, ['instruction']);

const subject = 'learner-course1-sync';
let enrollment = {
  courseId: COURSE_ID,
  courseVersion: String(bundle.course.version),
  status: 'active',
  enrolledAt: '2026-09-01T12:00:00.000Z',
  completedAt: null
};
let currentProgress = structuredClone(lessonProgress);
let currentEvidence = structuredClone(evidence);
const history = [];
const rawLearnerStore = {
  kind: 'memory-completion-test-learner',
  async listEnrollments() { return [structuredClone(enrollment)]; },
  async enroll() { return structuredClone(enrollment); },
  async listProgress() { return structuredClone(currentProgress); },
  async setLessonProgress(_subject, record) {
    currentProgress = currentProgress.filter((row) => !(row.lessonId === record.lessonId && String(row.lessonVersion) === String(record.lessonVersion)));
    currentProgress.push({ ...record, completedAt: record.status === 'completed' ? '2026-09-22T12:00:00.000Z' : null });
    return structuredClone(record);
  },
  async listCourseEvidence() { return structuredClone(currentEvidence); },
  async saveAssessmentScore(_subject, { attempt }) { return structuredClone(attempt); }
};
const completionStore = {
  kind: 'memory-enrollment-completion',
  async setEnrollmentAcademicStatus(_subject, input) {
    if (enrollment.status === 'withdrawn') return { enrollment: structuredClone(enrollment), changed: false };
    const changed = enrollment.status !== input.status || (input.status === 'completed' && !enrollment.completedAt);
    if (changed) {
      const previousStatus = enrollment.status;
      const previousCompletedAt = enrollment.completedAt;
      enrollment = {
        ...enrollment,
        status: input.status,
        completedAt: input.status === 'completed' ? (enrollment.completedAt ?? input.completedAt) : null
      };
      history.push({
        eventType: input.status === 'completed' ? 'course-enrollment-academic-completed' : 'course-enrollment-academic-reopened',
        fromStatus: previousStatus,
        toStatus: input.status,
        reason: input.reason,
        courseId: input.courseId,
        courseVersion: input.courseVersion,
        previousCompletedAt,
        completedAt: enrollment.completedAt,
        academicSnapshot: structuredClone(input.academicSnapshot),
        occurredAt: `2026-09-${String(history.length + 22).padStart(2, '0')}T12:00:00.000Z`
      });
    }
    return { enrollment: structuredClone(enrollment), changed, auditEventId: changed ? history.length : null };
  },
  async listEnrollmentAcademicHistory() { return structuredClone(history); }
};
const practicalEvaluatorStore = {
  kind: 'memory-practical',
  async saveEvaluation(_subject, record) {
    currentEvidence.performanceAssessment = {
      assessmentId: record.assessmentId,
      assessmentVersion: record.assessmentVersion,
      status: record.status,
      scorePercent: record.scorePercent,
      criticalErrorCount: record.criticalErrorCount,
      evaluatedAt: record.evaluatedAt,
      updatedAt: record.evaluatedAt
    };
    return { learnerExists: true, evaluation: structuredClone(record) };
  }
};

let sync = await synchronizeCourseEnrollmentCompletion({ learnerStore: rawLearnerStore, completionStore, subject, courseId: COURSE_ID });
assert.equal(sync.changed, true);
assert.equal(sync.enrollment.status, 'completed');
assert.equal(sync.enrollment.completedAt, '2026-09-21T12:00:00.000Z');
assert.equal(history.length, 1);
assert.equal(history[0].eventType, 'course-enrollment-academic-completed');
assert.equal(history[0].academicSnapshot.requiredLessonCount, 18);

sync = await synchronizeCourseEnrollmentCompletion({ learnerStore: rawLearnerStore, completionStore, subject, courseId: COURSE_ID });
assert.equal(sync.changed, false, 'reconciliation should be idempotent');
assert.equal(history.length, 1, 'idempotent reconciliation must not duplicate audit history');

const wrapped = addAutomaticEnrollmentCompletion({ learnerStore: rawLearnerStore, practicalEvaluatorStore, completionStore });
currentProgress = currentProgress.filter((row) => row.lessonId !== bundle.lessons[0].id);
let rows = await wrapped.learnerStore.listEnrollments(subject);
assert.equal(rows[0].status, 'active', 'reading enrollment state should reconcile requirements that have reopened');
assert.equal(rows[0].completedAt, null);
assert.equal(rows[0].academicStatusHistory.length, 2);
assert.equal(rows[0].academicStatusHistory.at(-1).eventType, 'course-enrollment-academic-reopened');
assert.equal(history.at(-1).academicSnapshot.completedLessonCount, 17);

await wrapped.learnerStore.setLessonProgress(subject, {
  lessonId: bundle.lessons[0].id,
  lessonVersion: String(bundle.lessons[0].version),
  status: 'completed'
});
rows = await wrapped.learnerStore.listEnrollments(subject);
assert.equal(rows[0].status, 'completed', 'lesson completion should automatically restore academic enrollment completion');
assert.ok(rows[0].completedAt);
assert.equal(rows[0].academicStatusHistory.length, 3);

const completedBeforeWithdrawal = rows[0].completedAt;
enrollment = { ...enrollment, status: 'withdrawn', completedAt: completedBeforeWithdrawal };
currentProgress = currentProgress.filter((row) => row.lessonId !== bundle.lessons[1].id);
sync = await synchronizeCourseEnrollmentCompletion({ learnerStore: rawLearnerStore, completionStore, subject, courseId: COURSE_ID });
assert.equal(sync.status, 'withdrawn');
assert.equal(enrollment.status, 'withdrawn', 'academic reconciliation must not override an administrative withdrawal');
assert.equal(history.length, 3);

console.log('Course 1 automatic academic enrollment completion, reopening, idempotency, withdrawal protection, and history projection passed.');
