import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-program-packets-'));
const run=spawnSync(process.execPath,['scripts/build-program-validation-packets.mjs','--write','--json','--out',dir],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.packetCount!==3) throw new Error('expected 3 program/governance packets');
if(out.counts['occupational-program-validation']!==2) throw new Error('expected two occupational packets');
if(out.counts['candidate-governance']!==1) throw new Error('expected one candidate-governance packet');
for(const p of out.packets){
  if(!fs.existsSync(path.join(dir,p.id+'.md'))||!fs.existsSync(path.join(dir,p.id+'.json'))) throw new Error(p.id+': missing generated packet');
}
const gov=JSON.parse(fs.readFileSync(path.join(dir,'CANDIDATEGOV-001.json'),'utf8'));
if(gov.unresolvedDecisions.finalAttemptLimit!==null||gov.unresolvedDecisions.waitingPeriodHours!==null||gov.unresolvedDecisions.feePolicy!==null) throw new Error('candidate governance packet fabricated unresolved policy values');
console.log('Program validation packet generation: PASS (2 occupational + 1 candidate governance).');
