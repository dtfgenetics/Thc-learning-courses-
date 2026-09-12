import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  createCourseAssessmentAttempt,
  presentCourseAssessmentAttempt,
  presentCourseAssessmentItem,
  normalizePresentedResponse,
  scorePersistedCourseAssessment
} from '../packages/domain/course-assessment-runtime.mjs';

const root = process.cwd();
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const assessment = read('content/assessments/ASSESS-LH-TECH1-001-FINAL.json');
const itemBank = assessment.items.map((id) => read(`content/questions/${id}.json`));

assert.equal(itemBank.length, 36);
assert.equal(assessment.extensions?.gradingPolicy?.algorithmVersion, 'course-grader-2.0.0');
assert.equal(assessment.extensions?.gradingPolicy?.requireCompetencyMinimums, true);
for (const item of itemBank) {
  assert.equal(item.purpose, 'summative');
  assert.ok(['multiple-choice', 'scenario', 'case-study', 'multiple-response', 'numeric'].includes(item.type), `${item.id} uses unsupported learner runtime type ${item.type}`);
}

const attempt = createCourseAssessmentAttempt({
  learnerId: 'learner-runtime-test',
  assessment,
  itemBank,
  now: '2026-09-11T20:00:00.000Z',
  seed: 'course1-runtime-test'
});
assert.equal(attempt.status, 'started');
assert.equal(attempt.items.length, 36);
assert.equal(new Set(attempt.items.map((row) => row.itemId)).size, 36);

const view = presentCourseAssessmentAttempt({ assessment, attempt, itemBank });
assert.equal(view.items.length, 36);
const serialized = JSON.stringify(view);
for (const forbidden of ['"correct"', '"rationale"', 'answerKey', 'scoringKey']) assert.equal(serialized.includes(forbidden), false, `learner attempt leaked ${forbidden}`);
assert.equal(serialized.includes('credential-purpose'), false);

for (const row of attempt.items) {
  const item = itemBank.find((candidate) => candidate.id === row.itemId && Number(candidate.version) === Number(row.itemVersion));
  const canonicalCorrect = item.correct;
  if (['multiple-choice', 'scenario', 'case-study'].includes(item.type)) {
    const presented = presentCourseAssessmentItem(item, { formId: attempt.formId, response: canonicalCorrect, randomizeChoices: assessment.randomizeChoices !== false });
    const normalized = normalizePresentedResponse(item, { formId: attempt.formId, response: presented.response, randomizeChoices: assessment.randomizeChoices !== false });
    assert.equal(normalized, canonicalCorrect, `${item.id} choice permutation must round-trip`);
    row.response = normalized;
  } else if (item.type === 'multiple-response') {
    const presented = presentCourseAssessmentItem(item, { formId: attempt.formId, response: canonicalCorrect, randomizeChoices: assessment.randomizeChoices !== false });
    const normalized = normalizePresentedResponse(item, { formId: attempt.formId, response: presented.response, randomizeChoices: assessment.randomizeChoices !== false });
    assert.deepEqual(normalized, [...canonicalCorrect].sort((a, b) => a - b), `${item.id} multi-response permutation must round-trip`);
    row.response = normalized;
  } else if (item.type === 'numeric') row.response = canonicalCorrect;
}

const scored = scorePersistedCourseAssessment({ assessment, attempt, itemBank, now: '2026-09-11T21:00:00.000Z' });
assert.equal(scored.attempt.status, 'scored');
assert.equal(scored.attempt.scorePercent, 100);
assert.equal(scored.attempt.passed, true);
assert.equal(scored.algorithmVersion, 'course-grader-2.0.0');
assert.equal(scored.competencyResults.length, 6);
assert.equal(scored.objectiveResults.length, 12);
assert.equal(scored.failedCompetencyMinimums.length, 0);
assert.ok(scored.competencyResults.every((row) => row.scorePercent === 100 && row.masteryLevel === 'demonstrated'));

const incomplete = createCourseAssessmentAttempt({ learnerId: 'incomplete', assessment, itemBank, seed: 'incomplete' });
assert.throws(() => scorePersistedCourseAssessment({ assessment, attempt: incomplete, itemBank }), /unanswered item/);

const syntheticAssessment = {
  id: 'ASSESS-SYNTHETIC-COURSE-GRADER',
  version: '1.0.0',
  passingScorePercent: 80,
  extensions: {
    gradingPolicy: {
      multipleResponseMethod: 'partial-credit',
      multipleResponseIncorrectPenalty: 0.5,
      requireCompetencyMinimums: true,
      masteryBands: { demonstratedPercent: 80, developingPercent: 60 },
      competencyMinimums: { 'COMP-SAFETY-WORK-001': 70 }
    }
  }
};
const syntheticBank = [
  { id: 'ITEM-SYN-SAFETY', version: 1, type: 'multiple-choice', competency: 'COMP-SAFETY-WORK-001', objective: 'LO-SYN-01', choices: ['Stop', 'Continue'], correct: 0, extensions: { grading: { weight: 1 } } },
  { id: 'ITEM-SYN-WEIGHTED', version: 1, type: 'multiple-choice', competency: 'COMP-PRO-QA-001', objective: 'LO-SYN-02', choices: ['A', 'B'], correct: 0, extensions: { grading: { weight: 9 } } }
];
const floorAttempt = {
  id: 'ATTEMPT-FLOOR', learnerId: 'learner', assessmentId: syntheticAssessment.id, assessmentVersion: syntheticAssessment.version,
  formId: 'FORM-FLOOR', status: 'started', startedAt: '2026-09-12T10:00:00.000Z', submittedAt: null, scoredAt: null,
  items: [
    { position: 1, itemId: 'ITEM-SYN-SAFETY', itemVersion: 1, competency: 'COMP-SAFETY-WORK-001', response: 1, score: null, maxScore: 1 },
    { position: 2, itemId: 'ITEM-SYN-WEIGHTED', itemVersion: 1, competency: 'COMP-PRO-QA-001', response: 0, score: null, maxScore: 1 }
  ]
};
const floorScored = scorePersistedCourseAssessment({ assessment: syntheticAssessment, attempt: floorAttempt, itemBank: syntheticBank });
assert.equal(floorScored.attempt.scorePercent, 90);
assert.equal(floorScored.overallScorePassed, true);
assert.equal(floorScored.competencyMinimumsPassed, false);
assert.equal(floorScored.attempt.passed, false, 'overall score must not hide a failed configured competency minimum');
assert.deepEqual(floorScored.failedCompetencyMinimums, [{ competency: 'COMP-SAFETY-WORK-001', scorePercent: 0, minimumPercent: 70 }]);

const partialAssessment = {
  id: 'ASSESS-SYNTHETIC-PARTIAL', version: '1.0.0', passingScorePercent: 0,
  extensions: { gradingPolicy: { multipleResponseMethod: 'partial-credit', multipleResponseIncorrectPenalty: 0.5, requireCompetencyMinimums: false } }
};
const partialBank = [
  { id: 'ITEM-SYN-MR', version: 1, type: 'multiple-response', competency: 'COMP-PRO-QA-001', objective: 'LO-SYN-03', choices: ['A','B','C','D'], correct: [0,1] },
  { id: 'ITEM-SYN-NUM', version: 1, type: 'numeric', competency: 'COMP-PRO-QA-001', objective: 'LO-SYN-04', correct: 10, extensions: { grading: { absoluteTolerance: 0.5 } } }
];
const partialAttempt = {
  id: 'ATTEMPT-PARTIAL', learnerId: 'learner', assessmentId: partialAssessment.id, assessmentVersion: partialAssessment.version,
  formId: 'FORM-PARTIAL', status: 'started', startedAt: '2026-09-12T10:00:00.000Z', submittedAt: null, scoredAt: null,
  items: [
    { position: 1, itemId: 'ITEM-SYN-MR', itemVersion: 1, competency: 'COMP-PRO-QA-001', response: [0], score: null, maxScore: 1 },
    { position: 2, itemId: 'ITEM-SYN-NUM', itemVersion: 1, competency: 'COMP-PRO-QA-001', response: 10.4, score: null, maxScore: 1 }
  ]
};
const partialScored = scorePersistedCourseAssessment({ assessment: partialAssessment, attempt: partialAttempt, itemBank: partialBank });
assert.equal(partialScored.attempt.items[0].score, 0.5, 'one of two correct selections earns partial credit without an incorrect selection');
assert.equal(partialScored.attempt.items[1].score, 1, 'numeric response inside configured tolerance receives credit');
assert.equal(partialScored.attempt.scorePercent, 75);

console.log('Course 1 final runtime, non-disclosure, grader-v2 partial credit, numeric tolerance, objective results, and competency-floor tests passed.');
