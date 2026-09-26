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

function publishedCourseIds() {
  const courseDir = path.join(root, 'content', 'courses');
  if (!fs.existsSync(courseDir)) return [];
  return fs.readdirSync(courseDir)
    .filter((entry) => entry.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(courseDir, name), 'utf8')))
    .filter((course) => course?.status === 'published' && course?.id)
    .map((course) => course.id);
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

function academicCompletionModuleIds(course) {
  const explicit = course?.extensions?.academicCompletionModules;
  if (Array.isArray(explicit) && explicit.length > 0) return [...new Set(explicit)];

  const dedicatedPrefix = String(course?.id ?? '').replace(/^COURSE-/, 'MOD-');
  const dedicated = (course?.modules ?? []).filter((moduleId) => String(moduleId).startsWith(dedicatedPrefix));
  return dedicated.length ? [...new Set(dedicated)] : [...new Set(course?.modules ?? [])];
}

export function loadCourseAcademicCompletionBundle(courseId) {
  const course = readById('courses', courseId);
  if (!course || course.status !== 'published' || !course.finalAssessment) return null;
  const openAcademicDependencies = Array.isArray(course.extensions?.openAcademicDependencies)
    ? course.extensions.openAcademicDependencies.filter(Boolean)
    : [];
  if (course.extensions?.academicCompletionBlockedWhileOpenDependencies === true && openAcademicDependencies.length > 0) return null;
  const modules = [];
  const lessons = [];
  const completionModuleIds = academicCompletionModuleIds(course);
  if (completionModuleIds.length === 0) return null;
  for (const moduleId of completionModuleIds) {
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
    completionModuleIds,
    performanceAssessmentId: assessment.extensions?.linkedPerformanceAssessment ?? null
  };
}

export function coursesContainingLesson(lessonId) {
  const matches = [];
  for (const courseId of publishedCourseIds()) {
    const bundle = loadCourseAcademicCompletionBundle(courseId);
    if (bundle?.lessons.some((lesson) => lesson.id === lessonId)) matches.push(courseId);
  }
  return matches;
}

export function courseIdForFinalAssessment(assessmentId) {
  for (const courseId of publishedCourseIds()) {
    const bundle = loadCourseAcademicCompletionBundle(courseId);
    if (bundle?.assessment.id === assessmentId) return courseId;
  }
  return null;
}

export function courseIdForPerformanceAssessment(assessmentId) {
  for (const courseId of publishedCourseIds()) {
    const bundle = loadCourseAcademicCompletionBundle(courseId);
    if (bundle?.performanceAssessmentId === assessmentId) return courseId;
  }
  return null;
}

export function evaluateCourseAcademicCompletion({ bundle, progress = [], evidence = {}, now = new Date().toISOString() } = {}) {
  if (!bundle?.course?.id || !bundle?.assessment?.id) throw new Error('course academic completion bundle required');
  const requiredLessonIds = [...new Set(bundle.lessons.map((lesson) => lesson.id))];
  const completedRows = progress.filter((row) => row?.status === 'completed' && requiredLessonIds.includes(row.lessonId));
  const completedLessonIds = [...new Set(completedRows.map((row) => row.lessonId))];
  const completedLessonSet = new Set(completedLessonIds);
  const instructionComplete = requiredLessonIds.length > 0 && completedLessonIds.length === requiredLessonIds.length;
  const moduleProgress = (bundle.modules ?? []).map((module) => {
    const lessonIds = [...new Set(module.lessons ?? [])];
    const moduleCompletedRows = completedRows.filter((row) => lessonIds.includes(row.lessonId));
    const completedCount = lessonIds.filter((lessonId) => completedLessonSet.has(lessonId)).length;
    const complete = lessonIds.length > 0 && completedCount === lessonIds.length;
    return {
      moduleId: module.id,
      title: module.title ?? module.id,
      requiredLessonCount: lessonIds.length,
      completedLessonCount: completedCount,
      completionPercent: lessonIds.length ? Math.round((completedCount / lessonIds.length) * 100) : 0,
      complete,
      completedAt: complete ? latestIso(moduleCompletedRows.map((row) => row.completedAt)) : null
    };
  });
  const instructionPercent = requiredLessonIds.length ? Math.round((completedLessonIds.length / requiredLessonIds.length) * 100) : 0;

  const attempts = (evidence.assessmentAttempts ?? []).filter((row) => row.assessmentId === bundle.assessment.id && row.status === 'scored');
  const passedAttempts = attempts.filter((row) => row.passed === true);
  const writtenPassed = passedAttempts.length > 0;
  const writtenStatus = writtenPassed ? 'passed' : attempts.length ? 'not-passed' : 'not-attempted';

  const practicalRequired = Boolean(bundle.performanceAssessmentId);
  const practical = practicalRequired && evidence.performanceAssessment?.assessmentId === bundle.performanceAssessmentId
    ? evidence.performanceAssessment
    : null;
  const practicalPassed = !practicalRequired || (
    practical?.status === 'passed' &&
    Number(practical?.criticalErrorCount ?? 0) === 0
  );
  const practicalStatus = practicalRequired ? (practical?.status ?? 'not-recorded') : 'not-required';

  const complete = instructionComplete && writtenPassed && practicalPassed;
  const missingRequirements = [];
  if (!instructionComplete) missingRequirements.push('instruction');
  if (!writtenPassed) missingRequirements.push('course-final');
  if (practicalRequired && !practicalPassed) missingRequirements.push('course-practical');

  const requirementCompletedAt = complete ? latestIso([
    ...completedRows.map((row) => row.completedAt),
    ...passedAttempts.map((row) => row.scoredAt),
    practicalRequired ? practical?.evaluatedAt : null
  ]) ?? iso(now) : null;

  return {
    complete,
    desiredEnrollmentStatus: complete ? 'completed' : 'active',
    requirementCompletedAt,
    missingRequirements,
    instruction: {
      complete: instructionComplete,
      completionPercent: instructionPercent,
      requiredLessonCount: requiredLessonIds.length,
      completedLessonCount: completedLessonIds.length,
      modules: moduleProgress
    },
    snapshot: {
      courseId: bundle.course.id,
      courseVersion: String(bundle.course.version),
      requiredLessonCount: requiredLessonIds.length,
      completedLessonCount: completedLessonIds.length,
      instructionCompletionPercent: instructionPercent,
      completedModuleCount: moduleProgress.filter((module) => module.complete).length,
      requiredModuleCount: moduleProgress.length,
      modules: moduleProgress,
      finalAssessmentId: bundle.assessment.id,
      finalAssessmentStatus: writtenStatus,
      performanceAssessmentId: bundle.performanceAssessmentId,
      performanceAssessmentStatus: practicalStatus,
      performanceCriticalErrorCount: Number(practical?.criticalErrorCount ?? 0),
      missingRequirements
    }
  };
}

export async function synchronizeCourseEnrollmentCompletion({ learnerStore, completionStore, subject, courseId, now = new Date().toISOString() } = {}) {
  const bundle = loadCourseAcademicCompletionBundle(courseId);
  if (!bundle) return { status: 'not-configured', courseId };
  const learnerMethods = ['listEnrollments', 'listProgress', 'listCourseEvidence'];
  if (!learnerStore || learnerMethods.some((method) => typeof learnerStore[method] !== 'function')) {
    throw new Error('learner academic evidence persistence unavailable');
  }
  if (!completionStore || typeof completionStore.setEnrollmentAcademicStatus !== 'function') {
    throw new Error('enrollment completion persistence unavailable');
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

  const synchronized = await completionStore.setEnrollmentAcademicStatus(subject, {
    courseId,
    courseVersion: String(bundle.course.version),
    status: academic.desiredEnrollmentStatus,
    completedAt: academic.requirementCompletedAt,
    reason,
    academicSnapshot: academic.snapshot
  });

  const history = typeof completionStore.listEnrollmentAcademicHistory === 'function'
    ? await completionStore.listEnrollmentAcademicHistory(subject, { courseId })
    : [];

  return {
    status: 'synchronized',
    academic,
    enrollment: synchronized?.enrollment ?? enrollment,
    changed: Boolean(synchronized?.changed),
    history
  };
}
