import fs from 'node:fs';
import path from 'node:path';
import {root,readDir,evidenceIndex,statusIsReviewable,buildOwnershipResolver} from './lib/evidence-submission-utils.mjs';

const errors=[];
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const programs=new Map(readDir('content/credential-programs').filter(x=>x.id).map(x=>[x.id,x]));
const contract=JSON.parse(fs.readFileSync(path.join(root,'registry/production-validation-evidence.json'),'utf8'));
const controls=new Set((contract.controls??[]).map(x=>x.id));
const idx=evidenceIndex();
const ownership=buildOwnershipResolver();
const rows=readDir('content/evidence-submissions');
const ids=new Set();

for(const r of rows){
  if(ids.has(r.id)) errors.push(`${r.id}: duplicate submission id`); else ids.add(r.id);
  let currentVersion=null;
  if(r.scope==='course') currentVersion=courses.get(r.targetId)?.version??null;
  if(r.scope==='credential-program') currentVersion=programs.get(r.targetId)?.version??null;
  if(r.scope==='production-control') currentVersion=controls.has(r.targetId)?String(contract.version??'1'):null;
  if(currentVersion===null) errors.push(`${r.id}: unknown target ${r.targetId}`);
  else if(String(currentVersion)!==String(r.targetVersion)) errors.push(`${r.id}: targetVersion ${r.targetVersion} does not match current ${currentVersion}`);

  for(const id of r.evidenceRecordIds??[]){
    const hit=idx.get(id);
    if(!hit){ errors.push(`${r.id}: missing evidence record ${id}`); continue; }
    if(r.status==='ready-for-review'||r.status==='accepted'){
      if(!statusIsReviewable(hit)) errors.push(`${r.id}: ${id} is not evidence-complete/approved for review submission`);
    }
    const x=hit.record;
    const owner=ownership.resolve(hit);
    if(r.scope==='course'){
      if(!owner.courseIds.includes(r.targetId)) errors.push(`${r.id}: evidence ${id} does not belong to course ${r.targetId}; resolved courses=${owner.courseIds.join(',')||'none'}`);
      if(x.courseVersion!==undefined && String(x.courseVersion)!==String(r.targetVersion)) errors.push(`${r.id}: evidence ${id} courseVersion mismatch`);
    }
    if(r.scope==='credential-program'){
      if(!owner.programIds.includes(r.targetId)) errors.push(`${r.id}: evidence ${id} does not belong to credential program ${r.targetId}; resolved programs=${owner.programIds.join(',')||'none'}`);
      if(x.credentialProgramVersion!==undefined && String(x.credentialProgramVersion)!==String(r.targetVersion)) errors.push(`${r.id}: evidence ${id} credentialProgramVersion mismatch`);
    }
    if(r.scope==='production-control'){
      if(!owner.controlIds.includes(r.targetId)) errors.push(`${r.id}: evidence ${id} does not belong to production control ${r.targetId}; resolved controls=${owner.controlIds.join(',')||'none'}`);
    }
  }
  if(r.status==='accepted'){
    if(!r.reviewerId||!r.reviewedAt) errors.push(`${r.id}: accepted submission requires reviewerId and reviewedAt`);
  }
}
if(errors.length){console.error('Evidence submission validation failed:');errors.forEach(e=>console.error('- '+e));process.exit(1);}
console.log(`Evidence submission validation passed. ${rows.length} manifest(s) checked.`);
