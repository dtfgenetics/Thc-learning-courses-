import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const readDir=(rel)=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const submissions=new Map(readDir('content/evidence-submissions').map(x=>[x.id,x]));
const decisions=readDir('content/evidence-submission-decisions');
const errors=[];
const ids=new Set();

for(const d of decisions){
  if(ids.has(d.id)) errors.push(d.id+': duplicate decision id'); else ids.add(d.id);
  const s=submissions.get(d.submissionId);
  if(!s){errors.push(d.id+': missing submission '+d.submissionId);continue;}
  if(!['ready-for-review','accepted'].includes(s.status)) errors.push(d.id+': submission is not reviewable ('+s.status+')');
  if(Date.parse(d.reviewedAt)<Date.parse(s.submittedAt)) errors.push(d.id+': reviewedAt predates submittedAt');
}
for(const s of submissions.values()){
  if(s.status==='accepted'){
    const accepted=decisions.some(d=>d.submissionId===s.id&&d.decision==='accepted');
    if(!accepted) errors.push(s.id+': accepted manifest requires an accepted review-decision record');
  }
}
if(errors.length){console.error('Evidence submission decision validation failed:');errors.forEach(e=>console.error('- '+e));process.exit(1);}
console.log('Evidence submission decision validation passed. '+decisions.length+' decision record(s) checked.');
