import assert from 'node:assert/strict';
import { createPostgresPracticalEvaluatorStore } from '../apps/api/src/postgres-practical-evaluator-store.mjs';

const calls = [];
let learnerExists = true;
const learnerId = '00000000-0000-0000-0000-000000000001';
const storedRow = {
  assessment_id: 'PRACTICAL-LH-TECH1-001-WORKFLOW', assessment_version: '1.0.0', status: 'failed', score_percent: '92.00', critical_error_count: 1,
  evidence_json: { evaluatorNotes: 'Private evaluator note', learnerFeedback: 'Practice identity discrepancy escalation.', followUpStatus: 'remediation-assigned', reassessmentTargetDate: '2026-09-20', evidenceOutputs: [], domainScores: [], criticalErrors: [], history: [] },
  evaluator_id: 'assessor-001', evaluated_at: new Date('2026-09-12T12:00:00.000Z'), updated_at: new Date('2026-09-12T12:01:00.000Z'),
  assigned_evaluator_id: 'assessor-001', assigned_by: 'admin-001', assigned_at: new Date('2026-09-12T11:00:00.000Z'), assignment_updated_at: new Date('2026-09-12T11:00:00.000Z')
};
const queueDbRow = {
  external_subject: 'learner-external-001', enrollment_status: 'active', enrolled_at: new Date('2026-09-10T09:00:00.000Z'), practical_status: 'failed', score_percent: '92.00', critical_error_count: 1,
  follow_up_status: 'remediation-assigned', reassessment_target_date: '2026-09-20', assigned_evaluator_id: 'assessor-001', assigned_by: 'admin-001', assigned_at: new Date('2026-09-12T11:00:00.000Z'),
  evaluated_at: new Date('2026-09-12T12:00:00.000Z'), updated_at: new Date('2026-09-12T12:01:00.000Z'), total_count: 1
};

async function query(text, params) {
  calls.push({ text, params });
  if (text.includes('join enrollments e')) return { rows: [queueDbRow] };
  if (text.includes('select id from learners')) return { rows: learnerExists ? [{ id: learnerId }] : [] };
  if (text.includes('from learners l') && text.includes('left join performance_assessment_results')) return { rows: [storedRow] };
  if (text.startsWith('insert into practical_evaluation_assignments')) return { rows: [{ assigned_evaluator_id: params[4], assigned_by: params[5], assigned_at: new Date('2026-09-12T13:00:00.000Z'), assignment_updated_at: new Date('2026-09-12T13:00:00.000Z') }] };
  if (text.startsWith('delete from practical_evaluation_assignments')) return { rows: [{ evaluator_id: 'assessor-001' }] };
  if (text.includes('insert into performance_assessment_results')) return { rows: [storedRow] };
  throw new Error(`unexpected query: ${text}`);
}

const store = createPostgresPracticalEvaluatorStore({ query });
const queue = await store.listCourseLearners({ courseId: 'COURSE-LH-TECH1-001', assessmentId: storedRow.assessment_id, assessmentVersion: storedRow.assessment_version, search: 'learner', practicalStatus: 'failed', assignmentFilter: 'mine', evaluatorId: 'assessor-001', page: 2, pageSize: 25 });
assert.equal(queue.total, 1); assert.equal(queue.page, 2); assert.equal(queue.pageSize, 25); assert.equal(queue.items[0].assignedEvaluatorId, 'assessor-001');
const queueCall = calls.find((call) => call.text.includes('join enrollments e'));
assert.ok(queueCall.text.includes('practical_evaluation_assignments'));
assert.ok(queueCall.text.includes('count(*) over()'));
assert.ok(queueCall.text.includes('limit $8 offset $9'));
assert.deepEqual(queueCall.params, ['COURSE-LH-TECH1-001', storedRow.assessment_id, storedRow.assessment_version, 'learner', 'failed', 'mine', 'assessor-001', 25, 25]);
assert.equal(queueCall.text.includes('learner-external-001'), false, 'queue learner search must remain parameterized');

const reportRows = await store.listCourseReportRows({ courseId: 'COURSE-LH-TECH1-001', assessmentId: storedRow.assessment_id, assessmentVersion: storedRow.assessment_version });
assert.equal(reportRows.length, 1); assert.equal(reportRows[0].followUpStatus, 'remediation-assigned');
const reportCall = calls.filter((call) => call.text.includes('join enrollments e')).at(-1);
assert.equal(reportCall.text.includes('limit $8 offset $9'), false, 'administrative report should not silently truncate the cohort');

const fetched = await store.getEvaluation('learner-external-001', { courseId: 'COURSE-LH-TECH1-001', assessmentId: storedRow.assessment_id, assessmentVersion: storedRow.assessment_version });
assert.equal(fetched.learnerExists, true); assert.equal(fetched.evaluation.evidence.evaluatorNotes, 'Private evaluator note'); assert.equal(fetched.assignment.evaluatorId, 'assessor-001');

const claimed = await store.claimEvaluator('learner-external-001', { courseId: 'COURSE-LH-TECH1-001', assessmentId: storedRow.assessment_id, assessmentVersion: storedRow.assessment_version, evaluatorId: 'assessor-001' });
assert.equal(claimed.conflict, false); assert.equal(claimed.assignment.evaluatorId, 'assessor-001');
const claimCall = calls.find((call) => call.text.startsWith('insert into practical_evaluation_assignments'));
assert.ok(claimCall.text.includes('where practical_evaluation_assignments.evaluator_id = excluded.evaluator_id'), 'evaluator claim must not overwrite another evaluator');

const reassigned = await store.setEvaluatorAssignment('learner-external-001', { courseId: 'COURSE-LH-TECH1-001', assessmentId: storedRow.assessment_id, assessmentVersion: storedRow.assessment_version, evaluatorId: 'assessor-002', assignedBy: 'admin-001' });
assert.equal(reassigned.assignment.evaluatorId, 'assessor-002');
const released = await store.releaseEvaluator('learner-external-001', { courseId: 'COURSE-LH-TECH1-001', assessmentId: storedRow.assessment_id, assessmentVersion: storedRow.assessment_version, evaluatorId: 'assessor-001' });
assert.equal(released.released, true);

const writeRecord = { assessmentId: storedRow.assessment_id, assessmentVersion: storedRow.assessment_version, status: 'failed', scorePercent: 92, criticalErrorCount: 1, evidence: storedRow.evidence_json, evaluatorId: 'assessor-001', evaluatedAt: '2026-09-12T12:00:00.000Z' };
const saved = await store.saveEvaluation('learner-external-001', writeRecord);
assert.equal(saved.evaluation.status, 'failed');
const write = calls.find((call) => call.text.includes('insert into performance_assessment_results'));
assert.ok(write.text.includes("'course-practical-evaluation-saved'"));
assert.equal(write.text.includes('Private evaluator note'), false); assert.equal(write.params[6], JSON.stringify(storedRow.evidence_json)); assert.equal(write.params[7], 'assessor-001');
assert.equal(write.text.includes('evaluatorNotes'), false); assert.equal(write.text.includes('learnerFeedback'), false);

learnerExists = false;
const missing = await store.getEvaluation('missing-learner', { courseId: 'COURSE-LH-TECH1-001', assessmentId: storedRow.assessment_id, assessmentVersion: storedRow.assessment_version });
assert.deepEqual(missing, { learnerExists: false, evaluation: null, assignment: null });
const missingClaim = await store.claimEvaluator('missing-learner', { courseId: 'COURSE-LH-TECH1-001', assessmentId: storedRow.assessment_id, assessmentVersion: storedRow.assessment_version, evaluatorId: 'assessor-001' });
assert.equal(missingClaim.learnerExists, false);

console.log('Course 1 evaluator PostgreSQL pagination, assignment ownership, reporting, audit-event, parameterization, and privacy contracts passed.');
