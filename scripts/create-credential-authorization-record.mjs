import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;},write=args.includes('--write');
const programId=get('--program'),authority=get('--authority'),issuerId=get('--issuer-id'),issuerName=get('--issuer-name'),issuerUrl=get('--issuer-url');
if(!programId||!authority||!issuerId||!issuerName||!issuerUrl) throw new Error('Usage: --program <CREDPROG-ID> --authority <id> --issuer-id <id> --issuer-name <name> --issuer-url <https-url> [--write]');
try{new URL(issuerUrl);}catch{throw new Error('--issuer-url must be a valid URL');}
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const programs=new Map(readDir('content/credential-programs').filter(x=>x.id).map(x=>[x.id,x])),courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const controls=JSON.parse(fs.readFileSync(path.join(root,'registry/candidate-governance-controls.json'),'utf8'));
const program=programs.get(programId);if(!program)throw new Error('Unknown credential program '+programId);
const authorizedCourses=(program.requiredCourses??[]).map(id=>{const c=courses.get(id);if(!c)throw new Error('Missing course '+id);return{courseId:id,courseVersion:String(c.version)};});
const now=new Date().toISOString(),safe=v=>String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const record={
  id:'CREDAUTH-'+safe(program.id.replace(/^CREDPROG-/,''))+'-'+now.replace(/[-:.TZ]/g,'').slice(0,14),
  credentialProgramId:program.id,credentialProgramVersion:String(program.version),status:'draft',authorizedCourses,
  issuer:{issuerId,name:issuerName,publicUrl:issuerUrl,authorityConfirmed:false},
  signing:{managedExternalSignerRequired:true,keyIdRecorded:false,privateKeyOutsideRepository:true,keyRotationProcedureApproved:false,compromiseResponseApproved:false,notes:null},
  verification:{publicVerificationEnabled:false,minimumNecessaryProjection:false,tamperDetectionEnabled:false,statusLookupSupportsRevocation:false,notes:null},
  revocation:{policyApproved:false,authorizedDecisionMakerRequired:true,reasonRecorded:true,effectiveDateRecorded:true,publicStatusUpdated:false,auditTrailRequired:true,notes:null},
  appeals:{policyApproved:false,preserveOriginalRecord:true,independentOrAuthorizedReviewRequired:true,decisionRecordRequired:true,secureAnswerDisclosureProhibited:true,notes:null},
  lifecycle:{validityPolicyApproved:false,renewalPolicyApproved:false,supersessionPolicyApproved:false,expirationBehaviorDefined:false,validityType:'indefinite',validityDays:null,renewalRequired:false,renewalWindowDays:null,renewalMethod:'none',notes:null},
  privacyRetention:{policyApproved:false,dataMinimization:true,roleBasedAccess:true,retentionScheduleApproved:false,auditTrailRequired:true,deletionOrDispositionProcedureApproved:false,candidateGovernanceControlsVersion:String(controls.version),notes:null},
  productionControls:{persistentStoreValidated:false,authorizationValidated:false,backupRestoreValidated:false,monitoringValidated:false,signingIntegrationValidated:false,secureAssessmentStoreValidated:false,notes:null},
  governance:{programApproval:false,assessmentApproval:false,accessibilityApproval:false,privacyLegalApproval:false,securityApproval:false,organizationalApproval:false,finalReleaseDecision:'pending',decisionAuthority:null,decisionDate:null,rationale:null},
  authorityId:authority,recordedAt:now,
  summary:'Credential authorization intake opened for '+program.id+'@'+program.version+'; evidence completion and final release approval remain pending.',
  evidenceRefs:[],limitations:['Draft authorization record only. It does not authorize professional credential issuance or use.']
};
if(write){const d=path.join(root,'content/credential-authorization-evidence');fs.mkdirSync(d,{recursive:true});const f=path.join(d,record.id+'.json');if(fs.existsSync(f))throw new Error('Refusing overwrite');fs.writeFileSync(f,JSON.stringify(record,null,2)+'\n');}
console.log(JSON.stringify({wroteFile:write,record},null,2));