import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const errors=[];
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>({file:path.join(rel,n),data:JSON.parse(fs.readFileSync(path.join(d,n),'utf8'))}));};
const courses=new Map(readDir('content/courses').map(x=>[x.data.id,x.data]));
const performance=new Map(readDir('content/performance-assessments').map(x=>[x.data.id,x.data]));
const rows=readDir('content/integrated-performance-standard-setting-evidence');
const ids=new Set();

function expectedIds(course){
  const ext=course?.extensions??{};
  const ids=[
    ...(ext.credentialPracticalSetRequired??[]),
    ...(ext.mappedPerformanceAssessments??[]),
    ...(ext.capstoneRequired?[ext.capstoneRequired]:[])
  ];
  return [...new Set(ids)];
}

for(const {file,data:r} of rows){
  if(ids.has(r.id)) errors.push(file+': duplicate id '+r.id); else ids.add(r.id);
  const c=courses.get(r.courseId);
  if(!c){errors.push(file+': unknown course '+r.courseId);continue;}
  if(String(c.version)!==String(r.courseVersion)) errors.push(file+': courseVersion does not match current '+c.version);
  const expected=new Set(expectedIds(c));
  const actual=new Set((r.components??[]).map(x=>x.assessmentId));
  for(const id of expected) if(!actual.has(id)) errors.push(file+': missing required component '+id);
  for(const id of actual) if(!expected.has(id)) errors.push(file+': unexpected component '+id);
  for(const comp of r.components??[]){
    const a=performance.get(comp.assessmentId);
    if(!a){errors.push(file+': unknown performance assessment '+comp.assessmentId);continue;}
    if(String(a.version)!==String(comp.assessmentVersion)) errors.push(file+': '+comp.assessmentId+' version mismatch');
    if(a.assessmentType!==comp.assessmentType) errors.push(file+': '+comp.assessmentId+' type mismatch');
  }
  if(r.status==='approved'){
    if(r.governanceDecision?.decision!=='adopt') errors.push(file+': approved evidence requires governanceDecision=adopt');
    if(!r.governanceDecision?.decisionAuthority||!r.governanceDecision?.decisionDate) errors.push(file+': approved evidence requires decision authority/date');
    if(r.decisionRule?.allRequiredComponentsMustPass!==true) errors.push(file+': approved integrated standard requires all required components to pass');
    if(r.decisionRule?.noCriticalErrors!==true) errors.push(file+': approved integrated standard requires no critical errors');
    if(r.decisionRule?.compensatoryScoringAllowed!==false) errors.push(file+': approved integrated standard cannot allow compensatory scoring');
    for(const comp of r.components??[]){
      if(typeof comp.adoptedMinimumPercent!=='number') errors.push(file+': approved component '+comp.assessmentId+' requires adoptedMinimumPercent');
      if(comp.criticalErrorRuleApproved!==true) errors.push(file+': approved component '+comp.assessmentId+' requires criticalErrorRuleApproved=true');
    }
  }
}
if(errors.length){console.error('Integrated performance standard-setting validation failed:');errors.forEach(e=>console.error('- '+e));process.exit(1);}
console.log('Integrated performance standard-setting validation passed. '+rows.length+' record(s) checked.');
