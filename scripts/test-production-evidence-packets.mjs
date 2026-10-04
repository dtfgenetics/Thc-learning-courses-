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
  if(p.executionChecks<1) throw new Error(`${p.controlId}: missing live execution checks`);
  for(const ext of ['md','json']){
    const file=path.join(dir,`${p.controlId}.${ext}`);
    if(!fs.existsSync(file)) throw new Error(`${p.controlId}: missing generated ${ext} packet`);
  }
}
console.log('Production evidence packet generation: PASS (13 controls).');
