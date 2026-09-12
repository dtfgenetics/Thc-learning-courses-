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
assert.equal(scored.competencyResults.length, 6);
assert.ok(scored.competencyResults.every((row) => row.scorePercent === 100));

const incomplete = createCourseAssessmentAttempt({ learnerId: 'incomplete', assessment, itemBank, seed: 'incomplete' });
assert.throws(() => scorePersistedCourseAssessment({ assessment, attempt: incomplete, itemBank }), /unanswered item/);

console.log('Course 1 final assessment runtime security, shuffle, non-disclosure, and scoring tests passed.');
