import fs from 'node:fs';
import path from 'node:path';
import {root,readDir,evidenceIndex,buildOwnershipResolver} from './lib/evidence-submission-utils.mjs';

const args=process.argv.slice(2);
const get=(n)=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=args.includes('--write');
const scope=get('--scope');
const targetId=get('--target');
const submittedBy=get('--submitted-by');
const status=get('--status')??'draft';
const summary=get('--summary')??'Controlled evidence submission package.';
const evidenceRecordIds=(get('--evidence-ids')??'').split(',').map(x=>x.trim()).filter(Boolean);

if(!['course','credential-program','production-control'].includes(scope)) throw new Error('--scope must be course, credential-program, or production-control');
if(!targetId||!submittedBy||evidenceRecordIds.length===0) throw new Error('Usage: --scope <scope> --target <id> --submitted-by <id> --evidence-ids <id,id,...> [--status draft|ready-for-review] [--summary text] [--write]');
if(!['draft','ready-for-review'].includes(status)) throw new Error('create command supports draft or ready-for-review only');

let targetVersion;
if(scope==='course'){
  const c=readDir('content/courses').find(x=>x.id===targetId); if(!c) throw new Error(`Unknown course ${targetId}`); targetVersion=String(c.version);
}else if(scope==='credential-program'){
  const p=readDir('content/credential-programs').find(x=>x.id===targetId); if(!p) throw new Error(`Unknown credential program ${targetId}`); targetVersion=String(p.version);
}else{
  const contract=JSON.parse(fs.readFileSync(path.join(root,'registry/production-validation-evidence.json'),'utf8'));
  const control=(contract.controls??[]).find(x=>x.id===targetId); if(!control) throw new Error(`Unknown production control ${targetId}`);
  targetVersion=String(contract.version??'1');
}

const idx=evidenceIndex();
const ownership=buildOwnershipResolver();
for(const id of evidenceRecordIds){
  const hit=idx.get(id);
  if(!hit) throw new Error(`Unknown evidence record id ${id}`);
  const owner=ownership.resolve(hit);
  if(scope==='course'&&!owner.courseIds.includes(targetId)) throw new Error(`Evidence ${id} does not belong to course ${targetId}`);
  if(scope==='credential-program'&&!owner.programIds.includes(targetId)) throw new Error(`Evidence ${id} does not belong to credential program ${targetId}`);
  if(scope==='production-control'&&!owner.controlIds.includes(targetId)) throw new Error(`Evidence ${id} does not belong to production control ${targetId}`);
}

const now=new Date().toISOString();
const safe=(v)=>String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);
const record={
  id:`EVSUB-${safe(scope)}-${safe(targetId)}-${now.replace(/[-:.TZ]/g,'').slice(0,14)}`,
  scope,targetId,targetVersion,status,submittedBy,submittedAt:now,
  evidenceRecordIds,
  declarations:{noSecrets:true,noPrivateKeys:true,noLearnerPII:true,exactVersionEvidence:true,noFabricatedCompletion:true},
  summary,reviewerId:null,reviewedAt:null,decisionNotes:null,limitations:[]
};

if(write){
  const dir=path.join(root,'content/evidence-submissions');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,record.id+'.json'); if(fs.existsSync(file)) throw new Error('Refusing to overwrite '+file);
  fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record},null,2));
