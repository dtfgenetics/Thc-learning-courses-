import assert from 'node:assert/strict';
import { evaluateAssessmentAttemptPolicy } from '../packages/domain/assessment-attempt-policy.mjs';

const assessment = {
  id: 'ASSESS-CULT-FOUNDATIONS-FINAL-001',
  version: '1.0.0',
  maxAttempts: 3,
  cooldownHours: 24
};
const now = '2026-09-07T00:00:00.000Z';

let policy = evaluateAssessmentAttemptPolicy({ assessment, attempts: [], now });
assert.equal(policy.allowed, true);
assert.equal(policy.attemptsUsed, 0);
assert.equal(policy.attemptsRemaining, 3);

policy = evaluateAssessmentAttemptPolicy({
  assessment,
  now,
  attempts: [{
    id: 'attempt-active',
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    status: 'started',
    startedAt: '2026-09-06T23:00:00.000Z'
  }]
});
assert.equal(policy.allowed, false);
assert.equal(policy.reason, 'active-attempt-exists');
assert.equal(policy.activeAttemptId, 'attempt-active');
assert.equal(policy.attemptsUsed, 1);
assert.equal(policy.attemptsRemaining, 2);

policy = evaluateAssessmentAttemptPolicy({
  assessment,
  now,
  attempts: [{
    id: 'attempt-scored',
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    status: 'scored',
    startedAt: '2026-09-06T20:00:00.000Z',
    scoredAt: '2026-09-06T21:00:00.000Z'
  }]
});
assert.equal(policy.allowed, false);
assert.equal(policy.reason, 'cooldown-active');
assert.equal(policy.nextAllowedAt, '2026-09-07T21:00:00.000Z');
assert.equal(policy.attemptsUsed, 1);
assert.equal(policy.attemptsRemaining, 2);

policy = evaluateAssessmentAttemptPolicy({
  assessment,
  now: '2026-09-08T22:00:00.000Z',
  attempts: [{
    id: 'attempt-scored',
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    status: 'scored',
    scoredAt: '2026-09-06T21:00:00.000Z'
  }]
});
assert.equal(policy.allowed, true);
assert.equal(policy.attemptsRemaining, 2);

policy = evaluateAssessmentAttemptPolicy({
  assessment,
  now: '2026-09-10T00:00:00.000Z',
  attempts: [1, 2, 3].map((index) => ({
    id: `attempt-${index}`,
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    status: 'scored',
    scoredAt: `2026-09-0${index + 5}T00:00:00.000Z`
  }))
});
assert.equal(policy.allowed, false);
assert.equal(policy.reason, 'max-attempts-reached');
assert.equal(policy.attemptsRemaining, 0);

policy = evaluateAssessmentAttemptPolicy({
  assessment,
  now,
  attempts: [
    {
      id: 'voided-attempt',
      assessmentId: assessment.id,
      assessmentVersion: assessment.version,
      status: 'voided',
      startedAt: '2026-09-06T23:00:00.000Z'
    },
    {
      id: 'old-version',
      assessmentId: assessment.id,
      assessmentVersion: '0.9.0',
      status: 'scored',
      scoredAt: '2026-09-06T23:30:00.000Z'
    }
  ]
});
assert.equal(policy.allowed, true);
assert.equal(policy.attemptsUsed, 0);
assert.equal(policy.attemptsRemaining, 3);

console.log('Assessment attempt policy tests passed.');
