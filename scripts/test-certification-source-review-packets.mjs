import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const outDir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-source-review-'));
const run=spawnSync(process.execPath,[
  'scripts/build-certification-source-review-packets.mjs',
  '--write','--json','--check','--out',outDir
],{cwd:root,encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.summary.canonicalCourses!==15) throw new Error('expected 15 canonical course source packets');
if(out.summary.lessons!==284) throw new Error('expected 284 canonical lessons');
if(out.summary.lessonsWithDirectReferences!==284) throw new Error('all canonical lessons must retain direct references');
if(out.summary.sourceIntegrityProblems!==0) throw new Error('source integrity problems: '+out.problems.join('; '));
for(const c of out.courses){
  for(const ext of ['json','md']){
    const f=path.join(outDir,c.courseId+'.'+ext);
    if(!fs.existsSync(f)) throw new Error(c.courseId+': missing generated '+ext+' source packet');
  }
}

const supplement=JSON.parse(fs.readFileSync('registry/public-authoritative-source-supplements.json','utf8'));
if((supplement.mappings??[]).length!==4) throw new Error('expected four initial exact-version public-source supplements');
const required=[
  'REF-EPA-WPS-LABELING-ACCESS-2026',
  'REF-EPA-WPS-AEZ-2025',
  'REF-NIOSH-WRA-PREVENTION-2024',
  'REF-CDC-MMWR-CANNABIS-ASTHMA-2023'
];
for(const id of required){
  const p=path.join(root,'content/references',id+'.json');
  if(!fs.existsSync(p)) throw new Error('missing refreshed public source '+id);
  const ref=JSON.parse(fs.readFileSync(p,'utf8'));
  if(ref.status!=='reviewed-source') throw new Error(id+': must be reviewed-source');
  if(ref.evidenceLevel!=='standards-government') throw new Error(id+': expected standards-government evidence level');
  if(!ref.lastVerifiedAt) throw new Error(id+': missing lastVerifiedAt');
  if(!ref.url?.startsWith('https://')) throw new Error(id+': expected https source URL');
}

console.log('Certification public-source review packets: PASS (15 courses, 284 lessons, 4 exact-version supplemental mappings).');
