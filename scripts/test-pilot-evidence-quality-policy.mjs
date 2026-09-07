import { activationEvidenceEvaluation, loadPilotEvidencePolicy, responseAccountingIssues } from './pilot-evidence-quality.mjs';

const policy = loadPilotEvidencePolicy();
const item = {id:'ITEM-TEST-PILOT',version:1,correct:0,choices:['A','B','C','D']};
function record(overrides = {}) {
  return {
    id:'PILOT-ITEM-TEST-PILOT-V1', itemId:item.id, itemVersion:1, status:'complete', sampleSize:30,
    percentCorrect:0.6, discrimination:{method:'point-biserial-item-rest',value:0.25},
    distractorSelection:[
      {choiceIndex:0,count:18,proportion:0.6},
      {choiceIndex:1,count:4,proportion:4/30},
      {choiceIndex:2,count:4,proportion:4/30},
      {choiceIndex:3,count:4,proportion:4/30}
    ],
    omitRate:0, medianResponseTimeSeconds:45, responseTimeAnomalyRate:0,
    challengeHistory:[], analystId:'analyst-test', completedAt:'2026-09-07T05:00:00.000Z', notes:null,
    ...overrides
  };
}

const good = record();
if (responseAccountingIssues(good, item).length) throw new Error('Valid pilot response accounting was rejected.');
if (!activationEvidenceEvaluation(good, item, policy).ready) throw new Error('Policy-qualified pilot evidence should be activation ready.');

const uncorrected = activationEvidenceEvaluation(record({discrimination:{method:'point-biserial',value:0.25}}), item, policy);
if (uncorrected.ready || !uncorrected.blockers.includes('discrimination-method-not-qualified')) throw new Error('Uncorrected item-total point-biserial must not qualify for activation.');

const withOmissions = record({
  sampleSize:30,
  omitRate:0.1,
  percentCorrect:18/30,
  distractorSelection:[
    {choiceIndex:0,count:18,proportion:18/27},
    {choiceIndex:1,count:3,proportion:3/27},
    {choiceIndex:2,count:3,proportion:3/27},
    {choiceIndex:3,count:3,proportion:3/27}
  ]
});
const omissionIssues = responseAccountingIssues(withOmissions, item);
if (omissionIssues.length) throw new Error(`Valid omitted-response accounting was rejected: ${omissionIssues.join('; ')}`);
if (!activationEvidenceEvaluation(withOmissions, item, policy).ready) throw new Error('A valid pilot with omissions should remain activation-ready when all policy conditions are met.');

const tiny = activationEvidenceEvaluation(record({sampleSize:1,percentCorrect:1,distractorSelection:[
  {choiceIndex:0,count:1,proportion:1},{choiceIndex:1,count:0,proportion:0},{choiceIndex:2,count:0,proportion:0},{choiceIndex:3,count:0,proportion:0}
]}), item, policy);
if (tiny.ready || !tiny.blockers.includes('sample-below-activation-floor')) throw new Error('Tiny pilot samples must not qualify for activation.');

const negative = activationEvidenceEvaluation(record({discrimination:{method:'point-biserial-item-rest',value:-0.1}}), item, policy);
if (negative.ready || !negative.blockers.includes('discrimination-below-activation-floor')) throw new Error('Negative corrected discrimination must block activation.');

const inconsistent = activationEvidenceEvaluation(record({distractorSelection:[
  {choiceIndex:0,count:17,proportion:0.6},{choiceIndex:1,count:4,proportion:4/30},{choiceIndex:2,count:4,proportion:4/30},{choiceIndex:3,count:4,proportion:4/30}
]}), item, policy);
if (inconsistent.ready || !inconsistent.blockers.includes('response-accounting-inconsistent')) throw new Error('Inconsistent response accounting must block activation.');

const challenged = activationEvidenceEvaluation(record({challengeHistory:[{id:'CH-1',status:'open',summary:'Potential ambiguity'}]}), item, policy);
if (challenged.ready || !challenged.blockers.includes('open-item-challenge')) throw new Error('Open item challenges must block activation.');

const lowDiscrimination = activationEvidenceEvaluation(record({discrimination:{method:'point-biserial-item-rest',value:0.05}}), item, policy);
if (!lowDiscrimination.ready) throw new Error('Low-but-nonnegative corrected discrimination is a review signal, not an automatic activation blocker.');
if (!lowDiscrimination.reviewFlags.includes('low-discrimination')) throw new Error('Low discrimination should be surfaced for human review.');

console.log(`Pilot evidence quality policy tests passed (method ${policy.activation.requiredDiscriminationMethod}, activation floor ${policy.activation.minimumResponsesPerItem}, target ${policy.reviewSignals.targetResponsesPerItem}).`);
