import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),errors=[];
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>({file:path.join(rel,n),data:read(path.join(rel,n))}));};
const baseline=read('registry/public-occupational-source-baseline.json');
const programs=new Map(readDir('content/credential-programs').filter(x=>x.data.id).map(x=>[x.data.id,x.data]));
const rows=readDir('content/job-task-analysis-evidence');
const ids=new Set();
for(const {file,data:r} of rows){
  if(ids.has(r.id))errors.push(file+': duplicate id '+r.id);else ids.add(r.id);
  const p=programs.get(r.credentialProgramId);if(!p){errors.push(file+': unknown program '+r.credentialProgramId);continue;}
  if(String(p.version)!==String(r.credentialProgramVersion))errors.push(file+': stale credentialProgramVersion');
  if(r.baselineId!==baseline.id||String(r.baselineAsOf)!==String(baseline.asOf))errors.push(file+': stale occupational baseline provenance');
  const bp=(baseline.programs??[]).find(x=>x.credentialProgramId===r.credentialProgramId);
  if(!bp){errors.push(file+': no baseline program mapping');continue;}
  const expected=new Set(bp.taskFamilies.map(x=>x.id));
  const actual=new Set((r.taskFamilies??[]).map(x=>x.taskFamilyId));
  for(const id of expected)if(!actual.has(id))errors.push(file+': missing baseline task family '+id);
  for(const id of actual)if(!expected.has(id))errors.push(file+': unexpected task family '+id);
  for(const t of r.taskFamilies??[]){
    if(t.dispositionCounts.keep+t.dispositionCounts.adapt+t.dispositionCounts.reject!==t.ratingsCount)errors.push(file+': disposition counts do not equal ratingsCount for '+t.taskFamilyId);
    if(r.status==='complete'&&t.ratingsCount<r.panel.minimumRatingsPerTask)errors.push(file+': complete record below minimum ratings for '+t.taskFamilyId);
  }
  if(r.panel.employerPerspectiveCount>r.panel.respondentCount)errors.push(file+': employerPerspectiveCount exceeds respondentCount');
  if(r.panel.cultivationRoleCount>r.panel.respondentCount)errors.push(file+': cultivationRoleCount exceeds respondentCount');
}
if(errors.length){console.error('Job-task-analysis evidence validation failed:');for(const e of errors)console.error('- '+e);process.exit(1);}
console.log('Job-task-analysis evidence validation passed. '+rows.length+' record(s) checked.');