import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-std-sec-kits-'));
const run=spawnSync(process.execPath,['scripts/build-standard-secure-operator-kits.mjs','--write','--json','--out',dir],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.summary.kits!==13) throw new Error('expected 13 conventional-final operator kits');
for(const k of out.kits){
  if(!fs.existsSync(path.join(dir,k.id+'.json'))||!fs.existsSync(path.join(dir,k.id+'.md'))) throw new Error(k.id+': missing operator kit files');
}
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.json'));
for(const f of files){
  const k=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
  if(!k.standardSetting?.startCommand||!k.secureForms?.startCommand) throw new Error(f+': missing execution commands');
  if(!k.formPsychometrics||!('status' in k.formPsychometrics)) throw new Error(f+': form psychometric summary missing');
  if(k.standardSetting.executionState==='blocked'&&k.standardSetting.dependencies.length===0) throw new Error(f+': blocked standard setting lacks dependencies');
  if(k.secureForms.executionState==='blocked'&&k.secureForms.dependencies.length===0) throw new Error(f+': blocked secure forms lack dependencies');
}
console.log('Standard-setting / secure-form operator kits: PASS (13 exact-version conventional finals).');
