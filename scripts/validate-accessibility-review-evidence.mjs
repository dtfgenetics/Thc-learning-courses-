import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const errors=[];
const readDir=(rel)=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>({file:path.join(rel,n),data:JSON.parse(fs.readFileSync(path.join(d,n),'utf8'))}));};
const courses=new Map(readDir('content/courses').map(x=>[x.data.id,x.data]));
const rows=readDir('content/accessibility-review-evidence');
const ids=new Set();
const requiredCoverage=['courseOverview','lessons','instructionalVisuals','assessments','downloads','progressCompletionStates','mobileResponsive','keyboard','assistiveTechnology','zoomReflow'];
for(const {file,data:r} of rows){
  if(ids.has(r.id)) errors.push(`${file}: duplicate id ${r.id}`); else ids.add(r.id);
  const c=courses.get(r.courseId);
  if(!c) errors.push(`${file}: unknown course ${r.courseId}`);
  else if(String(c.version)!==String(r.courseVersion)) errors.push(`${file}: courseVersion ${r.courseVersion} does not match current ${c.version}`);
  if(['approved','evidence-complete'].includes(r.status)){
    if(r.wcagTarget!=='2.2-AA') errors.push(`${file}: completed review must target WCAG 2.2 AA`);
    for(const k of requiredCoverage) if(r.coverage?.[k]!==true) errors.push(`${file}: completed review requires coverage.${k}=true`);
    if(r.unresolvedFailures!==0) errors.push(`${file}: completed review requires unresolvedFailures=0`);
    if(r.levelAAFailuresResolvedOrDispositioned!==true) errors.push(`${file}: completed review requires Level A/AA failures resolved or dispositioned`);
    if(!Array.isArray(r.environments)||r.environments.length<3) errors.push(`${file}: completed review requires multiple review environments`);
  }
}
if(errors.length){console.error('Rendered accessibility review evidence validation failed:');for(const e of errors)console.error('- '+e);process.exit(1);}
console.log(`Rendered accessibility review evidence validation passed. ${rows.length} record(s) checked.`);
