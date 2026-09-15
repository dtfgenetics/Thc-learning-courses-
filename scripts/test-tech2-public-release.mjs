import { readFile } from 'node:fs/promises';

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const must = (value, message) => { if (!value) throw new Error(message); };

const expected = Array.from({ length: 8 }, (_, i) => {
  const n = String(i + 1).padStart(3, '0');
  return {
    courseId: `COURSE-LH-TECH2-${n}`,
    releaseId: `PUBLIC-RELEASE-LH-TECH2-${n}`,
    releasePath: `content/public-releases/PUBLIC-RELEASE-LH-TECH2-${n}.json`,
    modulePrefix: `MOD-LH-TECH2-${n}-`,
    lessonPrefix: `LESSON-LH-TECH2-${n}-`,
    expectedLessons: 4,
    expectedItems: i === 7 ? 16 : 36,
    expectedAssessments: i === 7 ? 1 : 2,
  };
});

let totalLessons = 0;
let totalItems = 0;

for (const spec of expected) {
  const release = await readJson(spec.releasePath);
  const course = await readJson(`content/courses/${spec.courseId}.json`);

  must(release.schemaVersion === 1, `${spec.releaseId}: schemaVersion must be 1`);
  must(release.id === spec.releaseId, `${spec.releaseId}: id mismatch`);
  must(release.courseId === spec.courseId, `${spec.releaseId}: courseId mismatch`);
  must(release.publicationState === 'published', `${spec.releaseId}: publicationState must be published`);
  must(release.publicationBoundary?.learnerPackage === 'released', `${spec.releaseId}: learner package not released`);
  must(release.publicationBoundary?.courseTests === 'released-for-learning', `${spec.releaseId}: learning tests not released`);
  must(release.publicationBoundary?.credentialExam === 'restricted', `${spec.releaseId}: credential exam must remain restricted`);
  must(release.publicationBoundary?.credentialDecision === 'restricted-governance', `${spec.releaseId}: credential decision must remain restricted`);

  must(course.id === spec.courseId, `${spec.courseId}: canonical course id mismatch`);
  must(course.extensions?.operationalCredentialBankMustBePrivate === true, `${spec.courseId}: operational credential bank must remain private`);
  must(Array.isArray(course.learningOutcomes) && course.learningOutcomes.length >= 4, `${spec.courseId}: insufficient learning outcomes`);

  const modules = release.publicScope?.modules || [];
  must(modules.length === 1, `${spec.releaseId}: exactly one dedicated public module required`);
  must(modules[0].startsWith(spec.modulePrefix), `${spec.releaseId}: public module must be the dedicated Technician II module`);
  const module = await readJson(`content/modules/${modules[0]}.json`);
  must(Array.isArray(module.lessons) && module.lessons.length === spec.expectedLessons, `${spec.releaseId}: expected ${spec.expectedLessons} lessons`);

  const studentSources = release.publicScope?.studentSources || [];
  must(studentSources.length === spec.expectedLessons, `${spec.releaseId}: student-source count mismatch`);
  for (const lessonId of module.lessons) {
    must(lessonId.startsWith(spec.lessonPrefix), `${spec.releaseId}: non-dedicated lesson ${lessonId}`);
    const path = `content/lessons/${lessonId}.json`;
    must(studentSources.includes(path), `${spec.releaseId}: ${lessonId} missing from authorized student sources`);
    const lesson = await readJson(path);
    must(lesson.id === lessonId, `${lessonId}: lesson id mismatch`);
    must(lesson.title, `${lessonId}: title missing`);
    must(lesson.content?.overview, `${lessonId}: overview missing`);
    must(lesson.content?.summary, `${lessonId}: summary missing`);
    must(Array.isArray(lesson.learningObjectives) && lesson.learningObjectives.length > 0, `${lessonId}: learning objectives missing`);
  }
  must(studentSources.every(path => path.startsWith(`content/lessons/${spec.lessonPrefix}`)), `${spec.releaseId}: public student sources must remain lesson-only and course-specific`);
  totalLessons += module.lessons.length;

  const assessmentIds = release.publicScope?.assessments || [];
  must(assessmentIds.length === spec.expectedAssessments, `${spec.releaseId}: assessment count mismatch`);
  let courseItems = 0;
  for (const assessmentId of assessmentIds) {
    const assessment = await readJson(`content/assessments/${assessmentId}.json`);
    must(['formative', 'summative'].includes(assessment.purpose), `${assessmentId}: credential-purpose assessment cannot be public`);
    must(Array.isArray(assessment.items) && assessment.items.length > 0, `${assessmentId}: assessment items missing`);
    for (const itemId of assessment.items) {
      const item = await readJson(`content/questions/${itemId}.json`);
      must(['formative', 'summative'].includes(item.purpose), `${itemId}: credential-purpose item cannot be public`);
      must(Array.isArray(item.choices) && item.choices.length >= 2, `${itemId}: choices missing`);
      must(Number.isInteger(item.correct) && item.correct >= 0 && item.correct < item.choices.length, `${itemId}: invalid keyed response`);
      must(item.rationale && String(item.rationale).trim().length >= 20, `${itemId}: explanatory rationale missing`);
      courseItems += 1;
    }
  }
  must(courseItems === spec.expectedItems, `${spec.releaseId}: expected ${spec.expectedItems} public items, found ${courseItems}`);
  must(release.publicScope.publicCourseItems === courseItems, `${spec.releaseId}: manifest item count mismatch`);
  totalItems += courseItems;

  const excluded = JSON.stringify(release.excludedFromPublicRelease || []).toLowerCase();
  must(excluded.includes('credential'), `${spec.releaseId}: credential exclusions missing`);
  must(excluded.includes('practical') || spec.courseId.endsWith('-008'), `${spec.releaseId}: practical/evaluator exclusions missing`);

  if (spec.courseId.endsWith('-008')) {
    must(assessmentIds[0] === 'ASSESS-LH-TECH2-008-M01', `${spec.releaseId}: Course 8 may expose only its formative readiness assessment`);
    must(!course.finalAssessment, `${spec.courseId}: public simulation-preparation package must not invent a course final assessment`);
    must(Array.isArray(course.extensions?.mappedPerformanceAssessments) && course.extensions.mappedPerformanceAssessments.length === 8, `${spec.courseId}: expected seven practicals plus capstone mapping`);
    must(course.extensions?.liveCredentialFormApproved === false, `${spec.courseId}: live credential form must remain unapproved`);
  }
}

must(totalLessons === 32, `Expected 32 Technician II public lessons, found ${totalLessons}`);
must(totalItems === 268, `Expected 268 Technician II public learning items, found ${totalItems}`);

console.log(JSON.stringify({
  result: 'success',
  courses: expected.length,
  publicLessons: totalLessons,
  publicLearningItems: totalItems,
  credentialExam: 'restricted',
  credentialIssuanceAuthorized: false,
}, null, 2));
