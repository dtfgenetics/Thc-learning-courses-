import { buildDecisionRecords, pendingFoundationAssessmentItemIds } from './apply-foundations-assessment-review-decisions.mjs';

const pending = [...pendingFoundationAssessmentItemIds()].sort();
if (pending.length === 0) {
  console.log('No pending Foundations assessment items; guarded decision importer has no current targets.');
  process.exit(0);
}
const objectId = pending[0];
const base = {reviewerId:'reviewer-test', reviewedAt:'2026-09-07T05:00:00.000Z'};

let approvalBlocked = false;
try {
  buildDecisionRecords({...base, decisions:[{objectId,status:'approved',notes:'Explicit test approval decision.'}]});
} catch (error) {
  approvalBlocked = error.message.includes('confirm-approved');
}
if (!approvalBlocked) throw new Error('Approved batch decisions must require explicit confirmation.');

const approved = buildDecisionRecords({...base, decisions:[{objectId,status:'approved',notes:'Explicit test approval decision.'}]}, {confirmApproved:true});
if (approved.length !== 1 || approved[0].status !== 'approved' || approved[0].objectId !== objectId) throw new Error('Confirmed approval did not build the expected exact-version review record.');

const changes = buildDecisionRecords({...base, decisions:[{objectId,status:'changes-requested',notes:'Revise the distractors before approval.'}]});
if (changes.length !== 1 || changes[0].status !== 'changes-requested') throw new Error('Changes-requested decision did not build correctly.');

let nonPendingBlocked = false;
try {
  buildDecisionRecords({...base, decisions:[{objectId:'ITEM-NOT-PENDING',status:'rejected',notes:'Test rejection.'}]});
} catch (error) {
  nonPendingBlocked = error.message.includes('not in the current pending');
}
if (!nonPendingBlocked) throw new Error('Importer must reject objects outside the current pending Foundations assessment batch.');

console.log(`Guarded Foundations assessment decision importer tests passed using ${objectId}; ${pending.length} current pending item(s).`);
