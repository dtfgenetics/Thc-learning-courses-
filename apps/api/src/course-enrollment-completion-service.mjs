import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readById(directory, id) {
  if (!/^[A-Z0-9-]+$/.test(String(id ?? ''))) return null;
  const file = path.join(root, 'content', directory, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  const object = JSON.parse(fs.readFileSync(file, 'utf8'));
  return object?.id === id ? object : null;
}

function iso(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function latestIso(values = []) {
  const valid = values.map(iso).filter(Boolean).sort();
  return valid.length ? valid.at(-1) : null;
}

export function loadCourseAcademicCompletionBundle(courseId) {
  const course = readById('courses', courseId);
  if (!course || course.status !== 'published' || !course.finalAssessment) return null;
  const modules = [];
  const lessons = [];
  for (const moduleId of course.modules ?? []) {
    const module = readById('modules', moduleId);
    if (!module || module.status !== 'published') return null;
    modules.push(module);
    for (const lessonId of module.lessons ?? []) {
      const lesson = readById('lessons', lessonId);
      if (!lesson || lesson.status !== 'published') return null;
      lessons.push(lesson);
    }
  }
  const assessment = readById('assessments', course.finalAssessment);
  if (!assessment || assessment.status !== 'published') return null;
  return {
    course,
    modules,
    lessons,
    assessment,
    performanceAssessmentId: assessment.extensions?.linkedPerformanceAssessment ?? null
  };
}

export function evaluateCourseAcademicCompletion({ bundle, progress = [], evidence = {}, now = new Date().toISOString() } = {}) {
  if (!bundle?.course?.id || !bundle?.assessment?.id) throw new Error('course academic completion bundle required');
  const requiredLessonIds = [...new Set(bundle.lessons.map((lesson) => lesson.id))];
  const completedRows = progress.filter((row) => row?.status === 'completed' && requiredLessonIds.includes(row.lessonId));
  const completedLessonIds = [...new Set(completedRows.map((row) => row.lessonId))];
  const instructionComplete = requiredLessonIds.length > 0 && completedLessonIds.length === requiredLessonIds.length;

  const attempts = (evidence.assessmentAttempts ?? []).filter((row) => row.assessmentId === bundle.assessment.id && row.status === 'scored');
  const passedAttempts = attempts.filter((row) => row.passed === true);
  const writtenPassed = passedAttempts.length > 0;
  const writtenStatus = writtenPassed ? 'passed' : attempts.length ? 'not-passed' : 'not-attempted';

  const practical = evidence.performanceAssessment?.assessmentId === bundle.performanceAssessmentId ? evidence.performanceAssessment : null;
  const practicalPassed = Boolean(bundle.performanceAssessmentId)
    && practical?.status === 'passed'
    && Number(practical?.criticalErrorCount ?? 0) === 0;
  const practicalStatus = practical?.status ?? 'not-recorded';

  const complete = instructionComplete && writtenPassed && practicalPassed;
  const missingRequirements = [];
  if (!instructionComplete) missingRequirements.push('instruction');
  if (!writtenPassed) missingRequirements.push('course-final');
  if (!practicalPassed) missingRequirements.push('course-practical');

  const requirementCompletedAt = complete ? latestIso([
    ...completedRows.map((row) => row.completedAt),
    ...passedAttempts.map((row) => row.scoredAt),
    practical?.evaluatedAt
  ]) ?? iso(now) : null;

  return {
    complete,
    desiredEnrollmentStatus: complete ? 'completed' : 'active',
    requirementCompletedAt,
    missingRequirements,
    snapshot: {
      courseId: bundle.course.id,
      courseVersion: String(bundle.course.version),
      requiredLessonCount: requiredLessonIds.length,
      completedLessonCount: completedLessonIds.length,
      finalAssessmentId: bundle.assessment.id,
      finalAssessmentStatus: writtenStatus,
      performanceAssessmentId: bundle.performanceAssessmentId,
      performanceAssessmentStatus: practicalStatus,
      performanceCriticalErrorCount: Number(practical?.criticalErrorCount ?? 0),
      missingRequirements
    }
  };
}

export async function synchronizeCourseEnrollmentCompletion({ learnerStore, subject, courseId, now = new Date().toISOString() } = {}) {
  const bundle = loadCourseAcademicCompletionBundle(courseId);
  if (!bundle) return { status: 'not-configured', courseId };
  const requiredMethods = ['listEnrollments', 'listProgress', 'listCourseEvidence', 'setEnrollmentAcademicStatus'];
  if (!learnerStore || requiredMethods.some((method) => typeof learnerStore[method] !== 'function')) {
    throw new Error('learner enrollment completion persistence unavailable');
  }

  const enrollments = await learnerStore.listEnrollments(subject);
  const enrollment = enrollments.find((row) => row.courseId === courseId && String(row.courseVersion) === String(bundle.course.version));
  if (!enrollment) return { status: 'not-enrolled', courseId, courseVersion: String(bundle.course.version) };
  if (enrollment.status === 'withdrawn') return { status: 'withdrawn', enrollment };

  const progress = await learnerStore.listProgress(subject);
  const evidence = await learnerStore.listCourseEvidence(subject, {
    assessmentId: bundle.assessment.id,
    performanceAssessmentId: bundle.performanceAssessmentId
  });
  const academic = evaluateCourseAcademicCompletion({ bundle, progress, evidence, now });
  const reason = academic.complete
    ? 'academic-requirements-satisfied'
    : enrollment.status === 'completed'
      ? 'academic-requirements-reopened'
      : 'academic-requirements-incomplete';

  const synchronized = await learnerStore.setEnrollmentAcademicStatus(subject, {
    courseId,
    courseVersion: String(bundle.course.version),
    status: academic.desiredEnrollmentStatus,
    completedAt: academic.requirementCompletedAt,
    reason,
    academicSnapshot: academic.snapshot
  });

  const history = typeof learnerStore.listEnrollmentAcademicHistory === 'function'
    ? await learnerStore.listEnrollmentAcademicHistory(subject, { courseId })
    : [];

  return {
    status: 'synchronized',
    academic,
    enrollment: synchronized?.enrollment ?? enrollment,
    changed: Boolean(synchronized?.changed),
    history
  };
}
