import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-validation-kits-'));
const run=spawnSync(process.execPath,['scripts/build-validation-operator-kits.mjs','--write','--json','--out',dir],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.counts.pilot!==15) throw new Error('expected 15 pilot kits');
if(out.counts.accessibility!==15) throw new Error('expected 15 accessibility kits');
if(out.counts.calibration!==17) throw new Error('expected 17 calibration kits');
if(out.counts['occupational-validation']!==2) throw new Error('expected 2 occupational-validation kits');
if(out.counts['production-control']!==12) throw new Error('expected 12 production-control kits');
if(out.kitCount!==61) throw new Error('expected 61 total validation operator kits, got '+out.kitCount);
for(const k of out.kits){
  for(const ext of ['md','json']){
    if(!fs.existsSync(path.join(dir,k.id+'.'+ext))) throw new Error(k.id+': missing '+ext+' kit');
  }
}
const calFile=fs.readdirSync(dir).find(x=>x.startsWith('KIT-CAL-')&&x.endsWith('.json'));
const cal=JSON.parse(fs.readFileSync(path.join(dir,calFile),'utf8'));
if(!cal.privateInputTemplate||!cal.startCommand.includes('build-practical-calibration-evidence.mjs')) throw new Error('calibration kit missing private input workflow');
console.log('Validation operator kit generation: PASS (61 exact-version kits).');
