import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPracticalEvaluation, practicalEvaluatorView } from '../packages/domain/course-practical-evaluation.mjs';

const practical = JSON.parse(fs.readFileSync('content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json', 'utf8'));
const fullScores = practical.scoring.domains.map((domain) => ({ name: domain.name, score: domain.points }));
const belowThresholdScores = practical.scoring.domains.map((domain, index) => ({ name: domain.name, score: index < 2 ? 0 : domain.points }));
const verifiedEvidence = practical.evidenceOutputs.map((name, index) => ({
  name,
  status: 'verified',
  reference: `packet-${index + 1}`,
  note: `Verified against practical artifact ${index + 1}.`
}));
const reviewedButNotVerified = practical.evidenceOutputs.map((name, index) => ({
  name,
  status: index === 0 ? 'needs-revision' : 'received',
  reference: `packet-${index + 1}`,
  note: `Reviewed evidence ${index + 1}.`
}));
const evaluatorId = 'assessor-001';
const now = '2026-09-12T12:00:00.000Z';

const saved = buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'save',
  domainScores: fullScores.slice(0, 3),
  evidenceOutputs: verifiedEvidence.slice(0, 2),
  followUpStatus: 'remediation-in-progress',
  evaluatorNotes: 'Private coaching observation',
  learnerFeedback: 'Practice the handoff read-back sequence.'
} });
assert.equal(saved.status, 'in-progress');
assert.equal(saved.scorePercent, null);
assert.equal(saved.evaluatedAt, null);
assert.equal(saved.evidence.domainScores.length, practical.scoring.domains.length);
assert.equal(saved.evidence.domainScores.filter((row) => row.score != null).length, 3);
assert.equal(saved.evidence.evidenceOutputs.length, practical.evidenceOutputs.length);
assert.equal(saved.evidence.evidenceOutputs[0].status, 'verified');
assert.equal(saved.evidence.evidenceOutputs[2].status, 'not-reviewed');
assert.equal(saved.evidence.followUpStatus, 'remediation-in-progress');
assert.equal(saved.evidence.domainScores[0].performanceLevel, 'strong');

const passed = buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'finalize', domainScores: fullScores, evidenceOutputs: verifiedEvidence, criticalErrorIndexes: [], learnerFeedback: 'Strong performance.'
} });
assert.equal(passed.status, 'passed');
assert.equal(passed.scorePercent, 100);
assert.equal(passed.criticalErrorCount, 0);
assert.equal(passed.evaluatedAt, now);
assert.equal(passed.evidence.followUpStatus, 'closed');
assert.equal(passed.evidence.gradingDecision.overallScorePassed, true);
assert.equal(passed.evidence.gradingDecision.domainMinimumsPassed, true);
assert.equal(passed.evidence.gradingDecision.evidenceVerified, true);
assert.ok(passed.evidence.domainScores.every((row) => row.performanceLevel === 'strong'));

const evidenceFail = buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'finalize', domainScores: fullScores, evidenceOutputs: reviewedButNotVerified, criticalErrorIndexes: [], learnerFeedback: 'One artifact requires revision.'
} });
assert.equal(evidenceFail.status, 'failed', 'unverified required evidence must block a passing practical decision');
assert.equal(evidenceFail.scorePercent, 100);
assert.equal(evidenceFail.evidence.gradingDecision.evidenceReviewed, true);
assert.equal(evidenceFail.evidence.gradingDecision.evidenceVerified, false);
assert.equal(evidenceFail.evidence.gradingDecision.evidenceRulePassed, false);

assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'finalize', domainScores: fullScores, evidenceOutputs: verifiedEvidence.slice(0, 6), criticalErrorIndexes: []
} }), /all practical evidence outputs must be reviewed/);

const criticalFail = buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'finalize', domainScores: fullScores, evidenceOutputs: verifiedEvidence, criticalErrorIndexes: [1], evaluatorNotes: 'Observed bypass of the supplied restricted-entry control after the learner identified the posted restriction.'
} });
assert.equal(criticalFail.status, 'failed', 'a critical error must override an otherwise passing point score');
assert.equal(criticalFail.scorePercent, 100);
assert.equal(criticalFail.criticalErrorCount, 1);
assert.equal(criticalFail.evidence.followUpStatus, 'remediation-assigned');
assert.equal(criticalFail.evidence.gradingDecision.criticalErrorRulePassed, false);

assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'finalize', domainScores: fullScores, evidenceOutputs: verifiedEvidence, criticalErrorIndexes: [0], evaluatorNotes: 'Too short'
} }), /critical-error findings require documented evaluator context/);

const scoreFail = buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'finalize', domainScores: belowThresholdScores, evidenceOutputs: verifiedEvidence, criticalErrorIndexes: []
} });
assert.equal(scoreFail.status, 'failed');
assert.ok(scoreFail.scorePercent < practical.passingStandard.minimumPercent);
assert.ok(scoreFail.evidence.gradingDecision.failedDomainMinimums.length > 0);

const domainFloorScores = fullScores.map((row) => ({ ...row }));
const safetyDomain = domainFloorScores.find((row) => row.name === 'Safety, PPE and stop-work judgment');
safetyDomain.score = Math.max(0, Math.floor(practical.scoring.domains.find((row) => row.name === safetyDomain.name).points * 0.5));
const domainFloorFail = buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'finalize', domainScores: domainFloorScores, evidenceOutputs: verifiedEvidence, criticalErrorIndexes: []
} });
assert.ok(domainFloorFail.scorePercent >= practical.passingStandard.minimumPercent, 'test setup should keep overall score above the course threshold');
assert.equal(domainFloorFail.status, 'failed', 'a required domain floor must block an otherwise passing total');
assert.equal(domainFloorFail.evidence.gradingDecision.domainMinimumsPassed, false);

assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'finalize', domainScores: fullScores.slice(0, 7), evidenceOutputs: verifiedEvidence
} }), /all practical scoring domains are required/);
assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'save', domainScores: [{ name: practical.scoring.domains[0].name, score: practical.scoring.domains[0].points + 1 }]
} }), /invalid score/);
assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'save', domainScores: [{ name: 'Invented scoring domain', score: 1 }]
} }), /unknown practical scoring domain/);
assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'save', criticalErrorIndexes: [999]
} }), /invalid critical error index/);
assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'save', evidenceOutputs: [{ name: 'Invented evidence output', status: 'received' }]
} }), /unknown practical evidence output/);
assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'save', evidenceOutputs: [{ name: practical.evidenceOutputs[0], status: 'made-up' }]
} }), /invalid evidence output status/);
assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'save', followUpStatus: 'reassessment-scheduled'
} }), /reassessmentTargetDate is required/);
assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'save', reassessmentTargetDate: '09/12/2026'
} }), /YYYY-MM-DD/);
assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'finalize', domainScores: fullScores, evidenceOutputs: verifiedEvidence, followUpStatus: 'remediation-assigned'
} }), /passed practical cannot require remediation/);

const replacement = buildPracticalEvaluation({ practical, existing: passed, evaluatorId: 'assessor-002', evaluatedAt: '2026-09-12T13:00:00.000Z', input: {
  mode: 'finalize', domainScores: fullScores, evidenceOutputs: verifiedEvidence, criticalErrorIndexes: [0], evaluatorNotes: 'Observed deliberate falsification of the supplied traceability record during the equivalent reassessment.', learnerFeedback: 'Equivalent reassessment required.'
} });
assert.equal(replacement.status, 'failed');
assert.equal(replacement.evidence.history.length, 1);
assert.equal(replacement.evidence.history[0].status, 'passed');
assert.equal(replacement.evidence.history[0].evaluatorId, evaluatorId);
assert.ok(replacement.evidence.history[0].gradingDecision, 'finalized history must preserve the rubric decision record');
assert.throws(() => buildPracticalEvaluation({ practical, existing: passed, evaluatorId, input: {
  mode: 'save', domainScores: fullScores.slice(0, 2)
} }), /explicit reassessment/);

const reassessmentDraft = buildPracticalEvaluation({ practical, existing: replacement, evaluatorId: 'assessor-003', evaluatedAt: '2026-09-13T09:00:00.000Z', input: {
  mode: 'save',
  startReassessment: true,
  domainScores: fullScores.slice(0, 2),
  evidenceOutputs: verifiedEvidence.map((row) => ({ ...row, status: 'not-reviewed', reference: '', note: '' })),
  followUpStatus: 'remediation-in-progress',
  learnerFeedback: 'Equivalent reassessment started after targeted practice.'
} });
assert.equal(reassessmentDraft.status, 'in-progress');
assert.equal(reassessmentDraft.evidence.history.length, 2);
assert.equal(reassessmentDraft.evidence.history.at(-1).status, 'failed');
assert.equal(reassessmentDraft.evidence.domainScores.filter((row) => row.score != null).length, 2);

const scheduled = buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'save',
  followUpStatus: 'reassessment-scheduled',
  reassessmentTargetDate: '2026-09-20'
} });
assert.equal(scheduled.evidence.reassessmentTargetDate, '2026-09-20');

const view = practicalEvaluatorView(practical, { ...reassessmentDraft, updatedAt: '2026-09-13T09:01:00.000Z' });
assert.equal(view.evaluation.evidenceOutputs.length, practical.evidenceOutputs.length);
assert.equal(view.evaluation.followUpStatus, 'remediation-in-progress');
assert.equal(view.evaluation.history.length, 2);
assert.deepEqual(view.practical.evidenceOutputStatuses.sort(), ['needs-revision', 'not-reviewed', 'received', 'verified'].sort());
assert.ok(view.practical.followUpStatuses.includes('ready-for-reassessment'));
assert.equal(view.practical.gradingRubric.version, practical.extensions.gradingRubric.version);
assert.ok(view.practical.gradingRubric.levels.some((row) => row.id === 'competent'));
assert.ok(view.practical.scoring.domains.every((row) => row.anchors && row.anchors.competent));

const longPrivate = 'x'.repeat(5000);
const longLearner = 'y'.repeat(3000);
const truncated = buildPracticalEvaluation({ practical, evaluatorId, input: { mode: 'save', evaluatorNotes: longPrivate, learnerFeedback: longLearner } });
assert.equal(truncated.evidence.evaluatorNotes.length, 4000);
assert.equal(truncated.evidence.learnerFeedback.length, 2500);

console.log('Course 1 practical anchored-rubric scoring, evidence verification, domain floors, critical-error documentation, reassessment history, and validation contracts passed.');
