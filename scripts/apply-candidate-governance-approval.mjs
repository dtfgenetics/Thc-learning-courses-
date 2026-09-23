import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=args.includes('--write');
const confirm=args.includes('--confirm-operational-use');
const recordId=get('--record');

const controlsPath=path.join(root,'registry/candidate-governance-controls.json');
const controls=JSON.parse(fs.readFileSync(controlsPath,'utf8'));
const dir=path.join(root,'content/candidate-governance-approvals');
const records=fs.existsSync(dir)?fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))):[];

const record=recordId
  ? records.find(x=>x.id===recordId)
  : records.filter(x=>x.controlsId===controls.id&&String(x.controlsVersion)===String(controls.version)&&x.status==='approved')
      .sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0];

if(!record) throw new Error('No approved candidate-governance record found for current controls version');
if(record.status!=='approved') throw new Error('Candidate-governance record must have status=approved before application');
if(record.controlsId!==controls.id||String(record.controlsVersion)!==String(controls.version)) throw new Error('Candidate-governance record does not match current controls id/version');

for(const k of ['program','assessment','accessibility','privacyLegal','security','organizational']){
  if(record.approvals?.[k]!==true) throw new Error('Approved record missing approvals.'+k);
}
if(record.finalAttemptPolicy?.approved!==true||record.waitingPeriodPolicy?.approved!==true||record.feePolicy?.approved!==true||record.retentionSchedule?.approved!==true){
  throw new Error('Approved record is missing one or more approved operational policy blocks');
}
for(const [k,v] of Object.entries(record.retentionSchedule.periods??{})){
  if(v===null||v==='') throw new Error('Approved record missing retention period '+k);
}

const next=structuredClone(controls);
next.status='approved';
next.operationalUseAuthorized=true;
next.updated=new Date().toISOString().slice(0,10);
next.controls.retest.finalAttemptLimit=record.finalAttemptPolicy.attemptLimit;
next.controls.retest.waitingPeriodHours=record.waitingPeriodPolicy.waitingPeriodHours;
next.controls.retest.feePolicy=record.feePolicy.policy;
next.controls.privacyRetention.retentionScheduleApproved=true;
next.controls.privacyRetention.retentionPeriods=record.retentionSchedule.periods;
next.appliedApprovalRecordId=record.id;
next.appliedApprovalAuthorityId=record.authorityId;
next.appliedApprovalRecordedAt=record.recordedAt;
next.boundary='Operational candidate-governance controls are authorized from exact-version approved evidence. Changes to policy values or controls version require renewed governance approval.';

if(write){
  if(!confirm) throw new Error('--write requires --confirm-operational-use');
  fs.writeFileSync(controlsPath,JSON.stringify(next,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,confirmedOperationalUse:confirm,recordId:record.id,controls:next},null,2));
