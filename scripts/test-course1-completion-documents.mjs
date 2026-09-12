import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  buildAcademicTranscriptText,
  buildAcademicRecordJson,
  academicRecordDownloadFiles
} from '../apps/web/public/completion-documents.js';
import {
  buildCoursePracticalReport,
  coursePracticalReportCsv
} from '../apps/api/src/course-practical-evaluator-service.mjs';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const runtimePath = 'apps/web/public/completion-documents.js';
const runtime = fs.readFileSync(runtimePath, 'utf8');
const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const webServerSource = fs.readFileSync('apps/web/server.mjs', 'utf8');
const syntax = spawnSync(process.execPath, ['--check', runtimePath], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);

const record = {
  recordType: 'academic-course-record',
  course: { id: 'COURSE-LH-TECH1-001', title: 'Safety, Responsible Practice & Cultivation Workflows', currentVersion: '1.0.0', publicationStatus: 'published' },
  academicCompletion: { complete: true, status: 'complete', completionRecordedAt: '2026-09-21T12:00:00.000Z', missingRequirements: [], statement: 'Academic only.' },
  instruction: {
    completedLessons: 2,
    totalLessons: 2,
    complete: true,
    modules: [{ id: 'M1', title: 'Module 1', completedLessons: 2, totalLessons: 2, complete: true, lessons: [
      { id: 'L1', title: 'Lesson 1', completed: true, completedVersion: '1.2.0', completedAt: '2026-09-18T12:00:00.000Z', recordedVersions: ['1.2.0'] },
      { id: 'L2', title: 'Lesson 2', completed: true, completedVersion: '1.1.0', completedAt: '2026-09-19T12:00:00.000Z', recordedVersions: ['1.1.0'] }
    ] }]
  },
  writtenAssessment: { assessmentId: 'FINAL', title: 'Course final', outcome: 'passed', attemptCount: 1, bestScorePercent: 92, passingScorePercent: 80, latestStartedAt: '2026-09-20T11:00:00.000Z', latestScoredAt: '2026-09-20T12:00:00.000Z' },
  performanceAssessment: { assessmentId: 'PRACTICAL', status: 'passed', scorePercent: 94, criticalErrorCount: 0, evaluatedAt: '2026-09-21T12:00:00.000Z', updatedAt: '2026-09-21T12:00:00.000Z', followUpStatus: 'closed', reassessmentTargetDate: null, learnerFeedback: 'Maintain the same identity-check sequence.' },
  academicStatusHistory: [
    { eventType: 'course-enrollment-academic-completed', fromStatus: 'active', toStatus: 'completed', courseVersion: '1.0.0', completedAt: '2026-09-21T12:00:00.000Z', occurredAt: '2026-09-21T12:00:01.000Z', academicSnapshot: { requiredLessonCount: 2, completedLessonCount: 2, finalAssessmentStatus: 'passed', performanceAssessmentStatus: 'passed', performanceCriticalErrorCount: 0, missingRequirements: [] } },
    { eventType: 'course-enrollment-academic-reopened', fromStatus: 'completed', toStatus: 'active', courseVersion: '1.0.0', previousCompletedAt: '2026-09-21T12:00:00.000Z', occurredAt: '2026-09-22T12:00:00.000Z', academicSnapshot: { requiredLessonCount: 3, completedLessonCount: 2, finalAssessmentStatus: 'passed', performanceAssessmentStatus: 'passed', performanceCriticalErrorCount: 0, missingRequirements: ['instruction'] } },
    { eventType: 'course-enrollment-academic-completed', fromStatus: 'active', toStatus: 'completed', courseVersion: '1.0.0', completedAt: '2026-09-23T12:00:00.000Z', occurredAt: '2026-09-23T12:00:01.000Z', academicSnapshot: { requiredLessonCount: 3, completedLessonCount: 3, finalAssessmentStatus: 'passed', performanceAssessmentStatus: 'passed', performanceCriticalErrorCount: 0, missingRequirements: [] } }
  ],
  courseVersionHistory: [{ courseVersion: '1.0.0', status: 'completed', enrolledAt: '2026-09-01T12:00:00.000Z', completedAt: '2026-09-23T12:00:00.000Z', academicStatusHistory: [] }]
};

const generatedAt = '2026-09-24T12:00:00.000Z';
const transcript = buildAcademicTranscriptText(record, { generatedAt });
for (const marker of [
  'THC Academy Academic Completion Statement and Transcript',
  'Safety, Responsible Practice & Cultivation Workflows',
  'Course ID: COURSE-LH-TECH1-001',
  'Status: Complete',
  'Instruction: 2/2 canonical lessons completed',
  'Course final outcome: passed',
  'Practical score: 94.0%',
  'Academic requirements reopened',
  'Version 1.0.0',
  'not a professional credential, license, certification, credential-eligibility decision'
]) assert.ok(transcript.includes(marker), `academic transcript missing: ${marker}`);
assert.equal(transcript.includes('evaluatorId'), false);
assert.equal(transcript.includes('evidenceOutputs'), false);
assert.equal(transcript.includes('answerKey'), false);

const json = JSON.parse(buildAcademicRecordJson(record, { generatedAt }));
assert.equal(json.exportType, 'thc-academy-academic-course-record');
assert.equal(json.generatedAt, generatedAt);
assert.equal(json.record.academicStatusHistory.length, 3);
assert.match(json.academicBoundary, /not a professional credential/i);

const files = academicRecordDownloadFiles(record, { generatedAt });
assert.match(files.transcript.filename, /academic-transcript\.txt$/);
assert.equal(files.transcript.type, 'text/plain;charset=utf-8');
assert.match(files.data.filename, /academic-record\.json$/);
assert.equal(files.data.type, 'application/json;charset=utf-8');

for (const marker of [
  "import { buildAcademicCourseRecord } from './progress.js'",
  '/api/v1/me/progress',
  '/api/v1/me/enrollments',
  '/api/v1/me/courses/${COURSE_ID}/evidence',
  "credentials: 'same-origin'",
  'Download completion transcript',
  'Download academic transcript',
  'Download record data',
  'new Blob',
  'URL.createObjectURL',
  "className = 'record-button'"
]) assert.ok(runtime.includes(marker), `completion download runtime missing: ${marker}`);
assert.equal(runtime.includes('.innerHTML'), false, 'completion downloads must not use innerHTML');
assert.match(html, /<script type="module" src="\/completion-documents\.js"><\/script>/);
assert.ok(webServerSource.includes("['/completion-documents.js', ['completion-documents.js', 'text/javascript; charset=utf-8']]"), 'Academy web server must serve completion download module');

const server = createAcademyWebServer({ env: { NODE_ENV: 'test', ACADEMY_PREVIEW_DRAFTS: '0' }, apiHandler: null });
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
try {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/completion-documents.js`);
  assert.equal(response.status, 200, 'Academy server must serve academic download runtime');
  assert.match(response.headers.get('content-type') ?? '', /text\/javascript/);
  const served = await response.text();
  assert.ok(served.includes('buildAcademicTranscriptText'));
} finally {
  await new Promise((resolve) => server.close(resolve));
}

const reportStore = {
  async listCourseReportRows() {
    return [
      {
        learnerSubject: 'learner-1', enrollmentStatus: 'completed', academicTransitionCount: 3, academicReopenCount: 1,
        firstAcademicCompletedAt: '2026-09-21T12:00:00.000Z', latestAcademicCompletedAt: '2026-09-23T12:00:00.000Z', latestAcademicReopenedAt: '2026-09-22T12:00:00.000Z',
        latestAcademicTransitionType: 'course-enrollment-academic-completed', latestAcademicTransitionAt: '2026-09-23T12:00:01.000Z',
        practicalStatus: 'passed', scorePercent: 94, criticalErrorCount: 0, followUpStatus: 'closed', reassessmentTargetDate: '',
        assignedEvaluatorId: 'eval-1', assignedAt: '2026-09-20T12:00:00.000Z', evaluatedAt: '2026-09-21T12:00:00.000Z', updatedAt: '2026-09-23T12:00:01.000Z'
      },
      {
        learnerSubject: 'learner-2', enrollmentStatus: 'active', academicTransitionCount: 2, academicReopenCount: 1,
        firstAcademicCompletedAt: '2026-09-10T12:00:00.000Z', latestAcademicCompletedAt: '2026-09-10T12:00:00.000Z', latestAcademicReopenedAt: '2026-09-11T12:00:00.000Z',
        latestAcademicTransitionType: 'course-enrollment-academic-reopened', latestAcademicTransitionAt: '2026-09-11T12:00:00.000Z',
        practicalStatus: 'failed', scorePercent: 72, criticalErrorCount: 1, followUpStatus: 'remediation-assigned', reassessmentTargetDate: '2026-09-30',
        assignedEvaluatorId: null, assignedAt: null, evaluatedAt: '2026-09-10T12:00:00.000Z', updatedAt: '2026-09-11T12:00:00.000Z'
      }
    ];
  }
};
const reportResult = await buildCoursePracticalReport({ store: reportStore, courseId: 'COURSE-LH-TECH1-001' });
assert.equal(reportResult.status, 200);
assert.equal(reportResult.body.summary.academicCompleted, 1);
assert.equal(reportResult.body.summary.academicEverReopened, 2);
assert.equal(reportResult.body.summary.academicTransitions, 5);
const csv = coursePracticalReportCsv(reportResult.body);
for (const header of ['academicTransitionCount','academicReopenCount','firstAcademicCompletedAt','latestAcademicCompletedAt','latestAcademicReopenedAt','latestAcademicTransitionType','latestAcademicTransitionAt']) assert.ok(csv.split('\n')[0].includes(header), `admin CSV missing ${header}`);
assert.ok(csv.includes('2026-09-23T12:00:00.000Z'));
assert.ok(csv.includes('2026-09-22T12:00:00.000Z'));
assert.equal(csv.includes('evaluatorNotes'), false);
assert.equal(csv.includes('evidenceOutputs'), false);

console.log('Course 1 learner academic transcript/data downloads, HTTP serving, and privacy-bounded admin completion/reopen exports passed.');
