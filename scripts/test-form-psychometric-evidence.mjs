import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root=process.cwd();
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'thc-form-psy-'));
const assessment=JSON.parse(fs.readFileSync('content/assessments/ASSESS-LH-TECH1-001-FINAL.json','utf8'));
const itemIds=assessment.items;

function input(participantCount,minReliabilitySampleSize,computeReliability){
  return {
    courseId:'COURSE-LH-TECH1-001',
    assessmentId:assessment.id,
    formId:'PILOT-FORM-A',
    formRevision:'r1',
    cohortId:'COHORT-PSY-TEST-'+participantCount,
    analystId:'TEST-ANALYST',
    minimumReliabilitySampleSize:minReliabilitySampleSize,
    computeReliability,
    cutScores:[
      {percent:80,source:'configured-provisional',notes:'Synthetic regression only.'},
      {percent:75,source:'sensitivity-only',notes:'Synthetic regression only.'}
    ],
    participants:Array.from({length:participantCount},(_,i)=>({
      participantId:'P'+String(i+1).padStart(3,'0'),
      durationSeconds:900+i*7,
      items:itemIds.map((itemId,j)=>({itemId,correct:((i+j)%5)!==0}))
    }))
  };
}
function build(payload,complete=true){
  const file=path.join(tmp,'input-'+Math.random().toString(16).slice(2)+'.json');
  fs.writeFileSync(file,JSON.stringify(payload));
  const args=['scripts/build-form-psychometric-evidence.mjs','--input',file];
  if(complete) args.push('--complete');
  const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
  if(r.status!==0) throw new Error(r.stderr||r.stdout);
  return JSON.parse(r.stdout).record;
}
const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const schema=JSON.parse(fs.readFileSync('schemas/form-psychometric-evidence.schema.json','utf8'));
const validate=ajv.compile(schema);

const insufficient=build(input(12,30,true));
if(!validate(insufficient)) throw new Error(JSON.stringify(validate.errors));
if(insufficient.reliability.status!=='insufficient-data'||insufficient.reliability.value!==null) throw new Error('small sample must report insufficient-data reliability');
if(insufficient.sampleSize!==12) throw new Error('sample size drift');
if(insufficient.classificationAnalysis.cutScores.some(x=>x.passCount+x.failCount!==12)) throw new Error('classification counts drift');

const computed=build(input(40,30,true));
if(!validate(computed)) throw new Error(JSON.stringify(validate.errors));
if(computed.reliability.status!=='computed'||typeof computed.reliability.value!=='number') throw new Error('sufficient synthetic sample should compute KR-20');
if(computed.scoreSummary.histogram.reduce((n,b)=>n+b.count,0)!==40) throw new Error('histogram does not sum to sample size');

const notRequested=build(input(40,30,false),false);
if(notRequested.reliability.status!=='not-computed'||notRequested.reliability.value!==null||notRequested.status!=='draft') throw new Error('not-requested reliability/draft state incorrect');

console.log('Form-level psychometric evidence: PASS (insufficient-data, computed, and not-computed states).');
