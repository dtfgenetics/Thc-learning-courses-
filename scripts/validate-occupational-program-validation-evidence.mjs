import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const errors=[];
const readDir=(rel)=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>({file:path.join(rel,n),data:JSON.parse(fs.readFileSync(path.join(d,n),'utf8'))}));};
const programs=new Map(readDir('content/credential-programs').filter(x=>x.data.id).map(x=>[x.data.id,x.data]));
const courses=new Map(readDir('content/courses').map(x=>[x.data.id,x.data]));
const sourceRegistry=JSON.parse(fs.readFileSync(path.join(root,'registry/public-authoritative-source-supplements.json'),'utf8'));
const occupationalBaseline=JSON.parse(fs.readFileSync(path.join(root,'registry/public-occupational-source-baseline.json'),'utf8'));
const jtaEvidence=readDir('content/job-task-analysis-evidence').map(x=>x.data);
const smeEvidence=readDir('content/sme-employer-validation-evidence').map(x=>x.data);
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
      [r.technicalCurriculumReview,'publicSourceReviewCompleted'],
      [r.jobTaskAnalysis,'validated'],
      [r.jobTaskAnalysis,'populationDefined'],
      [r.jobTaskAnalysis,'taskDomainCoverageReviewed'],
      [r.jobTaskAnalysis,'currencyReviewed'],
      [r.jobTaskAnalysis,'publicOccupationalSourceReviewCompleted'],
      [r.smeEmployerValidation,'completed'],
      [r.smeEmployerValidation,'roleRepresentativenessReviewed'],
      [r.smeEmployerValidation,'criticalTasksReviewed'],
      [r.smeEmployerValidation,'scopeOfPracticeReviewed'],
      [r.assessmentBlueprint,'weightsFinalized'],
      [r.assessmentBlueprint,'competencyCoverageApproved'],
      [r.assessmentBlueprint,'criticalContentRepresentationApproved'],
      [r.assessmentBlueprint,'cognitiveDemandApproved']
    ]) if(obj?.[key]!==true) errors.push(`${file}: ${r.status} requires ${key}=true`);
    if(r.technicalCurriculumReview?.sourceReviewRegistryId!==sourceRegistry.id) errors.push(`${file}: completed technical review must reference current source review registry ${sourceRegistry.id}`);
    if(String(r.technicalCurriculumReview?.sourceReviewRegistryAsOf)!==String(sourceRegistry.asOf)) errors.push(`${file}: completed technical review source registry date is stale`);
    if(!(r.evidenceRefs??[]).includes(sourceRegistry.id)) errors.push(`${file}: completed occupational evidence must include source-review registry evidenceRef`);
    if(r.jobTaskAnalysis?.occupationalSourceBaselineId!==occupationalBaseline.id) errors.push(`${file}: completed JTA must reference current occupational source baseline ${occupationalBaseline.id}`);
    if(String(r.jobTaskAnalysis?.occupationalSourceBaselineAsOf)!==String(occupationalBaseline.asOf)) errors.push(`${file}: completed JTA occupational source baseline date is stale`);
    if(!(r.evidenceRefs??[]).includes(occupationalBaseline.id)) errors.push(`${file}: completed occupational evidence must include occupational source baseline evidenceRef`);
    const matchingJta=jtaEvidence.filter(x=>x.credentialProgramId===r.credentialProgramId&&String(x.credentialProgramVersion)===String(r.credentialProgramVersion)&&x.status==='complete'&&x.baselineId===occupationalBaseline.id&&String(x.baselineAsOf)===String(occupationalBaseline.asOf));
    if(matchingJta.length===0) errors.push(`${file}: completed occupational validation requires complete current structured JTA evidence`);
    else if(!(r.evidenceRefs??[]).some(id=>matchingJta.some(x=>x.id===id))) errors.push(`${file}: completed occupational evidence must reference a complete current JTA evidence record`);
    const matchingSme=smeEvidence.filter(x=>x.credentialProgramId===r.credentialProgramId&&String(x.credentialProgramVersion)===String(r.credentialProgramVersion)&&x.status==='complete'&&matchingJta.some(j=>j.id===x.jtaEvidenceId));
    if(matchingSme.length===0) errors.push(`${file}: completed occupational validation requires complete structured SME/employer evidence linked to current JTA`);
    else if(!(r.evidenceRefs??[]).some(id=>matchingSme.some(x=>x.id===id))) errors.push(`${file}: completed occupational evidence must reference a complete current SME/employer evidence record`);
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
