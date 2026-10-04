import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ajv=new Ajv2020({allErrors:true,strict:false}); addFormats(ajv);
const schema=JSON.parse(fs.readFileSync('schemas/evidence-submission-manifest.schema.json','utf8'));
const validate=ajv.compile(schema);

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'thc-evidence-submission-'));
const root=process.cwd();

function run(args){
  const r=spawnSync(process.execPath,['scripts/create-evidence-submission-manifest.mjs',...args],{cwd:root,encoding:'utf8'});
  if(r.status!==0) throw new Error(r.stderr||r.stdout);
  return JSON.parse(r.stdout).record;
}

// Use a synthetic already-existing evidence id only for creator lookup via temporary repo is not practical,
// so validate the schema and fail-closed state semantics directly here.
const fixture={
  id:'EVSUB-COURSE-COURSE-LH-TECH1-001-20260923230000',
  scope:'course',
  targetId:'COURSE-LH-TECH1-001',
  targetVersion:'0.2.0',
  status:'draft',
  submittedBy:'TEST-REVIEW-LEAD',
  submittedAt:'2026-09-23T23:00:00Z',
  evidenceRecordIds:['TEST-EVIDENCE-001'],
  declarations:{noSecrets:true,noPrivateKeys:true,noLearnerPII:true,exactVersionEvidence:true,noFabricatedCompletion:true},
  summary:'Synthetic schema-only submission fixture.',
  reviewerId:null,reviewedAt:null,decisionNotes:null,limitations:[]
};
if(!validate(fixture)) throw new Error(JSON.stringify(validate.errors));

const bad=structuredClone(fixture);
bad.declarations.noLearnerPII=false;
if(validate(bad)) throw new Error('submission schema allowed noLearnerPII=false');

console.log('Evidence submission manifest schema and fail-closed declarations: PASS');
