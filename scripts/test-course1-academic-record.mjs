import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { buildAcademicCourseRecord } from '../apps/web/public/progress.js';

const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const sourcePath = 'apps/web/public/progress.js';
const source = fs.readFileSync(sourcePath, 'utf8');
const syntax = spawnSync(process.execPath, ['--check', sourcePath], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);
assert.match(html, /id="tab-course-record"[^>]*>Course Record</, 'Academy navigation must expose Course Record');

const course = {
  id: 'COURSE-LH-TECH1-001', title: 'Safety, Responsible Practice & Cultivation Workflows', version: '1.0.0', status: 'published',
  modules: [
    { id: 'M1', title: 'Module 1', lessons: [{ id: 'L1', title: 'Lesson 1' }, { id: 'L2', title: 'Lesson 2' }] },
    { id: 'M2', title: 'Module 2', lessons: [{ id: 'L3', title: 'Lesson 3' }] }
  ]
};
const progressRows = [
  { lessonId: 'L1', lessonVersion: '1', status: 'completed', completedAt: '2026-09-01T10:00:00Z' },
  { lessonId: 'L1', lessonVersion: '2', status: 'in-progress', completedAt: null },
  { lessonId: 'L2', lessonVersion: '3', status: 'completed', completedAt: '2026-09-02T10:00:00Z' },
  { lessonId: 'L3', lessonVersion: '1', status: 'completed', completedAt: '2026-09-03T10:00:00Z' }
];
const enrollments = [
  { courseId: course.id, courseVersion: '0.9.0', status: 'active', enrolledAt: '2026-08-01T10:00:00Z', completedAt: null },
  { courseId: course.id, courseVersion: '1.0.0', status: 'active', enrolledAt: '2026-09-01T10:00:00Z', completedAt: null },
  { courseId: 'COURSE-OTHER-001', courseVersion: '1.0.0', status: 'active', enrolledAt: '2026-09-01T10:00:00Z', completedAt: null }
];
const evidence = {
  course: { id: course.id, title: course.title, version: '1.0.0' },
  writtenAssessment: { assessmentId: 'FINAL', title: 'Final', outcome: 'passed', attemptCount: 2, bestScorePercent: 91, passingScorePercent: 80, latestStartedAt: '2026-09-04T09:00:00Z', latestScoredAt: '2026-09-04T10:00:00Z' },
  performanceAssessment: { assessmentId: 'PRACTICAL', status: 'passed', scorePercent: 94, criticalErrorCount: 0, evaluatedAt: '2026-09-05T12:00:00Z', updatedAt: '2026-09-05T12:00:00Z', followUpStatus: 'closed', reassessmentTargetDate: null, remediationSummary: 'Maintain the same identity-check sequence.' }
};

const record = buildAcademicCourseRecord({ course, progressRows, enrollments, evidence });
assert.equal(record.recordType, 'academic-course-record');
assert.equal(record.academicCompletion.complete, true);
assert.equal(record.academicCompletion.status, 'complete');
assert.deepEqual(record.academicCompletion.missingRequirements, []);
assert.equal(record.instruction.completedLessons, 3);
assert.equal(record.instruction.totalLessons, 3);
assert.equal(record.instruction.modules[0].lessons[0].completedVersion, '1', 'a later lesson revision/in-progress row must not erase prior completed-version evidence');
assert.deepEqual(record.instruction.modules[0].lessons[0].recordedVersions, ['1', '2']);
assert.equal(record.writtenAssessment.outcome, 'passed');
assert.equal(record.performanceAssessment.status, 'passed');
assert.equal(record.performanceAssessment.learnerFeedback, 'Maintain the same identity-check sequence.');
assert.deepEqual(record.courseVersionHistory.map((row) => row.courseVersion), ['0.9.0', '1.0.0']);
assert.match(record.academicCompletion.statement, /not a professional credential/i);
assert.equal(Object.hasOwn(record.academicCompletion, 'credentialEligible'), false);
assert.equal(Object.hasOwn(record, 'credential'), false);

const incomplete = buildAcademicCourseRecord({
  course,
  progressRows: progressRows.filter((row) => row.lessonId !== 'L3'),
  enrollments,
  evidence: { ...evidence, writtenAssessment: { ...evidence.writtenAssessment, outcome: 'not-passed' }, performanceAssessment: { ...evidence.performanceAssessment, status: 'failed', criticalErrorCount: 1 } }
});
assert.equal(incomplete.academicCompletion.complete, false);
assert.deepEqual(incomplete.academicCompletion.missingRequirements.sort(), ['course-final', 'course-practical', 'instruction']);

for (const marker of [
  '/api/v1/me/progress',
  '/api/v1/me/enrollments',
  '/api/v1/me/courses/${ACADEMIC_RECORD_COURSE_ID}/evidence',
  "credentials: 'same-origin'",
  'Academic course status',
  'Instruction record',
  'Course assessment evidence',
  'Course-version history',
  'Print academic record',
  'This is an academic Course 1 completion record. It is not a professional credential, license, or certification.',
  'Completion is preserved by canonical lesson ID.'
]) assert.ok(source.includes(marker), `academic record runtime missing contract: ${marker}`);

const recordStart = source.indexOf('export function buildAcademicCourseRecord');
const recordEnd = source.indexOf('function transcriptElement', recordStart);
const recordSource = source.slice(recordStart, recordEnd);
for (const forbidden of ['evaluatorId', 'evidenceOutputs', 'domainScores', 'correctAnswer', 'answerKey', 'credentialEligible']) {
  assert.equal(recordSource.includes(forbidden), false, `academic learner record projection must not use ${forbidden}`);
}
assert.equal(source.includes('.innerHTML'), false, 'shared progress/admin/academic-record runtime must construct DOM without innerHTML');
assert.ok(source.includes('@media(max-width:620px)'), 'academic record must preserve mobile responsive behavior');
assert.ok(source.includes('@media print'), 'academic record must provide a print view');
assert.ok(source.includes('min-height:44px'), 'academic record controls must preserve touch target sizing');

console.log('Course 1 academic completion record, lesson-version preservation, credential separation, privacy, responsive and print contracts passed.');
