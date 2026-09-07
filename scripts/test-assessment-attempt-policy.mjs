import assert from 'node:assert/strict';
import { evaluateAssessmentAttemptPolicy } from '../packages/domain/assessment-attempt-policy.mjs';

const assessment = {
  id: 'ASSESS-TEST-001',
  maxAttempts: 3,
  cooldownHours: 24
};
const now = '2026-09-06T12:00:00.000Z';

const first = evaluateAssessmentAttemptPolicy({ assessment, attempts: [], now });
assert.equal(first.allowed, true);
assert.equal(first.attemptsUsed, 0);
assert.equal(first.maxAttempts, 3);

const active = evaluateAssessmentAttemptPolicy({
  assessment,
  attempts: [{ id: 'ATTEMPT-A', status: 'started', startedAt: '2026-09-06T11:00:00.000Z' }],
  now
});
assert.equal(active.allowed, false);
assert.equal(active.reason, 'active-attempt');
assert.equal(active.attemptId, 'ATTEMPT-A');

const submitted = evaluateAssessmentAttemptPolicy({
  assessment,
  attempts: [{ id: 'ATTEMPT-B', status: 'submitted', startedAt: '2026-09-06T10:00:00.000Z' }],
  now
});
assert.equal(submitted.allowed, false);
assert.equal(submitted.reason, 'active-attempt');

const cooldown = evaluateAssessmentAttemptPolicy({
  assessment,
  attempts: [{ id: 'ATTEMPT-C', status: 'scored', startedAt: '2026-09-06T00:00:00.000Z', passed: false }],
  now
});
assert.equal(cooldown.allowed, false);
assert.equal(cooldown.reason, 'cooldown');
assert.equal(cooldown.retryAt, '2026-09-07T00:00:00.000Z');
assert.equal(cooldown.retryAfterSeconds, 43200);

const afterCooldown = evaluateAssessmentAttemptPolicy({
  assessment,
  attempts: [{ id: 'ATTEMPT-C', status: 'scored', startedAt: '2026-09-05T00:00:00.000Z', passed: false }],
  now
});
assert.equal(afterCooldown.allowed, true);
assert.equal(afterCooldown.attemptsUsed, 1);

const maxed = evaluateAssessmentAttemptPolicy({
  assessment,
  attempts: [
    { id: 'ATTEMPT-1', status: 'scored', startedAt: '2026-09-01T00:00:00.000Z' },
    { id: 'ATTEMPT-2', status: 'scored', startedAt: '2026-09-02T00:00:00.000Z' },
    { id: 'ATTEMPT-3', status: 'scored', startedAt: '2026-09-03T00:00:00.000Z' }
  ],
  now
});
assert.equal(maxed.allowed, false);
assert.equal(maxed.reason, 'max-attempts');
assert.equal(maxed.attemptsUsed, 3);

const voidedDoesNotCount = evaluateAssessmentAttemptPolicy({
  assessment,
  attempts: [
    { id: 'ATTEMPT-V', status: 'voided', startedAt: '2026-09-06T11:59:00.000Z' },
    { id: 'ATTEMPT-OLD', status: 'scored', startedAt: '2026-09-01T00:00:00.000Z' }
  ],
  now
});
assert.equal(voidedDoesNotCount.allowed, true);
assert.equal(voidedDoesNotCount.attemptsUsed, 1);

assert.throws(() => evaluateAssessmentAttemptPolicy({ attempts: [] }), /assessment definition required/);

console.log('Assessment attempt policy tests passed.');
