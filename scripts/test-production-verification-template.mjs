import {spawnSync} from 'node:child_process';

function run(control){
  const r=spawnSync(process.execPath,['scripts/build-production-verification-template.mjs','--control',control],{cwd:process.cwd(),encoding:'utf8'});
  if(r.status!==0) throw new Error(r.stderr||r.stdout);
  return JSON.parse(r.stdout);
}

const backup=run('backup-restore');
for(const key of ['backupJobIdentifier','successfulBackupTimestamp','isolatedRestoreTarget','restoreDrillTimestamp','schemaDataIntegrityVerification','rpoRtoObservations']){
  if(!Object.hasOwn(backup.verification,key)) throw new Error(`backup template missing ${key}`);
  if(backup.verification[key]!==null) throw new Error(`backup template must not fabricate value for ${key}`);
}
const monitoring=run('monitoring-alerting');
for(const key of ['deployedMetricsLogSource','alertRuleIdentifiers','syntheticTestAlertTimestamp','deliveryRecord','ownerAcknowledgement']){
  if(!Object.hasOwn(monitoring.verification,key)) throw new Error(`monitoring template missing ${key}`);
  if(monitoring.verification[key]!==null) throw new Error(`monitoring template must not fabricate value for ${key}`);
}

const bad=spawnSync(process.execPath,['scripts/build-production-verification-template.mjs','--control','not-a-control'],{cwd:process.cwd(),encoding:'utf8'});
if(bad.status===0) throw new Error('unknown production control unexpectedly generated a verification template');

console.log('Production verification template generation: PASS');
