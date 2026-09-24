import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),errors=[];
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>({file:path.join(rel,n),data:read(path.join(rel,n))}));};
const programs=new Map(readDir('content/credential-programs').filter(x=>x.data.id).map(x=>[x.data.id,x.data]));
const jtas=new Map(readDir('content/job-task-analysis-evidence').map(x=>[x.data.id,x.data]));
const rows=readDir('content/sme-employer-validation-evidence'),ids=new Set();
for(const {file,data:r} of rows){
  if(ids.has(r.id))errors.push(file+': duplicate id '+r.id);else ids.add(r.id);
  const p=programs.get(r.credentialProgramId);if(!p){errors.push(file+': unknown program');continue;}
  if(String(p.version)!==String(r.credentialProgramVersion))errors.push(file+': stale program version');
  const jta=jtas.get(r.jtaEvidenceId);if(!jta)errors.push(file+': missing JTA '+r.jtaEvidenceId);
  else{
    if(jta.status!=='complete')errors.push(file+': linked JTA is not complete');
    if(jta.credentialProgramId!==r.credentialProgramId||String(jta.credentialProgramVersion)!==String(r.credentialProgramVersion))errors.push(file+': linked JTA program mismatch');
    const expected=new Set((jta.taskFamilies??[]).map(x=>x.taskFamilyId)),actual=new Set((r.taskFamilyReviews??[]).map(x=>x.taskFamilyId));
    for(const id of expected)if(!actual.has(id))errors.push(file+': missing JTA task family '+id);
    for(const id of actual)if(!expected.has(id))errors.push(file+': unexpected task family '+id);
  }
  for(const t of r.taskFamilyReviews??[])if(t.dispositionCounts.keep+t.dispositionCounts.adapt+t.dispositionCounts.remove!==t.ratingsCount)errors.push(file+': disposition count mismatch '+t.taskFamilyId);
  if(r.status==='complete'){
    if(r.panel.employerPerspectiveCount<1)errors.push(file+': complete evidence requires employer perspective');
    if(r.panel.currentCultivationRoleCount<1)errors.push(file+': complete evidence requires current cultivation role perspective');
    for(const t of r.taskFamilyReviews??[])if(t.ratingsCount<r.panel.minimumRatingsPerTask)errors.push(file+': complete evidence below task minimum '+t.taskFamilyId);
    for(const [k,v] of Object.entries(r.scopeBoundaryReview??{}))if(v!==true)errors.push(file+': complete evidence requires '+k+'=true');
  }
}
if(errors.length){console.error('SME/employer validation evidence failed:');for(const e of errors)console.error('- '+e);process.exit(1);}
console.log('SME/employer validation evidence passed. '+rows.length+' record(s) checked.');