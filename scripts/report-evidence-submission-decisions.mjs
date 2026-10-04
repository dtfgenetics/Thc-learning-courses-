import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const readDir=(rel)=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const submissions=readDir('content/evidence-submissions');
const decisions=readDir('content/evidence-submission-decisions');

const rows=submissions.map(s=>{
  const ds=decisions.filter(d=>d.submissionId===s.id).sort((a,b)=>Date.parse(b.reviewedAt)-Date.parse(a.reviewedAt));
  const latest=ds[0]??null;
  const effectiveStatus=latest?.decision??s.status;
  return {
    id:s.id,scope:s.scope,targetId:s.targetId,targetVersion:s.targetVersion,manifestStatus:s.status,effectiveStatus,
    evidenceRecordCount:s.evidenceRecordIds.length,latestDecisionId:latest?.id??null,reviewerId:latest?.reviewerId??s.reviewerId??null,reviewedAt:latest?.reviewedAt??s.reviewedAt??null
  };
});
const states={};for(const r of rows)states[r.effectiveStatus]=(states[r.effectiveStatus]??0)+1;
console.log(JSON.stringify({summary:{submissions:rows.length,effectiveStates:states},submissions:rows},null,2));
