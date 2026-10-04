import assert from 'node:assert/strict';
import {
  buildCourseAssessmentForm,
  presentCourseAssessmentItem,
  normalizePresentedResponse
} from '../packages/domain/course-assessment-runtime.mjs';
import { scoreAttempt } from '../packages/domain/assessment-runtime.mjs';

const item = {
  id:'ITEM-MATCH-001',
  version:1,
  status:'draft',
  purpose:'summative',
  competency:'COMP-MATCH-001',
  objective:'LO-MATCH-001',
  bloomLevel:'apply',
  difficulty:'moderate',
  type:'matching',
  stem:'Match each prompt to the correct response.',
  matchPrompts:[
    { id:'P1', text:'pH below target' },
    { id:'P2', text:'EC above target' }
  ],
  matchOptions:[
    { id:'O1', text:'Check acid/base correction and source-water behavior' },
    { id:'O2', text:'Check concentration, runoff, and salt accumulation context' }
  ],
  correct:['O1','O2'],
  rationale:'Test-only matching rationale.',
  references:['REF-TEST-001']
};

const assessment = {
  id:'ASSESS-MATCH-001',
  version:'1.0.0',
  title:'Matching runtime test',
  items:[item.id],
  randomizeItems:false,
  randomizeChoices:true,
  passingScorePercent:100
};

const form = buildCourseAssessmentForm({ assessment, itemBank:[item], seed:'matching-seed' });
const presented = presentCourseAssessmentItem(item, {
  formId:form.id,
  response:item.correct,
  randomizeChoices:true
});

assert.equal(presented.type, 'matching');
assert.deepEqual(presented.matchPrompts.map((row) => row.id), ['P1','P2']);
assert.equal(presented.matchOptions.length, 2);
assert.deepEqual(presented.response, ['O1','O2']);
assert.equal('correct' in presented, false);
assert.equal('rationale' in presented, false);

const normalized = normalizePresentedResponse(item, {
  formId:form.id,
  response:['O1','O2'],
  randomizeChoices:true
});
assert.deepEqual(normalized, ['O1','O2']);

assert.throws(
  () => normalizePresentedResponse(item, { formId:form.id, response:['O1','UNKNOWN'], randomizeChoices:true }),
  /one valid option ID per prompt/
);

assert.throws(
  () => buildCourseAssessmentForm({
    assessment:{ ...assessment, items:['ITEM-BAD-MATCH'] },
    itemBank:[{ ...item, id:'ITEM-BAD-MATCH', correct:['UNKNOWN','O2'] }],
    seed:'bad-match'
  }),
  /answer key references an unknown option/
);

const submitted = {
  id:'ATTEMPT-MATCH-001',
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
    response:['O1','O2'],
    score:null,
    maxScore:1
  }]
};

assert.equal(scoreAttempt(submitted, [item], 100).scorePercent, 100);
assert.equal(scoreAttempt({
  ...submitted,
  items:[{ ...submitted.items[0], response:['O2','O1'] }]
}, [item], 100).scorePercent, 0);

console.log('Matching assessment runtime tests passed.');
