import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPracticalEvaluation } from '../packages/domain/course-practical-evaluation.mjs';

const practical = JSON.parse(fs.readFileSync('content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json', 'utf8'));
const fullScores = practical.scoring.domains.map((domain) => ({ name: domain.name, score: domain.points }));
const eightyScores = practical.scoring.domains.map((domain, index) => ({ name: domain.name, score: index === 0 ? 0 : domain.points }));
const evaluatorId = 'assessor-001';
const now = '2026-09-12T12:00:00.000Z';

const saved = buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'save',
  domainScores: fullScores.slice(0, 3),
  evaluatorNotes: 'Private coaching observation',
  learnerFeedback: 'Practice the handoff read-back sequence.'
} });
assert.equal(saved.status, 'in-progress');
assert.equal(saved.scorePercent, null);
assert.equal(saved.evaluatedAt, null);
assert.equal(saved.evidence.domainScores.length, practical.scoring.domains.length);
assert.equal(saved.evidence.domainScores.filter((row) => row.score != null).length, 3);

const passed = buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'finalize', domainScores: fullScores, criticalErrorIndexes: [], learnerFeedback: 'Strong performance.'
} });
assert.equal(passed.status, 'passed');
assert.equal(passed.scorePercent, 100);
assert.equal(passed.criticalErrorCount, 0);
assert.equal(passed.evaluatedAt, now);

const criticalFail = buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'finalize', domainScores: fullScores, criticalErrorIndexes: [1]
} });
assert.equal(criticalFail.status, 'failed', 'a critical error must override an otherwise passing point score');
assert.equal(criticalFail.scorePercent, 100);
assert.equal(criticalFail.criticalErrorCount, 1);

const scoreFail = buildPracticalEvaluation({ practical, evaluatorId, evaluatedAt: now, input: {
  mode: 'finalize', domainScores: eightyScores, criticalErrorIndexes: []
} });
assert.equal(scoreFail.status, 'failed');
assert.ok(scoreFail.scorePercent < practical.passingStandard.minimumPercent);

assert.throws(() => buildPracticalEvaluation({ practical, evaluatorId, input: {
  mode: 'finalize', domainScores: fullScores.slice(0, 7)
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

const replacement = buildPracticalEvaluation({ practical, existing: passed, evaluatorId: 'assessor-002', evaluatedAt: '2026-09-12T13:00:00.000Z', input: {
  mode: 'finalize', domainScores: fullScores, criticalErrorIndexes: [0], learnerFeedback: 'Equivalent reassessment required.'
} });
assert.equal(replacement.status, 'failed');
assert.equal(replacement.evidence.history.length, 1);
assert.equal(replacement.evidence.history[0].status, 'passed');
assert.equal(replacement.evidence.history[0].evaluatorId, evaluatorId);
assert.throws(() => buildPracticalEvaluation({ practical, existing: passed, evaluatorId, input: {
  mode: 'save', domainScores: fullScores.slice(0, 2)
} }), /finalized practical evaluations can only be replaced/);

const longPrivate = 'x'.repeat(5000);
const longLearner = 'y'.repeat(3000);
const truncated = buildPracticalEvaluation({ practical, evaluatorId, input: { mode: 'save', evaluatorNotes: longPrivate, learnerFeedback: longLearner } });
assert.equal(truncated.evidence.evaluatorNotes.length, 4000);
assert.equal(truncated.evidence.learnerFeedback.length, 2500);

console.log('Course 1 practical evaluation domain scoring, critical-error override, revision history, and validation contracts passed.');
