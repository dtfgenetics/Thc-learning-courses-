import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const errors=[];
const contract=JSON.parse(fs.readFileSync(path.join(root,'registry/production-validation-evidence.json'),'utf8'));
const controls=new Map((contract.controls??[]).map(x=>[x.id,x]));
const dir=path.join(root,'content/production-control-evidence');
const rows=fs.existsSync(dir)
  ? fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>({file:path.join('content/production-control-evidence',n),data:JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))}))
  : [];
const ids=new Set();

for(const {file,data:r} of rows){
  if(ids.has(r.id)) errors.push(`${file}: duplicate id ${r.id}`); else ids.add(r.id);
  if(!controls.has(r.controlId)) errors.push(`${file}: unknown controlId ${r.controlId}`);
  if(['evidence-complete','approved'].includes(r.status)){
    if(!Array.isArray(r.evidenceRefs)||r.evidenceRefs.length===0) errors.push(`${file}: completed evidence requires evidenceRefs`);
    if(r.findingsDispositioned!==true) errors.push(`${file}: completed evidence requires findingsDispositioned=true`);
  }
  if(r.status==='approved'){
    const expected=controls.get(r.controlId)?.requiredEvidence??[];
    if(r.evidenceRefs.length<Math.min(1,expected.length)) errors.push(`${file}: approved evidence has no referenced evidence`);
  }
}
if(errors.length){
  console.error('Production control evidence validation failed:');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
console.log(`Production control evidence validation passed. ${rows.length} record(s) checked against ${controls.size} controls.`);
