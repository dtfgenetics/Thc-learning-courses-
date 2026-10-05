import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-prod-evidence-'));
const run=spawnSync(process.execPath,['scripts/build-production-evidence-packets.mjs','--write','--json','--out',dir],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.packetCount!==13) throw new Error(`expected 13 production packets, got ${out.packetCount}`);
if(out.mappedGateCount<12) throw new Error(`expected at least 12 mapped readiness gates, got ${out.mappedGateCount}`);
for(const p of out.packets){
  if(p.requiredEvidence<1) throw new Error(`${p.controlId}: missing required evidence`);
  if(p.verificationFields!==p.requiredEvidence) throw new Error(`${p.controlId}: structured verification field coverage drift`);
  if(p.executionChecks<1) throw new Error(`${p.controlId}: missing live execution checks`);
  for(const ext of ['md','json']){
    const file=path.join(dir,`${p.controlId}.${ext}`);
    if(!fs.existsSync(file)) throw new Error(`${p.controlId}: missing generated ${ext} packet`);
  }
  const packetJson=JSON.parse(fs.readFileSync(path.join(dir,`${p.controlId}.json`),'utf8'));
  const keys=(packetJson.verificationFields??[]).map(x=>x.key);
  if(new Set(keys).size!==keys.length) throw new Error(`${p.controlId}: duplicate structured verification keys`);
  const md=fs.readFileSync(path.join(dir,`${p.controlId}.md`),'utf8');
  if(!md.includes('- Container image digest:')) throw new Error(`${p.controlId}: packet missing exact image digest field`);
  if(!md.includes('- Signed provenance attestation reference:')) throw new Error(`${p.controlId}: packet missing provenance attestation field`);
  if(!md.includes('## Structured verification fields')) throw new Error(`${p.controlId}: packet missing structured verification section`);
}
const backup=JSON.parse(fs.readFileSync(path.join(dir,'backup-restore.json'),'utf8'));
const backupKeys=backup.verificationFields.map(x=>x.key);
for(const key of ['backupJobIdentifier','successfulBackupTimestamp','isolatedRestoreTarget','restoreDrillTimestamp','schemaDataIntegrityVerification','rpoRtoObservations']){
  if(!backupKeys.includes(key)) throw new Error(`backup-restore missing expected verification key ${key}`);
}
const monitoring=JSON.parse(fs.readFileSync(path.join(dir,'monitoring-alerting.json'),'utf8'));
const monitoringKeys=monitoring.verificationFields.map(x=>x.key);
for(const key of ['deployedMetricsLogSource','alertRuleIdentifiers','syntheticTestAlertTimestamp','deliveryRecord','ownerAcknowledgement']){
  if(!monitoringKeys.includes(key)) throw new Error(`monitoring-alerting missing expected verification key ${key}`);
}
console.log('Production evidence packet generation: PASS (13 controls).');
