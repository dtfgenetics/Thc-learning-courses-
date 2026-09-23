import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=new Set(process.argv.slice(2));
const asJson=args.has('--json');
const check=args.has('--check');
const requireReleaseReady=args.has('--require-release-ready');

const readJson=(rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=(rel)=>{
  const dir=path.join(root,rel);
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')));
};

const registry=readJson('registry/certification-validation-execution.json');
const coursesById=new Map(readDir('content/courses').map(x=>[x.id,x]));
const assessments=new Map(readDir('content/assessments').map(x=>[x.id,x]));
const questions=new Map(readDir('content/questions').map(x=>[x.id,x]));
const reviews=readDir('content/reviews');
const pilotEvidence=readDir('content/pilot-evidence');
const calibrationEvidence=readDir('content/calibration-evidence');
const standardSettingEvidence=readDir('content/standard-setting-evidence');
const secureFormEvidence=readDir('content/secure-form-equivalence-evidence');
const credentialAuthorizationEvidence=readDir('content/credential-authorization-evidence');
const credentialPrograms=readDir('content/credential-programs').filter(x=>x.id);
const gateEvidence=readDir('content/certification-gate-evidence');
const performance=new Map(readDir('content/performance-assessments').map(x=>[x.id,x]));

const gateOrder=[
  'exactVersionHumanAssessmentReview','pilotExecution','itemAnalysis',
  'practicalAssessorCalibration','accessibilityUxHumanReview','standardSetting',
  'secureOperationalFormReadiness','credentialAuthorization'
];
const rank={prepared:0,'in-progress':1,'evidence-complete':2,approved:3,'revision-required':-1,'not-applicable':99};

function latestGateRecord(courseId,courseVersion,gate){
  return gateEvidence
    .filter(r=>r.courseId===courseId&&String(r.courseVersion)===String(courseVersion)&&r.gate===gate)
    .sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0]??null;
}
function latestAssessmentReview(objectId,objectVersion){
  return reviews
    .filter(r=>r.objectId===objectId&&String(r.objectVersion)===String(objectVersion)&&r.reviewType==='assessment')
    .sort((a,b)=>Date.parse(b.reviewedAt)-Date.parse(a.reviewedAt))[0]??null;
}
function reviewState(review){
  if(!review) return 'prepared';
  return review.status==='approved'?'approved':'revision-required';
}
function combineStates(states){
  if(states.includes('revision-required')) return 'revision-required';
  if(states.every(s=>s==='approved')) return 'approved';
  if(states.some(s=>s==='approved'||s==='evidence-complete'||s==='in-progress')) return 'in-progress';
  return 'prepared';
}
function deriveHumanReview(courseRow){
  if(!courseRow.conventionalFinal) return {status:'not-applicable',detail:{reason:'no conventional final'}};
  const a=assessments.get(courseRow.finalAssessmentId);
  if(!a) return {status:'prepared',problems:[`missing assessment ${courseRow.finalAssessmentId}`]};
  const defReview=latestAssessmentReview(a.id,a.version);
  const itemStates=[];
  const missing=[];
  for(const id of a.items??[]){
    const item=questions.get(id);
    if(!item){missing.push(id);continue;}
    itemStates.push(reviewState(latestAssessmentReview(item.id,item.version)));
  }
  const status=missing.length?'prepared':combineStates([reviewState(defReview),...itemStates]);
  return {status,detail:{assessmentId:a.id,assessmentVersion:a.version,itemCount:itemStates.length,definitionReview:reviewState(defReview),itemStates},problems:missing.map(id=>`missing item ${id}`)};
}
function deriveItemAnalysis(courseRow){
  if(!courseRow.conventionalFinal) return {status:'not-applicable',detail:{reason:'no conventional final'}};
  const a=assessments.get(courseRow.finalAssessmentId);
  if(!a) return {status:'prepared',problems:[`missing assessment ${courseRow.finalAssessmentId}`]};
  let total=0,withAny=0,complete=0;
  const missing=[];
  for(const id of a.items??[]){
    const item=questions.get(id);
    if(!item){missing.push(id);continue;}
    total++;
    const rows=pilotEvidence.filter(p=>p.itemId===item.id&&String(p.itemVersion)===String(item.version)&&p.status!=='invalidated');
    if(rows.length) withAny++;
    if(rows.some(p=>p.status==='complete')) complete++;
  }
  let status='prepared';
  if(total>0&&complete===total) status='evidence-complete';
  else if(withAny>0) status='in-progress';
  return {status,detail:{itemCount:total,itemsWithAnyPilotEvidence:withAny,itemsWithCompletePilotEvidence:complete},problems:missing.map(id=>`missing item ${id}`)};
}
function performanceIdsForIntegrated(courseId){
  const c=coursesById.get(courseId);
  if(!c) return [];
  const ids=[];
  const ext=c.extensions??{};
  if(Array.isArray(ext.credentialPracticalSetRequired)) ids.push(...ext.credentialPracticalSetRequired);
  if(Array.isArray(ext.mappedPerformanceAssessments)) ids.push(...ext.mappedPerformanceAssessments);
  if(ext.capstoneRequired) ids.push(ext.capstoneRequired);
  return [...new Set(ids)];
}
function deriveCalibration(courseRow){
  if(!courseRow.integratedPerformance) return {status:'not-applicable',detail:{reason:'not integrated performance course'}};
  const ids=performanceIdsForIntegrated(courseRow.courseId);
  let total=0,withAny=0,complete=0;
  const problems=[];
  for(const id of ids){
    const a=performance.get(id);
    if(!a){problems.push(`missing performance assessment ${id}`);continue;}
    total++;
    const rows=calibrationEvidence.filter(e=>e.assessmentId===id&&String(e.assessmentVersion)===String(a.version)&&e.status!=='invalidated');
    if(rows.length) withAny++;
    if(rows.some(e=>e.status==='complete'&&e.unresolvedCriticalErrorDisagreements===0)) complete++;
  }
  let status='prepared';
  if(total>0&&complete===total) status='evidence-complete';
  else if(withAny>0) status='in-progress';
  return {status,detail:{requiredPerformanceAssessments:total,withCalibrationEvidence:withAny,withCompleteResolvedCalibrationEvidence:complete},problems};
}
function deriveStandardSetting(courseRow){
  if(!courseRow.conventionalFinal) return {status:'not-applicable',detail:{reason:'no conventional final'}};
  const course=coursesById.get(courseRow.courseId);
  const assessment=assessments.get(courseRow.finalAssessmentId);
  if(!course||!assessment) return {status:'prepared',problems:[`missing course or assessment for standard setting`]};
  const rows=standardSettingEvidence
    .filter(e=>e.courseId===courseRow.courseId&&String(e.courseVersion)===String(course.version)&&e.assessmentId===assessment.id&&String(e.assessmentVersion)===String(assessment.version)&&e.status!=='invalidated')
    .sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt));
  const latest=rows[0]??null;
  if(!latest) return {status:'prepared',detail:{records:0,assessmentId:assessment.id,assessmentVersion:assessment.version}};
  const status=latest.status==='approved'?'approved':latest.status==='revision-required'?'revision-required':latest.status==='panel-complete'?'evidence-complete':'in-progress';
  return {status,detail:{records:rows.length,latestRecordId:latest.id,method:latest.method,productionCutScorePercent:latest.governanceDecision?.productionCutScorePercent??null}};
}
function deriveSecureForms(courseRow){
  if(!courseRow.conventionalFinal) return {status:'not-applicable',detail:{reason:'no conventional final'}};
  const course=coursesById.get(courseRow.courseId);
  const assessment=assessments.get(courseRow.finalAssessmentId);
  if(!course||!assessment) return {status:'prepared',problems:[`missing course or assessment for secure form readiness`]};
  const rows=secureFormEvidence
    .filter(e=>e.courseId===courseRow.courseId&&String(e.courseVersion)===String(course.version)&&e.assessmentId===assessment.id&&String(e.assessmentVersion)===String(assessment.version)&&e.status!=='invalidated')
    .sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt));
  const latest=rows[0]??null;
  if(!latest) return {status:'prepared',detail:{records:0,assessmentId:assessment.id,assessmentVersion:assessment.version}};
  const status=latest.status==='approved'?'approved':latest.status==='revision-required'?'revision-required':latest.status==='evidence-complete'?'evidence-complete':'in-progress';
  return {status,detail:{records:rows.length,latestRecordId:latest.id,formCount:latest.formCount,quantitativeEvidenceStatus:latest.equivalenceReview?.quantitativeEvidenceStatus??null}};
}
function deriveCredentialAuthorization(courseRow){
  const course=coursesById.get(courseRow.courseId);
  if(!course) return {status:'prepared',problems:[`missing course for credential authorization`]};
  const programs=credentialPrograms.filter(p=>(p.requiredCourses??[]).includes(courseRow.courseId));
  if(programs.length!==1) return {status:'prepared',problems:[`expected exactly one credential program for ${courseRow.courseId}, found ${programs.length}`]};
  const program=programs[0];
  const rows=credentialAuthorizationEvidence
    .filter(e=>e.credentialProgramId===program.id&&String(e.credentialProgramVersion)===String(program.version)&&e.status!=='invalidated')
    .sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt));
  const latest=rows[0]??null;
  if(!latest) return {status:'prepared',detail:{credentialProgramId:program.id,credentialProgramVersion:program.version,records:0}};
  const courseLock=latest.authorizedCourses?.find(x=>x.courseId===courseRow.courseId);
  if(!courseLock || String(courseLock.courseVersion)!==String(course.version)){
    return {status:'prepared',detail:{credentialProgramId:program.id,latestRecordId:latest.id},problems:[`credential authorization does not cover current course version ${course.version}`]};
  }
  const status=latest.status==='approved'?'approved':latest.status==='revision-required'?'revision-required':latest.status==='evidence-complete'?'evidence-complete':latest.status==='suspended'?'revision-required':'in-progress';
  return {status,detail:{credentialProgramId:program.id,credentialProgramVersion:program.version,latestRecordId:latest.id,finalReleaseDecision:latest.governance?.finalReleaseDecision??null}};
}
function explicitOrDerived(courseRow,gate,derived){
  const course=coursesById.get(courseRow.courseId);
  const explicit=course?latestGateRecord(courseRow.courseId,course.version,gate):null;
  if(!explicit) return {...derived,source:'derived'};
  const problems=[...(derived.problems??[])];

  // Approval for gates with repository-verifiable prerequisites cannot leapfrog missing evidence.
  if(explicit.status==='approved' && ['exactVersionHumanAssessmentReview','itemAnalysis','practicalAssessorCalibration','standardSetting','secureOperationalFormReadiness','credentialAuthorization'].includes(gate)){
    if(!['evidence-complete','approved'].includes(derived.status)){
      problems.push(`approved attestation cannot satisfy ${gate} before repository-verifiable prerequisite evidence is complete`);
      return {status:derived.status,source:'derived-with-rejected-attestation',detail:derived.detail,attestationId:explicit.id,problems};
    }
  }
  return {status:explicit.status,source:'attestation',attestationId:explicit.id,detail:derived.detail,problems};
}

const structuralProblems=[];
const rows=[];
for(const courseRow of registry.courses??[]){
  const course=coursesById.get(courseRow.courseId);
  if(!course){structuralProblems.push(`missing canonical course ${courseRow.courseId}`);continue;}
  const derived={
    exactVersionHumanAssessmentReview:deriveHumanReview(courseRow),
    itemAnalysis:deriveItemAnalysis(courseRow),
    practicalAssessorCalibration:deriveCalibration(courseRow),
    standardSetting:deriveStandardSetting(courseRow),
    secureOperationalFormReadiness:deriveSecureForms(courseRow),
    credentialAuthorization:deriveCredentialAuthorization(courseRow)
  };
  const gates={};
  for(const gate of gateOrder){
    if(['exactVersionHumanAssessmentReview','itemAnalysis','practicalAssessorCalibration','standardSetting','secureOperationalFormReadiness','credentialAuthorization'].includes(gate)){
      gates[gate]=explicitOrDerived(courseRow,gate,derived[gate]);
    }else{
      const rec=latestGateRecord(courseRow.courseId,course.version,gate);
      const baseline=courseRow.evidence?.[gate]??'prepared';
      gates[gate]=rec
        ? {status:rec.status,source:'attestation',attestationId:rec.id}
        : {status:baseline,source:'registry-baseline'};
    }
  }
  const applicable=gateOrder.filter(g=>gates[g].status!=='not-applicable');
  const releaseReady=applicable.every(g=>gates[g].status==='approved');
  rows.push({
    courseId:courseRow.courseId,
    courseVersion:course.version,
    track:courseRow.track,
    ordinal:courseRow.ordinal,
    releaseReady,
    gates
  });
  for(const gate of gateOrder){
    for(const p of gates[gate].problems??[]) structuralProblems.push(`${courseRow.courseId} ${gate}: ${p}`);
  }
}

const gateSummary={};
for(const gate of gateOrder){
  gateSummary[gate]={};
  for(const row of rows){
    const s=row.gates[gate].status;
    gateSummary[gate][s]=(gateSummary[gate][s]??0)+1;
  }
}
const output={
  generatedFrom:'live repository evidence',
  canonicalCourses:rows.length,
  releaseReadyCourses:rows.filter(r=>r.releaseReady).length,
  allCoursesReleaseReady:rows.length===15&&rows.every(r=>r.releaseReady),
  structuralProblems,
  gateSummary,
  courses:rows
};

if(asJson){
  console.log(JSON.stringify(output,null,2));
}else{
  console.log('Certification evidence reconciliation');
  console.log(`Canonical courses: ${output.canonicalCourses}/15`);
  console.log(`Release-ready courses: ${output.releaseReadyCourses}/15`);
  console.log(`All courses release ready: ${output.allCoursesReleaseReady?'YES':'NO'}`);
  for(const gate of gateOrder) console.log(`${gate}: ${JSON.stringify(gateSummary[gate])}`);
  if(structuralProblems.length){
    console.log('\nStructural/evidence problems:');
    for(const p of structuralProblems) console.log(`- ${p}`);
  }
}
if(check && structuralProblems.length) process.exitCode=1;
if(requireReleaseReady && !output.allCoursesReleaseReady) process.exitCode=2;
