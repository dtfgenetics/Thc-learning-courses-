import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=args.includes('--write');
const authority=get('--authority');
if(!authority) throw new Error('Usage: --authority <GOVERNANCE-LEAD> [--write]');

const controls=JSON.parse(fs.readFileSync(path.join(root,'registry/candidate-governance-controls.json'),'utf8'));
const periods=controls.controls?.privacyRetention?.retentionPeriods??{};
const now=new Date().toISOString();
const safe=v=>String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const record={
  id:'CANDGOVAPP-'+safe(controls.version)+'-'+now.replace(/[-:.TZ]/g,'').slice(0,14),
  controlsId:controls.id,
  controlsVersion:String(controls.version),
  status:'approval-pending',
  approvals:{program:false,assessment:false,accessibility:false,privacyLegal:false,security:false,organizational:false},
  finalAttemptPolicy:{attemptLimit:controls.controls?.retest?.finalAttemptLimit??null,approved:false,notes:'Final attempt policy requires governance approval.'},
  waitingPeriodPolicy:{waitingPeriodHours:controls.controls?.retest?.waitingPeriodHours??null,approved:false,notes:'Waiting-period policy requires governance approval.'},
  feePolicy:{policy:controls.controls?.retest?.feePolicy??null,approved:false},
  retentionSchedule:{approved:false,periods},
  authorityId:authority,
  recordedAt:now,
  summary:'Candidate-governance review opened against '+controls.id+'@'+controls.version+'; unresolved policy values and required approvals remain pending.',
  evidenceRefs:controls.sourceDrafts??[],
  limitations:['Starter record only. It does not authorize operational credential use or supply unresolved policy values.']
};
if(write){
  const dir=path.join(root,'content/candidate-governance-approvals');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,record.id+'.json');if(fs.existsSync(file))throw new Error('Refusing to overwrite '+file);
  fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record},null,2));
