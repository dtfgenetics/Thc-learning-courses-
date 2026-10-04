import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-evidence-packets-'));
const run=spawnSync(process.execPath,['scripts/build-certification-evidence-packets.mjs','--write','--json','--out',dir],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.packetCount!==15) throw new Error(`expected 15 packets, got ${out.packetCount}`);
if(out.gateCount!==9) throw new Error(`expected 9 evidence gates, got ${out.gateCount}`);
if(out.conventionalFinalPackets!==13) throw new Error('expected 13 conventional-final packets');
if(out.integratedPerformancePackets!==2) throw new Error('expected 2 integrated-performance packets');
for(const p of out.packets){
  const md=path.join(dir,`${p.courseId}.md`);
  const json=path.join(dir,`${p.courseId}.json`);
  if(!fs.existsSync(md)||!fs.existsSync(json)) throw new Error(`missing generated packet for ${p.courseId}`);
  const text=fs.readFileSync(md,'utf8');
  if(!text.includes('Integrity boundary')) throw new Error(`${p.courseId} packet missing integrity boundary`);
}
console.log('Certification evidence packet generation: PASS (15 exact-version packets, 9 gates each).');
