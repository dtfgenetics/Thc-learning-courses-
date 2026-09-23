import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const errors=[];
const readDir=(rel)=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>({file:path.join(rel,n),data:JSON.parse(fs.readFileSync(path.join(d,n),'utf8'))}));};
const programs=new Map(readDir('content/credential-programs').filter(x=>x.data.id).map(x=>[x.data.id,x.data]));
const courses=new Map(readDir('content/courses').map(x=>[x.data.id,x.data]));
const rows=readDir('content/occupational-program-validation-evidence');
const ids=new Set();

for(const {file,data:r} of rows){
  if(ids.has(r.id)) errors.push(`${file}: duplicate id ${r.id}`); else ids.add(r.id);
  const p=programs.get(r.credentialProgramId);
  if(!p) errors.push(`${file}: unknown credential program ${r.credentialProgramId}`);
  else {
    if(String(p.version)!==String(r.credentialProgramVersion)) errors.push(`${file}: credentialProgramVersion ${r.credentialProgramVersion} does not match current ${p.version}`);
    const expected=new Set(p.requiredCourses??[]);
    const actual=new Set((r.authorizedCourses??[]).map(x=>x.courseId));
    for(const id of expected) if(!actual.has(id)) errors.push(`${file}: missing current required course ${id}`);
    for(const id of actual) if(!expected.has(id)) errors.push(`${file}: course outside current program ${id}`);
  }
  for(const lock of r.authorizedCourses??[]){
    const c=courses.get(lock.courseId);
    if(!c) errors.push(`${file}: unknown course ${lock.courseId}`);
    else if(String(c.version)!==String(lock.courseVersion)) errors.push(`${file}: ${lock.courseId} version ${lock.courseVersion} does not match current ${c.version}`);
  }
  if(['evidence-complete','approved'].includes(r.status)){
    for(const [obj,key] of [
      [r.technicalCurriculumReview,'allCurrentCourseVersionsReviewed'],
      [r.technicalCurriculumReview,'contentScopeAndRoleBoundariesReviewed'],
      [r.technicalCurriculumReview,'scientificTechnicalConcernsResolvedOrDispositioned'],
      [r.jobTaskAnalysis,'validated'],
      [r.jobTaskAnalysis,'populationDefined'],
      [r.jobTaskAnalysis,'taskDomainCoverageReviewed'],
      [r.jobTaskAnalysis,'currencyReviewed'],
      [r.smeEmployerValidation,'completed'],
      [r.smeEmployerValidation,'roleRepresentativenessReviewed'],
      [r.smeEmployerValidation,'criticalTasksReviewed'],
      [r.smeEmployerValidation,'scopeOfPracticeReviewed'],
      [r.assessmentBlueprint,'weightsFinalized'],
      [r.assessmentBlueprint,'competencyCoverageApproved'],
      [r.assessmentBlueprint,'criticalContentRepresentationApproved'],
      [r.assessmentBlueprint,'cognitiveDemandApproved']
    ]) if(obj?.[key]!==true) errors.push(`${file}: ${r.status} requires ${key}=true`);
    const perf=r.performanceValidation;
    if(perf?.required===true){
      if(perf.practicalsValidated!==perf.practicalsExpected) errors.push(`${file}: all expected practicals must be validated`);
      if(perf.capstoneRequired===true && perf.capstoneValidated!==true) errors.push(`${file}: required capstone must be validated`);
      if(perf.criticalDecisionCoverageApproved!==true) errors.push(`${file}: critical decision coverage must be approved`);
      if(perf.unresolvedCriticalIssues!==0) errors.push(`${file}: unresolved critical issues must be zero`);
    }
  }
}
if(errors.length){console.error('Occupational program validation evidence failed:');for(const e of errors)console.error('- '+e);process.exit(1);}
console.log(`Occupational program validation evidence passed. ${rows.length} record(s) checked.`);
