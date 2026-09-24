import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd(),args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;},has=x=>args.includes(x),write=has('--write');
const sourceId=get('--source'),sourceFile=get('--source-file'),authority=get('--authority');
const validityType=get('--validity-type'),validityDaysRaw=get('--validity-days'),renewalRequiredRaw=get('--renewal-required'),renewalWindowRaw=get('--renewal-window-days'),renewalMethod=get('--renewal-method');
const flags=['--confirm-issuer-authority','--confirm-signing-controls','--confirm-public-verification','--confirm-revocation-policy','--confirm-appeals-policy','--confirm-lifecycle-policy','--confirm-privacy-retention-policy'];
if((!sourceId&&!sourceFile)||!authority||!validityType||renewalRequiredRaw===null||!renewalMethod) throw new Error('Usage requires source, authority, lifecycle policy values, and all explicit confirmations');
for(const f of flags)if(!has(f))throw new Error(f+' is required');
if(!['indefinite','fixed-term'].includes(validityType))throw new Error('--validity-type must be indefinite or fixed-term');
const renewalRequired=renewalRequiredRaw==='true'?true:renewalRequiredRaw==='false'?false:null;if(renewalRequired===null)throw new Error('--renewal-required must be true or false');
const validityDays=validityDaysRaw===null?null:Number(validityDaysRaw),renewalWindowDays=renewalWindowRaw===null?null:Number(renewalWindowRaw);
if(validityType==='fixed-term'&&(!Number.isInteger(validityDays)||validityDays<1))throw new Error('fixed-term validity requires --validity-days >=1');
if(renewalRequired&&(!Number.isInteger(renewalWindowDays)||renewalWindowDays<1))throw new Error('renewal requires --renewal-window-days >=1');
if(!['none','reassessment','performance-reassessment','full-recredential'].includes(renewalMethod))throw new Error('invalid --renewal-method');

const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const source=sourceFile?JSON.parse(fs.readFileSync(path.resolve(root,sourceFile),'utf8')):readDir('content/credential-authorization-evidence').find(x=>x.id===sourceId);
if(!source)throw new Error('Credential authorization source not found');if(source.status!=='draft')throw new Error('Source must be draft');
const deps=JSON.parse(execFileSync(process.execPath,['scripts/report-certification-release-dependencies.mjs','--json'],{cwd:root,encoding:'utf8'}));
const programDeps=deps.programs.find(x=>x.credentialProgramId===source.credentialProgramId);if(!programDeps)throw new Error('Program not in release dependency graph');
if(programDeps.evidenceBlockerCount!==0)throw new Error('Credential authorization evidence cannot complete while '+programDeps.evidenceBlockerCount+' prerequisite evidence blocker(s) remain');

const production=JSON.parse(execFileSync(process.execPath,['scripts/report-production-evidence-reconciliation.mjs'],{cwd:root,encoding:'utf8'}));
const status=id=>production.controls.find(x=>x.controlId===id)?.evidenceStatus;
const atLeast=id=>['evidence-complete','approved'].includes(status(id));
for(const id of ['production-postgres','admin-mfa','row-level-authorization','backup-restore','monitoring-alerting','credential-signing','secure-assessment-store']){
  if(!atLeast(id))throw new Error('Production prerequisite '+id+' is not evidence-complete');
}
const controls=JSON.parse(fs.readFileSync(path.join(root,'registry/candidate-governance-controls.json'),'utf8'));
if(String(source.privacyRetention?.candidateGovernanceControlsVersion)!==String(controls.version))throw new Error('Credential authorization source uses stale candidate-governance controls');

const now=new Date().toISOString(),record=structuredClone(source);
record.id=source.id+'-COMPLETE-'+now.replace(/[-:.TZ]/g,'').slice(0,14);record.status='evidence-complete';record.authorityId=authority;record.recordedAt=now;
record.issuer.authorityConfirmed=true;
Object.assign(record.signing,{keyIdRecorded:true,keyRotationProcedureApproved:true,compromiseResponseApproved:true});
Object.assign(record.verification,{publicVerificationEnabled:true,minimumNecessaryProjection:true,tamperDetectionEnabled:true,statusLookupSupportsRevocation:true});
Object.assign(record.revocation,{policyApproved:true,publicStatusUpdated:true});
Object.assign(record.appeals,{policyApproved:true});
Object.assign(record.lifecycle,{validityPolicyApproved:true,renewalPolicyApproved:true,supersessionPolicyApproved:true,expirationBehaviorDefined:true,validityType,validityDays:validityType==='fixed-term'?validityDays:null,renewalRequired,renewalWindowDays:renewalRequired?renewalWindowDays:null,renewalMethod});
Object.assign(record.privacyRetention,{policyApproved:true,retentionScheduleApproved:true,deletionOrDispositionProcedureApproved:true,candidateGovernanceControlsVersion:String(controls.version)});
Object.assign(record.productionControls,{
  persistentStoreValidated:atLeast('production-postgres'),
  authorizationValidated:atLeast('admin-mfa')&&atLeast('row-level-authorization'),
  backupRestoreValidated:atLeast('backup-restore'),
  monitoringValidated:atLeast('monitoring-alerting'),
  signingIntegrationValidated:atLeast('credential-signing'),
  secureAssessmentStoreValidated:atLeast('secure-assessment-store')
});
record.summary='Evidence-complete credential authorization package for '+source.credentialProgramId+'@'+source.credentialProgramVersion+'; final governance release decision remains pending.';
record.evidenceRefs=[...new Set([...(source.evidenceRefs??[]),source.id])];
record.limitations=[...(source.limitations??[]),'Evidence-complete does not authorize release until every prerequisite is approved and final governance approves issuance.'];
if(write){const d=path.join(root,'content/credential-authorization-evidence');const f=path.join(d,record.id+'.json');if(fs.existsSync(f))throw new Error('Refusing overwrite');fs.writeFileSync(f,JSON.stringify(record,null,2)+'\n');}
console.log(JSON.stringify({wroteFile:write,evidenceBlockerCount:programDeps.evidenceBlockerCount,record},null,2));