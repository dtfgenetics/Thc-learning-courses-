import assert from 'node:assert/strict';
import { isValidCurriculumVersion, projectLearningCompletion } from '../packages/domain/learning-completion.mjs';

assert.equal(isValidCurriculumVersion('1'), true);
assert.equal(isValidCurriculumVersion('1.0'), true);
assert.equal(isValidCurriculumVersion('1.0.0'), true);
assert.equal(isValidCurriculumVersion('1.0.0-rc.1'), true);
assert.equal(isValidCurriculumVersion('v1'), false);
assert.equal(isValidCurriculumVersion(''), false);

const course = { id: 'COURSE-TEST-001', version: '1.0.0', modules: ['MOD-A', 'MOD-B'] };
const modules = [
  { id: 'MOD-A', version: '1.0.0', lessons: ['LESSON-A-1', 'LESSON-A-2'] },
  { id: 'MOD-B', version: '1.0.0', lessons: ['LESSON-B-1'] }
];
const lessons = [
  { id: 'LESSON-A-1', version: '1.0.0' },
  { id: 'LESSON-A-2', version: '1.0.0' },
  { id: 'LESSON-B-1', version: '2.0.0' }
];

let result = projectLearningCompletion({ course, modules, lessons, progress: [] });
assert.equal(result.contentStatus, 'not-started');
assert.equal(result.completedLessons, 0);
assert.equal(result.totalLessons, 3);
assert.equal(result.percentComplete, 0);
assert.equal(result.credentialEligibilitySatisfied, null);
assert.equal(result.finalAssessmentSatisfied, null);

result = projectLearningCompletion({
  course,
  modules,
  lessons,
  progress: [{ lessonId: 'LESSON-A-1', lessonVersion: '1.0.0', status: 'completed', completedAt: '2026-09-06T20:00:00.000Z' }]
});
assert.equal(result.contentStatus, 'in-progress');
assert.equal(result.completedLessons, 1);
assert.equal(result.modules[0].status, 'in-progress');
assert.equal(result.modules[0].percentComplete, 50);

result = projectLearningCompletion({
  course,
  modules,
  lessons,
  progress: [
    { lessonId: 'LESSON-A-1', lessonVersion: '1.0.0', status: 'completed' },
    { lessonId: 'LESSON-A-2', lessonVersion: '1.0.0', status: 'completed' }
  ]
});
assert.equal(result.modules[0].status, 'completed');
assert.equal(result.modules[1].status, 'not-started');
assert.equal(result.completedModules, 1);
assert.equal(result.contentStatus, 'in-progress');

result = projectLearningCompletion({
  course,
  modules,
  lessons,
  progress: [
    { lessonId: 'LESSON-A-1', lessonVersion: '1.0.0', status: 'completed' },
    { lessonId: 'LESSON-A-2', lessonVersion: '1.0.0', status: 'completed' },
    { lessonId: 'LESSON-B-1', lessonVersion: '1.0.0', status: 'completed' },
    { lessonId: 'LESSON-UNKNOWN', lessonVersion: '1.0.0', status: 'completed' }
  ]
});
assert.equal(result.completedLessons, 2, 'stale lesson versions must not satisfy current completion');
assert.equal(result.unexpectedProgress.length, 2);
assert.equal(result.contentStatus, 'in-progress');

result = projectLearningCompletion({
  course,
  modules,
  lessons,
  progress: [
    { lessonId: 'LESSON-A-1', lessonVersion: '1.0.0', status: 'completed' },
    { lessonId: 'LESSON-A-2', lessonVersion: '1.0.0', status: 'completed' },
    { lessonId: 'LESSON-B-1', lessonVersion: '2.0.0', status: 'completed' }
  ]
});
assert.equal(result.contentStatus, 'completed');
assert.equal(result.completedModules, 2);
assert.equal(result.completedLessons, 3);
assert.equal(result.percentComplete, 100);
assert.equal(result.credentialEligibilitySatisfied, null, 'content completion must not imply credential eligibility');
assert.equal(result.finalAssessmentSatisfied, null, 'content completion must not imply assessment completion');

assert.throws(
  () => projectLearningCompletion({ course, modules: [modules[0]], lessons, progress: [] }),
  /missing module MOD-B/
);

console.log('Deterministic lesson/module/course content completion semantics passed.');
