function stringVersion(value) {
  return value == null ? null : String(value).trim();
}

function progressKey(lessonId, lessonVersion) {
  return `${lessonId}@@${stringVersion(lessonVersion)}`;
}

export function isValidCurriculumVersion(value) {
  const version = stringVersion(value);
  return Boolean(version && /^\d+(?:\.\d+){0,2}(?:-[0-9A-Za-z.-]+)?$/.test(version));
}

export function projectLearningCompletion({ course, modules = [], lessons = [], progress = [] } = {}) {
  if (!course?.id) throw new Error('course definition required');

  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const completedProgress = new Map(
    progress
      .filter((row) => row?.lessonId && row.status === 'completed')
      .map((row) => [progressKey(row.lessonId, row.lessonVersion), row])
  );

  const moduleResults = [];
  const requiredLessonKeys = new Set();

  for (const moduleId of course.modules ?? []) {
    const module = moduleById.get(moduleId);
    if (!module) throw new Error(`course ${course.id} references missing module ${moduleId}`);

    const lessonResults = [];
    for (const lessonId of module.lessons ?? []) {
      const lesson = lessonById.get(lessonId);
      if (!lesson) throw new Error(`module ${module.id} references missing lesson ${lessonId}`);
      const lessonVersion = stringVersion(lesson.version);
      if (!isValidCurriculumVersion(lessonVersion)) throw new Error(`lesson ${lesson.id} has invalid version ${lessonVersion}`);

      const key = progressKey(lesson.id, lessonVersion);
      requiredLessonKeys.add(key);
      const matching = completedProgress.get(key) ?? null;
      lessonResults.push({
        lessonId: lesson.id,
        lessonVersion,
        status: matching ? 'completed' : 'incomplete',
        completedAt: matching?.completedAt ?? null
      });
    }

    const completedLessons = lessonResults.filter((lesson) => lesson.status === 'completed').length;
    const totalLessons = lessonResults.length;
    moduleResults.push({
      moduleId: module.id,
      moduleVersion: stringVersion(module.version),
      status: totalLessons > 0 && completedLessons === totalLessons ? 'completed' : completedLessons > 0 ? 'in-progress' : 'not-started',
      completedLessons,
      totalLessons,
      percentComplete: totalLessons === 0 ? 0 : Number(((completedLessons / totalLessons) * 100).toFixed(2)),
      lessons: lessonResults
    });
  }

  const totalLessons = requiredLessonKeys.size;
  const completedLessons = [...requiredLessonKeys].filter((key) => completedProgress.has(key)).length;
  const totalModules = moduleResults.length;
  const completedModules = moduleResults.filter((module) => module.status === 'completed').length;

  const unexpectedProgress = progress
    .filter((row) => row?.lessonId && !requiredLessonKeys.has(progressKey(row.lessonId, row.lessonVersion)))
    .map((row) => ({
      lessonId: row.lessonId,
      lessonVersion: stringVersion(row.lessonVersion),
      status: row.status
    }));

  const contentStatus = totalModules > 0 && completedModules === totalModules
    ? 'completed'
    : completedLessons > 0
      ? 'in-progress'
      : 'not-started';

  return {
    courseId: course.id,
    courseVersion: stringVersion(course.version),
    contentStatus,
    completedModules,
    totalModules,
    completedLessons,
    totalLessons,
    percentComplete: totalLessons === 0 ? 0 : Number(((completedLessons / totalLessons) * 100).toFixed(2)),
    modules: moduleResults,
    unexpectedProgress,
    credentialEligibilitySatisfied: null,
    finalAssessmentSatisfied: null
  };
}
