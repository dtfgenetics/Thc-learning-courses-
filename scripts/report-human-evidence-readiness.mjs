import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const readDir=(rel)=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const registry=JSON.parse(fs.readFileSync(path.join(root,'registry/certification-validation-execution.json'),'utf8'));
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const pilots=readDir('content/course-pilot-execution-evidence');
const a11y=readDir('content/accessibility-review-evidence');
const rows=(registry.courses??[]).map(r=>{
  const c=courses.get(r.courseId);
  const p=pilots.filter(x=>x.courseId===r.courseId&&String(x.courseVersion)===String(c?.version)&&x.status!=='invalidated').sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0]??null;
  const a=a11y.filter(x=>x.courseId===r.courseId&&String(x.courseVersion)===String(c?.version)&&x.status!=='invalidated').sort((a,b)=>Date.parse(b.reviewedAt)-Date.parse(a.reviewedAt))[0]??null;
  return {
    courseId:r.courseId,courseVersion:c?.version??null,
    pilot:p?{id:p.id,status:p.status,participantCount:p.participantCount}:{status:'missing'},
    accessibility:a?{id:a.id,status:a.status,deployedBuildId:a.deployedBuildId,unresolvedFailures:a.unresolvedFailures}:{status:'missing'}
  };
});
const controls=JSON.parse(fs.readFileSync(path.join(root,'registry/candidate-governance-controls.json'),'utf8'));
const gov=readDir('content/candidate-governance-approvals').filter(x=>x.controlsId===controls.id&&String(x.controlsVersion)===String(controls.version)&&x.status!=='invalidated').sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0]??null;
console.log(JSON.stringify({
 summary:{
   courses:rows.length,
   pilotsApproved:rows.filter(x=>x.pilot.status==='approved').length,
   accessibilityApproved:rows.filter(x=>x.accessibility.status==='approved').length,
   candidateGovernanceStatus:gov?.status??'missing'
 },
 courses:rows,
 candidateGovernance:gov?{id:gov.id,status:gov.status,controlsVersion:gov.controlsVersion}:{status:'missing',controlsVersion:controls.version}
},null,2));
