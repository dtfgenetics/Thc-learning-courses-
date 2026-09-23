import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const errors=[];
const readJson=(rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=(rel)=>{
  const dir=path.join(root,rel);
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>({file:path.join(rel,n),data:JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))}));
};

const programs=new Map(readDir('content/credential-programs').filter(x=>x.data.id).map(x=>[x.data.id,x.data]));
const courses=new Map(readDir('content/courses').map(x=>[x.data.id,x.data]));
const controls=readJson('registry/candidate-governance-controls.json');
const governanceApprovals=readDir('content/candidate-governance-approvals').map(x=>x.data);
const rows=readDir('content/credential-authorization-evidence');
const ids=new Set();

const mustTruePaths=[
  ['issuer','authorityConfirmed'],
  ['signing','managedExternalSignerRequired'],
  ['signing','keyIdRecorded'],
  ['signing','privateKeyOutsideRepository'],
  ['signing','keyRotationProcedureApproved'],
  ['signing','compromiseResponseApproved'],
  ['verification','publicVerificationEnabled'],
  ['verification','minimumNecessaryProjection'],
  ['verification','tamperDetectionEnabled'],
  ['verification','statusLookupSupportsRevocation'],
  ['revocation','policyApproved'],
  ['revocation','authorizedDecisionMakerRequired'],
  ['revocation','reasonRecorded'],
  ['revocation','effectiveDateRecorded'],
  ['revocation','publicStatusUpdated'],
  ['revocation','auditTrailRequired'],
  ['appeals','policyApproved'],
  ['appeals','preserveOriginalRecord'],
  ['appeals','independentOrAuthorizedReviewRequired'],
  ['appeals','decisionRecordRequired'],
  ['appeals','secureAnswerDisclosureProhibited'],
  ['lifecycle','validityPolicyApproved'],
  ['lifecycle','renewalPolicyApproved'],
  ['lifecycle','supersessionPolicyApproved'],
  ['lifecycle','expirationBehaviorDefined'],
  ['privacyRetention','policyApproved'],
  ['privacyRetention','dataMinimization'],
  ['privacyRetention','roleBasedAccess'],
  ['privacyRetention','retentionScheduleApproved'],
  ['privacyRetention','auditTrailRequired'],
  ['privacyRetention','deletionOrDispositionProcedureApproved'],
  ['productionControls','persistentStoreValidated'],
  ['productionControls','authorizationValidated'],
  ['productionControls','backupRestoreValidated'],
  ['productionControls','monitoringValidated'],
  ['productionControls','signingIntegrationValidated'],
  ['productionControls','secureAssessmentStoreValidated'],
  ['governance','programApproval'],
  ['governance','assessmentApproval'],
  ['governance','accessibilityApproval'],
  ['governance','privacyLegalApproval'],
  ['governance','securityApproval'],
  ['governance','organizationalApproval']
];

const get=(o,path)=>path.reduce((v,k)=>v?.[k],o);
for(const {file,data:r} of rows){
  if(ids.has(r.id)) errors.push(`${file}: duplicate id ${r.id}`); else ids.add(r.id);
  const program=programs.get(r.credentialProgramId);
  if(!program) errors.push(`${file}: unknown credential program ${r.credentialProgramId}`);
  else{
    if(String(program.version)!==String(r.credentialProgramVersion)) errors.push(`${file}: credentialProgramVersion ${r.credentialProgramVersion} does not match current ${program.version}`);
    const expected=new Set(program.requiredCourses??[]);
    const actual=new Set((r.authorizedCourses??[]).map(x=>x.courseId));
    for(const id of expected) if(!actual.has(id)) errors.push(`${file}: authorizedCourses missing required course ${id}`);
    for(const id of actual) if(!expected.has(id)) errors.push(`${file}: authorizedCourses contains course outside program ${id}`);
  }
  for(const entry of r.authorizedCourses??[]){
    const c=courses.get(entry.courseId);
    if(!c) errors.push(`${file}: unknown course ${entry.courseId}`);
    else if(String(c.version)!==String(entry.courseVersion)) errors.push(`${file}: ${entry.courseId} version ${entry.courseVersion} does not match current ${c.version}`);
  }

  if(r.status==='approved'){
    for(const p of mustTruePaths){
      if(get(r,p)!==true) errors.push(`${file}: approved authorization requires ${p.join('.')}=true`);
    }
    if(r.governance?.finalReleaseDecision!=='approve') errors.push(`${file}: approved authorization requires finalReleaseDecision=approve`);
    if(!r.governance?.decisionAuthority||!r.governance?.decisionDate) errors.push(`${file}: approved authorization requires governance decision authority/date`);
    const governanceApproval=governanceApprovals
      .filter(x=>x.controlsId===controls.id&&String(x.controlsVersion)===String(controls.version)&&x.status==='approved')
      .sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0]??null;
    if(!governanceApproval) errors.push(`${file}: approved credential authorization requires approved exact-version candidate governance evidence`);
    if(controls.operationalUseAuthorized!==true) errors.push(`${file}: candidate governance controls are not authorized for operational use`);
    if(r.privacyRetention?.candidateGovernanceControlsVersion!==controls.version) errors.push(`${file}: candidate governance controls version must match current ${controls.version}`);
  }
  if(r.status==='suspended' && r.governance?.finalReleaseDecision!=='suspend') errors.push(`${file}: suspended authorization requires finalReleaseDecision=suspend`);
}

if(errors.length){
  console.error('Credential authorization evidence validation failed:');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
console.log(`Credential authorization evidence validation passed. ${rows.length} record(s) checked against current program/course versions.`);
