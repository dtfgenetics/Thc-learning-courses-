import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const registryPath=path.join(root,'registry/certification-validation-execution.json');
const args=new Set(process.argv.slice(2));
const asJson=args.has('--json');
const check=args.has('--check');

const fail=(message)=>{ console.error(message); process.exitCode=1; };
if(!fs.existsSync(registryPath)){
  fail('Missing registry/certification-validation-execution.json');
  process.exit();
}

const data=JSON.parse(fs.readFileSync(registryPath,'utf8'));
const courses=Array.isArray(data.courses)?data.courses:[];
const statuses=new Set(data.statusVocabulary ?? []);
const requiredGates=[
  'exactVersionHumanAssessmentReview',
  'pilotExecution',
  'itemAnalysis',
  'practicalAssessorCalibration',
  'accessibilityUxHumanReview',
  'standardSetting',
  'secureOperationalFormReadiness',
  'occupationalProgramValidation',
  'credentialAuthorization'
];

const problems=[];
if(courses.length!==15) problems.push(`expected 15 canonical courses, found ${courses.length}`);

const ids=new Set();
for(const c of courses){
  if(!c?.courseId) problems.push('course missing courseId');
  else if(ids.has(c.courseId)) problems.push(`duplicate courseId: ${c.courseId}`);
  else ids.add(c.courseId);

  for(const gate of requiredGates){
    const value=c?.evidence?.[gate];
    if(value==null) problems.push(`${c.courseId ?? 'unknown'} missing gate ${gate}`);
    else if(!statuses.has(value)) problems.push(`${c.courseId ?? 'unknown'} gate ${gate} has invalid status ${value}`);
  }
}

const conventional=courses.filter(c=>c.conventionalFinal===true);
if(conventional.length!==13) problems.push(`expected 13 conventional finals, found ${conventional.length}`);
for(const c of conventional){
  if(!c.finalAssessmentId) problems.push(`${c.courseId} conventional final missing finalAssessmentId`);
}

const integrated=courses.filter(c=>c.integratedPerformance===true).map(c=>c.courseId).sort();
const expectedIntegrated=['COURSE-LH-TECH1-007','COURSE-LH-TECH2-008'];
if(JSON.stringify(integrated)!==JSON.stringify(expectedIntegrated)){
  problems.push(`integrated-performance courses must be ${expectedIntegrated.join(', ')}; found ${integrated.join(', ') || 'none'}`);
}
for(const id of expectedIntegrated){
  const c=courses.find(x=>x.courseId===id);
  if(!c) problems.push(`missing integrated-performance course ${id}`);
  else if(c.conventionalFinal!==false || c.finalAssessmentId!==null) problems.push(`${id} must not declare a conventional final`);
}

const summary={courseCount:courses.length,conventionalFinalCount:conventional.length,integratedPerformanceCourseIds:integrated,problems};
for(const gate of requiredGates){
  summary[gate]=courses.reduce((acc,c)=>{
    const v=c.evidence?.[gate] ?? 'missing';
    acc[v]=(acc[v]??0)+1;
    return acc;
  },{});
}

if(asJson){
  console.log(JSON.stringify(summary,null,2));
}else{
  console.log('Certification validation execution registry');
  console.log(`Courses: ${summary.courseCount}/15`);
  console.log(`Conventional finals: ${summary.conventionalFinalCount}/13`);
  console.log(`Integrated performance: ${summary.integratedPerformanceCourseIds.join(', ')}`);
  for(const gate of requiredGates){
    console.log(`${gate}: ${JSON.stringify(summary[gate])}`);
  }
  if(problems.length){
    console.log('\nProblems:');
    for(const p of problems) console.log(`- ${p}`);
  }else{
    console.log('\nStructural validation: PASS');
  }
}

if(check && problems.length) process.exitCode=1;
