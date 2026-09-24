import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {assertCredentialAuthorizationEvidenceComplete,applyCredentialProgramAuthorization,applyCourseCredentialAuthorization} from './lib/credential-authorization-finalization.mjs';

const root=process.cwd(),args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;},has=x=>args.includes(x),write=has('--write');
const sourceId=get('--source'),sourceFile=get('--source-file'),authority=get('--decision-authority'),rationale=get('--rationale');
const approvalFlags=['--confirm-program-approval','--confirm-assessment-approval','--confirm-accessibility-approval','--confirm-privacy-legal-approval','--confirm-security-approval','--confirm-organizational-approval','--confirm-release'];
if((!sourceId&&!sourceFile)||!authority||!rationale) throw new Error('Usage requires source, decision authority, rationale, all six governance approval confirmations and --confirm-release');
for(const f of approvalFlags)if(!has(f))throw new Error(f+' is required');

const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const source=sourceFile?JSON.parse(fs.readFileSync(path.resolve(root,sourceFile),'utf8')):readDir('content/credential-authorization-evidence').find(x=>x.id===sourceId);
if(!source)throw new Error('Credential authorization source not found');
assertCredentialAuthorizationEvidenceComplete(source);

const deps=JSON.parse(execFileSync(process.execPath,['scripts/report-certification-release-dependencies.mjs','--json'],{cwd:root,encoding:'utf8'}));
const programDeps=deps.programs.find(x=>x.credentialProgramId===source.credentialProgramId);if(!programDeps)throw new Error('Program not in release dependency graph');
if(programDeps.approvalBlockerCount!==0)throw new Error('Final credential authorization is blocked by '+programDeps.approvalBlockerCount+' prerequisite approval(s)');

const programs=new Map(readDir('content/credential-programs').filter(x=>x.id).map(x=>[x.id,x])),courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const program=programs.get(source.credentialProgramId);if(!program||String(program.version)!==String(source.credentialProgramVersion))throw new Error('Stale credential program version');
for(const lock of source.authorizedCourses??[]){const c=courses.get(lock.courseId);if(!c||String(c.version)!==String(lock.courseVersion))throw new Error('Stale course authorization lock '+lock.courseId);}

const now=new Date().toISOString(),record=structuredClone(source);
record.id=source.id+'-APPROVED-'+now.replace(/[-:.TZ]/g,'').slice(0,14);record.status='approved';record.authorityId=authority;record.recordedAt=now;
record.governance={programApproval:true,assessmentApproval:true,accessibilityApproval:true,privacyLegalApproval:true,securityApproval:true,organizationalApproval:true,finalReleaseDecision:'approve',decisionAuthority:authority,decisionDate:now,rationale};
record.summary='Approved professional credential authorization for '+source.credentialProgramId+'@'+source.credentialProgramVersion+'.';
record.evidenceRefs=[...new Set([...(source.evidenceRefs??[]),source.id])];
record.limitations=[...(source.limitations??[]),'Authorization applies only to the exact program/course versions and governed production controls represented by this record.'];

const nextProgram=applyCredentialProgramAuthorization(program);
const nextCourses=(program.requiredCourses??[]).map(id=>{const c=courses.get(id);if(!c)throw new Error('Missing required course '+id);return applyCourseCredentialAuthorization(c);});

if(write){
  const d=path.join(root,'content/credential-authorization-evidence');const f=path.join(d,record.id+'.json');if(fs.existsSync(f))throw new Error('Refusing overwrite');
  fs.writeFileSync(f,JSON.stringify(record,null,2)+'\n');
  fs.writeFileSync(path.join(root,'content/credential-programs',program.id+'.json'),JSON.stringify(nextProgram,null,2)+'\n');
  for(const c of nextCourses)fs.writeFileSync(path.join(root,'content/courses',c.id+'.json'),JSON.stringify(c,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record,appliedProgramStatus:nextProgram.status,authorizedCourseIds:nextCourses.map(c=>c.id)},null,2));