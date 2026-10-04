import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const errors=[];
const readDir=(rel)=>{
  const dir=path.join(root,rel); if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>({file:path.join(rel,n),data:JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))}));
};
const courses=new Map(readDir('content/courses').map(x=>[x.data.id,x.data]));
const assessments=new Map(readDir('content/assessments').map(x=>[x.data.id,x.data]));
const rows=readDir('content/standard-setting-evidence');
const ids=new Set();
for(const {file,data:r} of rows){
  if(ids.has(r.id)) errors.push(`${file}: duplicate id ${r.id}`); else ids.add(r.id);
  const c=courses.get(r.courseId); const a=assessments.get(r.assessmentId);
  if(!c) errors.push(`${file}: unknown course ${r.courseId}`);
  else if(String(c.version)!==String(r.courseVersion)) errors.push(`${file}: courseVersion does not match current course version ${c.version}`);
  if(!a) errors.push(`${file}: unknown assessment ${r.assessmentId}`);
  else{
    if(String(a.version)!==String(r.assessmentVersion)) errors.push(`${file}: assessmentVersion does not match current assessment version ${a.version}`);
    if(a.items?.length!==r.stableItemCount) errors.push(`${file}: stableItemCount ${r.stableItemCount} does not match current assessment item count ${a.items?.length??0}`);
  }
  if(r.status==='approved'){
    if(r.governanceDecision?.decision!=='adopt') errors.push(`${file}: approved standard setting requires governanceDecision=adopt`);
    if(typeof r.governanceDecision?.productionCutScorePercent!=='number') errors.push(`${file}: approved standard setting requires production cut score`);
    if(r.performanceLevelDescriptionApproved!==true) errors.push(`${file}: approved standard setting requires approved performance-level description`);
    if(!r.governanceDecision?.decisionAuthority || !r.governanceDecision?.decisionDate) errors.push(`${file}: approved standard setting requires decision authority/date`);
  }
}
if(errors.length){ console.error('Standard-setting evidence validation failed:'); for(const e of errors) console.error('- '+e); process.exit(1); }
console.log(`Standard-setting evidence validation passed. ${rows.length} record(s) checked.`);
