function isoTime(value) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function latestIso(values = []) {
  const valid = values.map(isoTime).filter(Boolean).sort();
  return valid.length ? valid.at(-1) : null;
}

function lessonRecord(lesson, progressRows = []) {
  const rows = progressRows
    .filter((row) => row.lessonId === lesson.id)
    .map((row) => ({
      lessonId: row.lessonId,
      lessonVersion: String(row.lessonVersion),
      status: row.status,
      completedAt: isoTime(row.completedAt)
    }));
  const completed = rows.filter((row) => row.status === 'completed');
  completed.sort((a, b) => String(a.completedAt ?? '').localeCompare(String(b.completedAt ?? '')));
  const latestCompleted = completed.at(-1) ?? null;
  const currentCompleted = completed.find((row) => row.lessonVersion === String(lesson.version)) ?? null;
  return {
    id: lesson.id,
    title: lesson.title,
    currentVersion: String(lesson.version),
    completed: completed.length > 0,
    completedVersion: latestCompleted?.lessonVersion ?? null,
    completedAt: latestCompleted?.completedAt ?? null,
    currentVersionCompleted: Boolean(currentCompleted),
    priorRecordedVersions: [...new Set(rows.map((row) => row.lessonVersion).filter((version) => version !== String(lesson.version)))].sort()
  };
}

function writtenRecord(assessment, rawEvidence = {}) {
  const attempts = (rawEvidence.assessmentAttempts ?? [])
    .filter((row) => row.assessmentId === assessment.id)
    .map((row) => ({
      assessmentVersion: String(row.assessmentVersion),
      formId: row.formId ?? null,
      status: row.status,
      scorePercent: row.scorePercent == null ? null : Number(row.scorePercent),
      passed: row.passed == null ? null : Boolean(row.passed),
      startedAt: isoTime(row.startedAt),
      submittedAt: isoTime(row.submittedAt),
      scoredAt: isoTime(row.scoredAt)
    }));
  const scored = attempts.filter((row) => row.status === 'scored');
  const passed = scored.filter((row) => row.passed === true);
  const latest = attempts[0] ?? null;
  const outcome = passed.length ? 'passed' : ['started', 'submitted'].includes(latest?.status) ? 'in-progress' : scored.length ? 'not-passed' : 'not-attempted';
  return {
    assessmentId: assessment.id,
    title: assessment.title,
    currentVersion: String(assessment.version),
    passingScorePercent: Number(assessment.passingScorePercent ?? 0),
    outcome,
    attemptCount: attempts.length,
    bestScorePercent: scored.length ? Math.max(...scored.map((row) => Number(row.scorePercent ?? 0))) : null,
    passedAt: latestIso(passed.map((row) => row.scoredAt)),
    attempts
  };
}

function safePracticalHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history.map((row) => ({
    status: row?.status ?? 'not-recorded',
    scorePercent: row?.scorePercent == null ? null : Number(row.scorePercent),
    criticalErrorCount: Number(row?.criticalErrorCount ?? 0),
    evaluatedAt: isoTime(row?.evaluatedAt),
    followUpStatus: row?.followUpStatus ?? 'none',
    reassessmentTargetDate: row?.reassessmentTargetDate || null,
    learnerFeedback: row?.learnerFeedback || null
  }));
}

function practicalRecord(assessment, rawEvidence = {}) {
  const practicalId = assessment.extensions?.linkedPerformanceAssessment ?? null;
  const row = rawEvidence.performanceAssessment?.assessmentId === practicalId ? rawEvidence.performanceAssessment : null;
  if (!practicalId) return null;
  return {
    assessmentId: practicalId,
    version: row?.assessmentVersion ? String(row.assessmentVersion) : null,
    status: row?.status ?? 'not-recorded',
    scorePercent: row?.scorePercent == null ? null : Number(row.scorePercent),
    criticalErrorCount: Number(row?.criticalErrorCount ?? 0),
    evaluatedAt: isoTime(row?.evaluatedAt),
    updatedAt: isoTime(row?.updatedAt),
    followUpStatus: row?.followUpStatus ?? 'none',
    reassessmentTargetDate: row?.reassessmentTargetDate || null,
    learnerFeedback: row?.remediationSummary ?? row?.learnerFeedback ?? null,
    history: safePracticalHistory(row?.history)
  };
}

export function buildCourseAcademicTranscript({ course, assessment, modules = [], lessons = [], enrollments = [], progress = [], rawEvidence = {} } = {}) {
  if (!course?.id || !course?.version) throw new Error('course definition required');
  if (!assessment?.id) throw new Error('course final assessment required');

  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const moduleRecords = modules.map((module) => {
    const lessonRecords = (module.lessons ?? []).map((id) => lessonById.get(id)).filter(Boolean).map((lesson) => lessonRecord(lesson, progress));
    const completedLessons = lessonRecords.filter((lesson) => lesson.completed).length;
    return {
      id: module.id,
      title: module.title,
      currentVersion: String(module.version),
      completedLessons,
      totalLessons: lessonRecords.length,
      complete: lessonRecords.length > 0 && completedLessons === lessonRecords.length,
      lessons: lessonRecords
    };
  });

  const allLessonRecords = moduleRecords.flatMap((module) => module.lessons);
  const completedLessons = allLessonRecords.filter((lesson) => lesson.completed).length;
  const instructionComplete = allLessonRecords.length > 0 && completedLessons === allLessonRecords.length;
  const written = writtenRecord(assessment, rawEvidence);
  const practical = practicalRecord(assessment, rawEvidence);
  const practicalPassed = practical?.status === 'passed' && Number(practical.criticalErrorCount ?? 0) === 0;
  const writtenPassed = written.outcome === 'passed';
  const complete = instructionComplete && writtenPassed && practicalPassed;
  const missingRequirements = [];
  if (!instructionComplete) missingRequirements.push('instruction');
  if (!writtenPassed) missingRequirements.push('course-final');
  if (!practicalPassed) missingRequirements.push('course-practical');

  const courseVersionHistory = enrollments
    .filter((row) => row.courseId === course.id)
    .map((row) => ({
      courseVersion: String(row.courseVersion),
      status: row.status,
      enrolledAt: isoTime(row.enrolledAt),
      completedAt: isoTime(row.completedAt)
    }))
    .sort((a, b) => String(a.enrolledAt ?? '').localeCompare(String(b.enrolledAt ?? '')));

  const completionDate = complete ? latestIso([
    ...allLessonRecords.map((lesson) => lesson.completedAt),
    written.passedAt,
    practical?.evaluatedAt
  ]) : null;

  return {
    recordType: 'academic-course-record',
    course: {
      id: course.id,
      title: course.title,
      currentVersion: String(course.version),
      publicationStatus: course.status ?? null
    },
    academicCompletion: {
      complete,
      status: complete ? 'complete' : 'in-progress',
      completedAt: completionDate,
      missingRequirements,
      statement: 'This is an academic course completion record. It is not a professional credential, license, or certification.'
    },
    instruction: {
      completedLessons,
      totalLessons: allLessonRecords.length,
      complete: instructionComplete,
      latestLessonCompletionAt: latestIso(allLessonRecords.map((lesson) => lesson.completedAt)),
      modules: moduleRecords
    },
    writtenAssessment: written,
    performanceAssessment: practical,
    courseVersionHistory,
    generatedAt: new Date().toISOString()
  };
}
