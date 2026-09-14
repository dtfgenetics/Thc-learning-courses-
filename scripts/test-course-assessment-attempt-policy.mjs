import assert from 'node:assert/strict';
import { evaluateCourseAssessmentAttemptPolicy } from '../apps/api/src/course-assessment-service.mjs';

const now = '2026-09-13T21:00:00.000Z';

const unrestricted = evaluateCourseAssessmentAttemptPolicy({
  assessment: { maxAttempts: null, cooldownHours: 0 },
  attempts: [
    { status: 'scored', scoredAt: '2026-09-13T20:00:00.000Z' },
    { status: 'scored', scoredAt: '2026-09-13T20:30:00.000Z' }
  ],
  now
});
assert.equal(unrestricted.allowed, true, 'null/0 must preserve the current unlimited Course 1 learning policy');
assert.equal(unrestricted.attemptsUsed, 2);

const maxed = evaluateCourseAssessmentAttemptPolicy({
  assessment: { maxAttempts: 2, cooldownHours: 0 },
  attempts: [
    { status: 'scored', scoredAt: '2026-09-12T20:00:00.000Z' },
    { status: 'scored', scoredAt: '2026-09-13T20:00:00.000Z' },
    { status: 'started', startedAt: '2026-09-13T20:30:00.000Z' }
  ],
  now
});
assert.equal(maxed.allowed, false);
assert.equal(maxed.reason, 'assessment-max-attempts-reached');
assert.equal(maxed.attemptsUsed, 2, 'only finalized scored attempts consume the configured attempt limit');
assert.equal(maxed.maxAttempts, 2);

const cooling = evaluateCourseAssessmentAttemptPolicy({
  assessment: { maxAttempts: null, cooldownHours: 4 },
  attempts: [{ status: 'scored', scoredAt: '2026-09-13T19:30:00.000Z' }],
  now
});
assert.equal(cooling.allowed, false);
assert.equal(cooling.reason, 'assessment-cooldown-active');
assert.equal(cooling.retryAfter, '2026-09-13T23:30:00.000Z');

const cooled = evaluateCourseAssessmentAttemptPolicy({
  assessment: { maxAttempts: 5, cooldownHours: 4 },
  attempts: [{ status: 'scored', scoredAt: '2026-09-13T16:00:00.000Z' }],
  now
});
assert.equal(cooled.allowed, true);
assert.equal(cooled.attemptsUsed, 1);

const submittedOnly = evaluateCourseAssessmentAttemptPolicy({
  assessment: { maxAttempts: 1, cooldownHours: 24 },
  attempts: [{ status: 'submitted', submittedAt: '2026-09-13T20:00:00.000Z' }],
  now
});
assert.equal(submittedOnly.allowed, true, 'non-finalized states must not silently consume a completed-attempt allowance');

console.log('Course assessment max-attempt and cooldown policy tests passed.');
