import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const errors=[];
const controls=JSON.parse(fs.readFileSync(path.join(root,'registry/candidate-governance-controls.json'),'utf8'));
const dir=path.join(root,'content/candidate-governance-approvals');
const rows=fs.existsSync(dir)?fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>({file:path.join('content/candidate-governance-approvals',n),data:JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))})):[];
const ids=new Set();
for(const {file,data:r} of rows){
  if(ids.has(r.id)) errors.push(`${file}: duplicate id ${r.id}`); else ids.add(r.id);
  if(r.controlsId!==controls.id) errors.push(`${file}: controlsId must match ${controls.id}`);
  if(String(r.controlsVersion)!==String(controls.version)) errors.push(`${file}: controlsVersion ${r.controlsVersion} does not match current ${controls.version}`);
  if(r.status==='approved'){
    for(const k of ['program','assessment','accessibility','privacyLegal','security','organizational']) if(r.approvals?.[k]!==true) errors.push(`${file}: approved governance requires approvals.${k}=true`);
    if(r.finalAttemptPolicy?.approved!==true) errors.push(`${file}: approved governance requires approved final-attempt policy`);
    if(r.waitingPeriodPolicy?.approved!==true) errors.push(`${file}: approved governance requires approved waiting-period policy`);
    if(r.feePolicy?.approved!==true) errors.push(`${file}: approved governance requires approved fee policy`);
    if(r.retentionSchedule?.approved!==true) errors.push(`${file}: approved governance requires approved retention schedule`);
    for(const [k,v] of Object.entries(r.retentionSchedule?.periods??{})) if(v===null||v==='') errors.push(`${file}: approved retention schedule requires non-empty period for ${k}`);
  }
}
if(errors.length){console.error('Candidate governance approval validation failed:');for(const e of errors)console.error('- '+e);process.exit(1);}
console.log(`Candidate governance approval validation passed. ${rows.length} record(s) checked against controls ${controls.id}@${controls.version}.`);
