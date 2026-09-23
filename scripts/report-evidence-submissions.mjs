import {readDir,evidenceIndex,statusIsReviewable} from './lib/evidence-submission-utils.mjs';

const idx=evidenceIndex();
const rows=readDir('content/evidence-submissions').map(r=>({
  id:r.id,scope:r.scope,targetId:r.targetId,targetVersion:r.targetVersion,status:r.status,submittedBy:r.submittedBy,submittedAt:r.submittedAt,
  evidenceRecordCount:r.evidenceRecordIds.length,
  reviewableEvidenceCount:r.evidenceRecordIds.filter(id=>{const x=idx.get(id);return x?statusIsReviewable(x):false;}).length,
  reviewerId:r.reviewerId??null,reviewedAt:r.reviewedAt??null
}));
const states={};
for(const r of rows) states[r.status]=(states[r.status]??0)+1;
console.log(JSON.stringify({summary:{submissions:rows.length,states},submissions:rows},null,2));
