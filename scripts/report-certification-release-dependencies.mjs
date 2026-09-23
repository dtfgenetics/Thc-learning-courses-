import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const args=new Set(process.argv.slice(2));
const asJson=args.has('--json');
const check=args.has('--check');

const read=(rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=(rel)=>{
  const d=path.join(root,rel);
  if(!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>read(path.join(rel,n)));
};
const runJson=(script,args=[])=>JSON.parse(execFileSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'}));

const cert=runJson('scripts/report-certification-evidence-reconciliation.mjs',['--json']);
const production=runJson('scripts/report-production-evidence-reconciliation.mjs');
const programs=readDir('content/credential-programs').filter(x=>['CREDPROG-CULT-TECH-I-001','CREDPROG-CULT-TECH-II-001'].includes(x.id));
const candidateControls=read('registry/candidate-governance-controls.json');
const candidateGovernanceApprovals=readDir('content/candidate-governance-approvals')
  .filter(x=>x.controlsId===candidateControls.id&&String(x.controlsVersion)===String(candidateControls.version)&&x.status!=='invalidated')
  .sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt));
const latestCandidateGovernance=candidateGovernanceApprovals[0]??null;
const candidateGovernanceApproved=latestCandidateGovernance?.status==='approved'&&candidateControls.operationalUseAuthorized===true;
const candidateGovernanceEvidenceApproved=latestCandidateGovernance?.status==='approved';

const gateOrder=[
  'exactVersionHumanAssessmentReview','pilotExecution','itemAnalysis','practicalAssessorCalibration',
  'accessibilityUxHumanReview','standardSetting','secureOperationalFormReadiness',
  'occupationalProgramValidation','credentialAuthorization'
];
const priorToAuthorization=gateOrder.filter(x=>x!=='credentialAuthorization');
const sufficientForEvidence=new Set(['evidence-complete','approved','not-applicable']);
const approvedOrNa=new Set(['approved','not-applicable']);

function courseById(id){ return cert.courses.find(x=>x.courseId===id)??null; }
function statusOf(course,gate){ return course?.gates?.[gate]?.status??'missing'; }
function isAtLeastEvidence(status){ return sufficientForEvidence.has(status); }
function isApproved(status){ return approvedOrNa.has(status); }

const contradictions=[];
if(candidateControls.operationalUseAuthorized===true&&!candidateGovernanceEvidenceApproved){
  contradictions.push(`${candidateControls.id}: operationalUseAuthorized=true without approved exact-version candidate-governance evidence`);
}
const courseDependencies=[];
for(const course of cert.courses){
  const dependencies=[];

  const std=statusOf(course,'standardSetting');
  if(['evidence-complete','approved'].includes(std)){
    const prereqs=['exactVersionHumanAssessmentReview','pilotExecution','itemAnalysis'];
    if(statusOf(course,'itemAnalysis')==='not-applicable'&&statusOf(course,'practicalAssessorCalibration')!=='not-applicable') prereqs.push('practicalAssessorCalibration');
    for(const gate of prereqs){
      const s=statusOf(course,gate);
      if(!isAtLeastEvidence(s)){
        contradictions.push(`${course.courseId}: standardSetting=${std} but prerequisite ${gate}=${s}`);
      }
    }
  }

  const secure=statusOf(course,'secureOperationalFormReadiness');
  if(['evidence-complete','approved'].includes(secure)){
    for(const gate of ['exactVersionHumanAssessmentReview','itemAnalysis','standardSetting']){
      const s=statusOf(course,gate);
      if(!isAtLeastEvidence(s)){
        contradictions.push(`${course.courseId}: secureOperationalFormReadiness=${secure} but prerequisite ${gate}=${s}`);
      }
    }
  }

  for(const gate of gateOrder){
    const status=statusOf(course,gate);
    if(!['approved','not-applicable'].includes(status)){
      dependencies.push({gate,status});
    }
  }
  courseDependencies.push({
    courseId:course.courseId,
    track:course.track,
    releaseReady:course.releaseReady,
    openDependencies:dependencies
  });
}

const productionApproved=production.controls.filter(x=>x.evidenceStatus==='approved').map(x=>x.controlId);
const productionEvidenceReady=production.controls.filter(x=>['evidence-complete','approved'].includes(x.evidenceStatus)).map(x=>x.controlId);
const allProductionApproved=productionApproved.length===production.controls.length;
const allProductionEvidenceReady=productionEvidenceReady.length===production.controls.length;

const programDependencies=[];
for(const program of programs){
  const rows=(program.requiredCourses??[]).map(courseById).filter(Boolean);
  const authStatuses=rows.map(c=>statusOf(c,'credentialAuthorization'));
  const authApproved=authStatuses.some(x=>x==='approved');
  const authEvidenceComplete=authStatuses.some(x=>x==='evidence-complete');

  const preApprovalBlockers=[];
  const preEvidenceBlockers=[];
  for(const course of rows){
    for(const gate of priorToAuthorization){
      const s=statusOf(course,gate);
      if(!isApproved(s)) preApprovalBlockers.push({courseId:course.courseId,gate,status:s});
      if(!isAtLeastEvidence(s)) preEvidenceBlockers.push({courseId:course.courseId,gate,status:s});
    }
  }
  if(!candidateGovernanceApproved){
    preApprovalBlockers.push({
      scope:'candidate-governance',
      controlsId:candidateControls.id,
      controlsVersion:candidateControls.version,
      evidenceStatus:latestCandidateGovernance?.status??'missing',
      operationalUseAuthorized:candidateControls.operationalUseAuthorized===true
    });
  }
  if(!candidateGovernanceEvidenceApproved){
    preEvidenceBlockers.push({
      scope:'candidate-governance',
      controlsId:candidateControls.id,
      controlsVersion:candidateControls.version,
      evidenceStatus:latestCandidateGovernance?.status??'missing',
      operationalUseAuthorized:candidateControls.operationalUseAuthorized===true
    });
  }
  if(!allProductionApproved){
    for(const c of production.controls.filter(x=>x.evidenceStatus!=='approved')){
      preApprovalBlockers.push({scope:'production',controlId:c.controlId,status:c.evidenceStatus});
    }
  }
  if(!allProductionEvidenceReady){
    for(const c of production.controls.filter(x=>!['evidence-complete','approved'].includes(x.evidenceStatus))){
      preEvidenceBlockers.push({scope:'production',controlId:c.controlId,status:c.evidenceStatus});
    }
  }

  if(authApproved && preApprovalBlockers.length){
    contradictions.push(`${program.id}: credentialAuthorization=approved while ${preApprovalBlockers.length} prerequisite release dependency/dependencies remain unapproved`);
  }
  if(authEvidenceComplete && preEvidenceBlockers.length){
    contradictions.push(`${program.id}: credentialAuthorization=evidence-complete while ${preEvidenceBlockers.length} prerequisite dependency/dependencies remain below evidence-complete`);
  }

  programDependencies.push({
    credentialProgramId:program.id,
    credentialProgramVersion:program.version,
    requiredCourses:rows.length,
    credentialAuthorizationStatuses:[...new Set(authStatuses)],
    approvalBlockerCount:preApprovalBlockers.length,
    evidenceBlockerCount:preEvidenceBlockers.length,
    candidateGovernance:{
      controlsId:candidateControls.id,
      controlsVersion:candidateControls.version,
      evidenceStatus:latestCandidateGovernance?.status??'missing',
      evidenceRecordId:latestCandidateGovernance?.id??null,
      operationalUseAuthorized:candidateControls.operationalUseAuthorized===true,
      approvedAndApplied:candidateGovernanceApproved
    },
    productionControlsApproved:productionApproved.length,
    productionControlsTotal:production.controls.length,
    approvalBlockers:preApprovalBlockers,
    evidenceBlockers:preEvidenceBlockers
  });
}

const summary={
  canonicalCourses:cert.canonicalCourses,
  releaseReadyCourses:cert.releaseReadyCourses,
  programs:programDependencies.length,
  programsAuthorizationApprovalReady:programDependencies.filter(x=>x.approvalBlockerCount===0).length,
  programsAuthorizationEvidenceReady:programDependencies.filter(x=>x.evidenceBlockerCount===0).length,
  candidateGovernanceEvidenceStatus:latestCandidateGovernance?.status??'missing',
  candidateGovernanceOperationalUseAuthorized:candidateControls.operationalUseAuthorized===true,
  candidateGovernanceApprovedAndApplied:candidateGovernanceApproved,
  productionControlsApproved:productionApproved.length,
  productionControlsTotal:production.controls.length,
  dependencyContradictions:contradictions.length
};

const output={
  generatedFrom:'certification evidence reconciliation + production evidence reconciliation',
  summary,
  dependencyContradictions:contradictions,
  programs:programDependencies,
  courses:courseDependencies
};

if(asJson) console.log(JSON.stringify(output,null,2));
else{
  console.log('Certification release dependency graph');
  console.log(`Courses release-ready: ${summary.releaseReadyCourses}/${summary.canonicalCourses}`);
  console.log(`Programs approval-ready: ${summary.programsAuthorizationApprovalReady}/${summary.programs}`);
  console.log(`Production controls approved: ${summary.productionControlsApproved}/${summary.productionControlsTotal}`);
  console.log(`Dependency contradictions: ${summary.dependencyContradictions}`);
  for(const p of programDependencies){
    console.log(`${p.credentialProgramId}: approval blockers=${p.approvalBlockerCount}; evidence blockers=${p.evidenceBlockerCount}`);
  }
  if(contradictions.length){
    console.log('\nContradictions:');
    contradictions.forEach(x=>console.log('- '+x));
  }
}
if(check && contradictions.length) process.exitCode=1;
