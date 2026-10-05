import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {assertDerivedGateApprovable} from './lib/certification-gate-approval-policy.mjs';

const root=process.cwd();
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'thc-final-approval-'));

assertDerivedGateApprovable('pilotExecution','evidence-complete');
assertDerivedGateApprovable('itemAnalysis','evidence-complete');
assertDerivedGateApprovable('practicalAssessorCalibration','evidence-complete');
assertDerivedGateApprovable('accessibilityUxHumanReview','evidence-complete');
assertDerivedGateApprovable('occupationalProgramValidation','evidence-complete');

for(const [gate,status] of [
  ['pilotExecution','prepared'],
  ['pilotExecution','in-progress'],
  ['pilotExecution','approved'],
  ['standardSetting','evidence-complete'],
  ['credentialAuthorization','evidence-complete']
]){
  let failed=false;
  try{assertDerivedGateApprovable(gate,status);}catch{failed=true;}
  if(!failed) throw new Error('approval policy did not fail closed for '+gate+' / '+status);
}

const source={
  id:'PRODEVID-BACKUP-RESTORE-TEST',
  controlId:'backup-restore',
  status:'in-progress',
  environment:'production',
  observedAt:'2026-09-23T20:00:00Z',
  authorityId:'TEST-OPERATOR',
  summary:'Synthetic production validation source for regression only.',
  evidenceRefs:['RUN-TEST-001'],
  findingsDispositioned:false,
  deploymentIdentity:null,
  verification:{
    backupJobIdentifier:'TEST-BACKUP-001',
    successfulBackupTimestamp:'2026-09-23T18:00:00Z',
    isolatedRestoreTarget:'TEST-RESTORE-ISOLATED',
    restoreDrillTimestamp:'2026-09-23T19:00:00Z',
    schemaDataIntegrityVerification:'synthetic-regression-pass',
    rpoRtoObservations:'synthetic regression: RPO 15m / RTO 30m'
  },
  limitations:['Synthetic regression fixture only.']
};
const sourceFile=path.join(tmp,'prod-source.json');
fs.writeFileSync(sourceFile,JSON.stringify(source,null,2));

function run(script,args){
  const r=spawnSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'});
  if(r.status!==0) throw new Error(r.stderr||r.stdout);
  return JSON.parse(r.stdout);
}
const incompleteFile=path.join(tmp,'prod-incomplete.json');
fs.writeFileSync(incompleteFile,JSON.stringify({...source,verification:{backupJobIdentifier:'ONLY-ONE-FIELD'}},null,2));
const incomplete=spawnSync(process.execPath,[
  'scripts/complete-production-control-evidence.mjs','--source-file',incompleteFile,'--authority','TEST-OPS-AUTH',
  '--confirm-required-evidence','--confirm-findings-dispositioned'
],{cwd:root,encoding:'utf8'});
if(incomplete.status===0) throw new Error('production completion accepted incomplete control-specific verification');

const complete=run('scripts/complete-production-control-evidence.mjs',[
  '--source-file',sourceFile,'--authority','TEST-OPS-AUTH',
  '--confirm-required-evidence','--confirm-findings-dispositioned'
]);
if(complete.record.status!=='evidence-complete'||complete.record.findingsDispositioned!==true) throw new Error('production completion transition failed');
const completeFile=path.join(tmp,'prod-complete.json');
fs.writeFileSync(completeFile,JSON.stringify(complete.record,null,2));

const approved=run('scripts/approve-production-control-evidence.mjs',[
  '--source-file',completeFile,'--authority','TEST-OPS-AUTH',
  '--decision-notes','Synthetic regression validates approval/application path.',
  '--confirm-live-verification','--confirm-apply-readiness'
]);
if(approved.record.status!=='approved') throw new Error('production approval transition failed');
const tamperedComplete={...complete.record,verification:{backupJobIdentifier:'ONLY-ONE-FIELD'}};
const tamperedFile=path.join(tmp,'prod-tampered-complete.json');
fs.writeFileSync(tamperedFile,JSON.stringify(tamperedComplete,null,2));
const tamperedApproval=spawnSync(process.execPath,[
  'scripts/approve-production-control-evidence.mjs','--source-file',tamperedFile,
  '--authority','TEST','--decision-notes','Should fail structured verification',
  '--confirm-live-verification','--confirm-apply-readiness'
],{cwd:root,encoding:'utf8'});
if(tamperedApproval.status===0) throw new Error('production approval accepted incomplete control-specific verification');
if(!approved.readinessApplied.includes('operations.backupRestoreTested')) throw new Error('backup-restore readiness mapping missing');
if(approved.contractStatus!=='evidence-in-progress'&&approved.contractStatus!=='approved') throw new Error('unexpected contract status '+approved.contractStatus);

const missingConfirm=spawnSync(process.execPath,[
  'scripts/approve-production-control-evidence.mjs','--source-file',completeFile,
  '--authority','TEST','--decision-notes','Should fail'
],{cwd:root,encoding:'utf8'});
if(missingConfirm.status===0) throw new Error('production approval did not require explicit application confirmations');

console.log('Final approval/application transitions: PASS (derived gate policy + production complete/approve/apply path).');
