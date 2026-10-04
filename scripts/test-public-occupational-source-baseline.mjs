import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root=process.cwd();
const baseline=JSON.parse(fs.readFileSync('registry/public-occupational-source-baseline.json','utf8'));
const schema=JSON.parse(fs.readFileSync('schemas/public-occupational-source-baseline.schema.json','utf8'));
const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const validate=ajv.compile(schema);
if(!validate(baseline)) throw new Error('occupational baseline schema failure: '+JSON.stringify(validate.errors));

const v=spawnSync(process.execPath,['scripts/validate-public-occupational-source-baseline.mjs'],{cwd:root,encoding:'utf8'});
if(v.status!==0) throw new Error(v.stderr||v.stdout);

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-occ-source-baseline-'));
const run=spawnSync(process.execPath,['scripts/build-public-occupational-source-baseline.mjs','--write','--json','--out',dir],{cwd:root,encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.packetCount!==2) throw new Error('expected two occupational baseline packets');
for(const p of out.programs){
  if(p.taskFamilyCount<5) throw new Error(p.credentialProgramId+': insufficient task-family baseline');
  if(p.sourceCount<2) throw new Error(p.credentialProgramId+': insufficient public occupational sources');
  const file='OCCSRC-'+p.credentialProgramId.replace(/^CREDPROG-/,'')+'.md';
  if(!fs.existsSync(path.join(dir,file))) throw new Error('missing generated '+file);
}
const ids=new Set(baseline.programs.map(x=>x.credentialProgramId));
if(!ids.has('CREDPROG-CULT-TECH-I-001')||!ids.has('CREDPROG-CULT-TECH-II-001')) throw new Error('canonical credential program baseline missing');

console.log('Public occupational source baseline: PASS (2 programs, source-backed task families, exact-version mapping).');
