import assert from 'node:assert/strict';
import {
  presentCourseAssessmentItem,
  normalizePresentedResponse,
  buildCourseAssessmentForm
} from '../packages/domain/course-assessment-runtime.mjs';
import { scoreAttempt } from '../packages/domain/assessment-runtime.mjs';

const item = {
  id:'ITEM-ORDER-001',
  version:1,
  status:'draft',
  purpose:'summative',
  competency:'COMP-ORDER-001',
  objective:'LO-ORDER-001',
  bloomLevel:'apply',
  difficulty:'moderate',
  type:'ordering',
  stem:'Put these steps in the correct order.',
  choices:['Inspect', 'Record', 'Escalate'],
  correct:[0,1,2],
  rationale:'Test item.',
  references:['REF-TEST-001']
};

const assessment = {
  id:'ASSESS-ORDER-001',
  version:'1.0.0',
  title:'Ordering runtime test',
  items:[item.id],
  randomizeItems:false,
  randomizeChoices:true,
  passingScorePercent:100
};

const form = buildCourseAssessmentForm({ assessment, itemBank:[item], seed:'ordering-seed' });
const presented = presentCourseAssessmentItem(item, {
  formId:form.id,
  response:item.correct,
  randomizeChoices:true
});

assert.equal(presented.type, 'ordering');
assert.equal(presented.choices.length, 3);
assert.equal(presented.response.length, 3);
assert.equal(new Set(presented.response).size, 3);
assert.equal('correct' in presented, false);
assert.equal('rationale' in presented, false);

const normalized = normalizePresentedResponse(item, {
  formId:form.id,
  response:presented.response,
  randomizeChoices:true
});
assert.deepEqual(normalized, item.correct);

assert.throws(
  () => normalizePresentedResponse(item, { formId:form.id, response:[0,0,1], randomizeChoices:true }),
  /rank every choice exactly once/
);

assert.throws(
  () => buildCourseAssessmentForm({
    assessment:{ ...assessment, items:['ITEM-MATCH-001'] },
    itemBank:[{ ...item, id:'ITEM-MATCH-001', type:'matching', correct:['a'] }],
    seed:'matching-seed'
  }),
  /Unsupported learner assessment item type matching/
);

const submitted = {
  id:'ATTEMPT-ORDER-001',
  learnerId:'learner',
  assessmentId:assessment.id,
  assessmentVersion:assessment.version,
  formId:form.id,
  formHash:form.integrityHash,
  status:'submitted',
  startedAt:'2026-09-27T12:00:00.000Z',
  submittedAt:'2026-09-27T12:05:00.000Z',
  scoredAt:null,
  items:[{
    position:1,
    itemId:item.id,
    itemVersion:item.version,
    competency:item.competency,
    response:[0,1,2],
    score:null,
    maxScore:1
  }]
};

const correctScore = scoreAttempt(submitted, [item], 100);
assert.equal(correctScore.scorePercent, 100);
assert.equal(correctScore.passed, true);

const wrongScore = scoreAttempt({
  ...submitted,
  items:[{ ...submitted.items[0], response:[1,0,2] }]
}, [item], 100);
assert.equal(wrongScore.scorePercent, 0);
assert.equal(wrongScore.passed, false);

console.log('Ordering assessment runtime tests passed.');
