import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd(),args=process.argv.slice(2);
const has=x=>args.includes(x),value=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=has('--write'),asJson=has('--json'),outDir=path.resolve(root,value('--out')??'generated/credential-authorization-kits');
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const deps=JSON.parse(execFileSync(process.execPath,['scripts/report-certification-release-dependencies.mjs','--json'],{cwd:root,encoding:'utf8'}));
const programs=readDir('content/credential-programs').filter(x=>['CREDPROG-CULT-TECH-I-001','CREDPROG-CULT-TECH-II-001'].includes(x.id));
const auth=readDir('content/credential-authorization-evidence');

const kits=programs.map(p=>{
  const dep=deps.programs.find(x=>x.credentialProgramId===p.id);
  const latest=auth.filter(x=>x.credentialProgramId===p.id&&String(x.credentialProgramVersion)===String(p.version)&&x.status!=='invalidated').sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0]??null;
  return {
    id:'KIT-CREDAUTH-'+p.id.replace(/^CREDPROG-/,''),
    credentialProgramId:p.id,credentialProgramVersion:String(p.version),programStatus:p.status,
    requiredCourses:p.requiredCourses??[],
    latestAuthorization:latest?{id:latest.id,status:latest.status,finalReleaseDecision:latest.governance?.finalReleaseDecision??null}:{status:'missing'},
    evidenceBlockerCount:dep?.evidenceBlockerCount??null,
    approvalBlockerCount:dep?.approvalBlockerCount??null,
    candidateGovernance:dep?.candidateGovernance??null,
    productionControlsApproved:dep?.productionControlsApproved??0,
    productionControlsTotal:dep?.productionControlsTotal??0,
    evidenceBlockers:dep?.evidenceBlockers??[],
    approvalBlockers:dep?.approvalBlockers??[],
    intakeCommand:'npm run evidence:intake:credential-authorization -- --program '+p.id+' --authority <AUTHORIZATION-LEAD> --issuer-id <ISSUER-ID> --issuer-name "<ISSUER-NAME>" --issuer-url <PUBLIC-URL> --write',
    completionCommand:'npm run evidence:complete:credential-authorization -- --source <CREDAUTH-DRAFT-ID> --authority <AUTHORIZATION-LEAD> --validity-type <indefinite|fixed-term> [--validity-days N] --renewal-required <true|false> [--renewal-window-days N] --renewal-method <none|reassessment|performance-reassessment|full-recredential> --confirm-issuer-authority --confirm-signing-controls --confirm-public-verification --confirm-revocation-policy --confirm-appeals-policy --confirm-lifecycle-policy --confirm-privacy-retention-policy --write',
    approvalCommand:'npm run evidence:approve:credential-authorization -- --source <CREDAUTH-COMPLETE-ID> --decision-authority <FINAL-AUTHORITY> --rationale "<RATIONALE>" --confirm-program-approval --confirm-assessment-approval --confirm-accessibility-approval --confirm-privacy-legal-approval --confirm-security-approval --confirm-organizational-approval --confirm-release --write'
  };
});
function md(k){
  const lines=['# Credential Authorization Kit — '+k.credentialProgramId,'',
    'Program: '+k.credentialProgramId+'@'+k.credentialProgramVersion,
    'Program status: '+k.programStatus,
    'Latest authorization: '+(k.latestAuthorization.id?(k.latestAuthorization.id+' / '+k.latestAuthorization.status):k.latestAuthorization.status),
    'Evidence blockers: '+k.evidenceBlockerCount,
    'Approval blockers: '+k.approvalBlockerCount,
    'Production controls approved: '+k.productionControlsApproved+'/'+k.productionControlsTotal,'',
    '## Evidence blockers','',
    ...(k.evidenceBlockers.length?k.evidenceBlockers.map(x=>'- '+JSON.stringify(x)):['- none']),'',
    '## Approval blockers','',
    ...(k.approvalBlockers.length?k.approvalBlockers.map(x=>'- '+JSON.stringify(x)):['- none']),'',
    '## Intake','', '    '+k.intakeCommand,'',
    '## Evidence completion','', '    '+k.completionCommand,'',
    '## Final approval and application','', '    '+k.approvalCommand,'',
    '## Release boundary','',
    'Evidence completion is blocked until every prerequisite has reached at least evidence-complete. Final authorization is blocked until all course gates, candidate governance and every production control are approved. Final approval atomically applies the approved state to the credential program and all exact-version required courses.'
  ];return lines.join('\n')+'\n';
}
if(write){fs.mkdirSync(outDir,{recursive:true});for(const k of kits){fs.writeFileSync(path.join(outDir,k.id+'.json'),JSON.stringify(k,null,2)+'\n');fs.writeFileSync(path.join(outDir,k.id+'.md'),md(k));}}
const out={kitCount:kits.length,wroteFiles:write,outputDirectory:path.relative(root,outDir),kits:kits.map(k=>({id:k.id,credentialProgramId:k.credentialProgramId,evidenceBlockerCount:k.evidenceBlockerCount,approvalBlockerCount:k.approvalBlockerCount,productionControlsApproved:k.productionControlsApproved,productionControlsTotal:k.productionControlsTotal,latestAuthorizationStatus:k.latestAuthorization.status}))};
if(asJson)console.log(JSON.stringify(out,null,2));else console.log('Credential authorization kits: '+kits.length);