import assert from 'node:assert/strict';
import { projectAssessmentFeedback } from '../apps/api/src/assessment-delivery.mjs';

const scoredAttempt = {
  status: 'scored',
  scorePercent: 80,
  passed: true,
  items: [
    { competency: 'COMP-A', score: 1, maxScore: 1 },
    { competency: 'COMP-A', score: 0, maxScore: 1 },
    { competency: 'COMP-B', score: 1, maxScore: 1 }
  ]
};

let feedback = projectAssessmentFeedback({
  assessment: { id: 'ASSESS-TEST-001', feedbackMode: 'post-attempt-domain-level' },
  scoredAttempt
});
assert.equal(feedback.scorePercent, 80);
assert.equal(feedback.passed, true);
assert.equal(feedback.competencies.length, 2);
assert.equal(feedback.competencies[0].competency, 'COMP-A');

feedback = projectAssessmentFeedback({ assessment: { id: 'ASSESS-TEST-001' }, scoredAttempt });
assert.deepEqual(feedback, { scorePercent: 80, passed: true });

feedback = projectAssessmentFeedback({
  assessment: { id: 'ASSESS-TEST-001', feedbackMode: 'unrecognized-mode' },
  scoredAttempt
});
assert.deepEqual(feedback, { scorePercent: 80, passed: true });

assert.deepEqual(
  projectAssessmentFeedback({
    assessment: { id: 'ASSESS-TEST-001', feedbackMode: 'post-attempt-domain-level' },
    scoredAttempt: { status: 'submitted' }
  }),
  {}
);

console.log('Assessment feedback policy tests passed.');
