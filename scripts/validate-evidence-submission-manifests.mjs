import fs from 'node:fs';
import path from 'node:path';
import {root,readDir,evidenceIndex,statusIsReviewable} from './lib/evidence-submission-utils.mjs';

const errors=[];
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const programs=new Map(readDir('content/credential-programs').filter(x=>x.id).map(x=>[x.id,x]));
const contract=JSON.parse(fs.readFileSync(path.join(root,'registry/production-validation-evidence.json'),'utf8'));
const controls=new Set((contract.controls??[]).map(x=>x.id));
const idx=evidenceIndex();
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
    if(r.scope==='course'){
      const courseMatch=x.courseId===r.targetId || x.objectId===r.targetId || x.targetId===r.targetId;
      const program=programs.values().find?.(()=>false);
      if(x.courseId && x.courseId!==r.targetId && !String(x.id).includes(r.targetId.replace(/^COURSE-/,''))) {
        // Evidence can be program-level only when the submission itself is program-level; keep course submissions narrow.
        errors.push(`${r.id}: evidence ${id} is locked to another course ${x.courseId}`);
      }
      if(x.courseVersion!==undefined && String(x.courseVersion)!==String(r.targetVersion)) errors.push(`${r.id}: evidence ${id} courseVersion mismatch`);
    }
    if(r.scope==='credential-program'){
      if(x.credentialProgramId && x.credentialProgramId!==r.targetId) errors.push(`${r.id}: evidence ${id} belongs to credential program ${x.credentialProgramId}`);
      if(x.credentialProgramVersion!==undefined && String(x.credentialProgramVersion)!==String(r.targetVersion)) errors.push(`${r.id}: evidence ${id} credentialProgramVersion mismatch`);
    }
    if(r.scope==='production-control' && x.controlId && x.controlId!==r.targetId) errors.push(`${r.id}: evidence ${id} belongs to production control ${x.controlId}`);
  }
  if(r.status==='accepted'){
    if(!r.reviewerId||!r.reviewedAt) errors.push(`${r.id}: accepted submission requires reviewerId and reviewedAt`);
  }
}
if(errors.length){console.error('Evidence submission validation failed:');errors.forEach(e=>console.error('- '+e));process.exit(1);}
console.log(`Evidence submission validation passed. ${rows.length} manifest(s) checked.`);
