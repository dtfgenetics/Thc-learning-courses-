import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const errors=[];
const readDir=(rel)=>{const dir=path.join(root,rel);if(!fs.existsSync(dir))return[];return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>({file:path.join(rel,n),data:JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))}));};
const courses=new Map(readDir('content/courses').map(x=>[x.data.id,x.data]));
const assessments=new Map(readDir('content/assessments').map(x=>[x.data.id,x.data]));
const rows=readDir('content/secure-form-equivalence-evidence');
const ids=new Set();
for(const {file,data:r} of rows){
  if(ids.has(r.id)) errors.push(`${file}: duplicate id ${r.id}`); else ids.add(r.id);
  const c=courses.get(r.courseId); const a=assessments.get(r.assessmentId);
  if(!c) errors.push(`${file}: unknown course ${r.courseId}`);
  else if(String(c.version)!==String(r.courseVersion)) errors.push(`${file}: courseVersion does not match current course version ${c.version}`);
  if(!a) errors.push(`${file}: unknown assessment ${r.assessmentId}`);
  else if(String(a.version)!==String(r.assessmentVersion)) errors.push(`${file}: assessmentVersion does not match current assessment version ${a.version}`);
  if(!Array.isArray(r.forms)||r.forms.length!==r.formCount) errors.push(`${file}: formCount must equal forms.length`);
  const keys=new Set();
  for(const f of r.forms??[]){
    const key=`${f.formId}@${f.formRevision}`; if(keys.has(key)) errors.push(`${file}: duplicate form revision ${key}`); keys.add(key);
  }
  if(r.status==='approved'){
    for(const f of r.forms??[]){
      if(f.approvedOperationalItemsOnly!==true || f.publicItemsExcluded!==true) errors.push(`${file}: approved form evidence requires approved private operational items only`);
    }
    for(const k of ['blueprintCoverageEquivalent','cognitiveDemandEquivalent','criticalContentRepresentationEquivalent','scoredOpportunityEquivalent','retestDuplicationReviewed']){
      if(r.equivalenceReview?.[k]!==true) errors.push(`${file}: approved form evidence requires ${k}=true`);
    }
    for(const k of ['privateStoreVerified','answerMaterialExcludedFromDelivery','exposureTrackingEnabled','quarantineWorkflowEnabled']){
      if(r.securityReview?.[k]!==true) errors.push(`${file}: approved form evidence requires ${k}=true`);
    }
  }
}
if(errors.length){ console.error('Secure form equivalence validation failed:'); for(const e of errors) console.error('- '+e); process.exit(1); }
console.log(`Secure form equivalence validation passed. ${rows.length} record(s) checked.`);
