import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=args.includes('--write');

const courseId=get('--course');
const gate=get('--gate');
const authorityId=get('--authority');
const decisionNotes=get('--decision-notes');
const evidenceRefs=(get('--evidence-refs')??'').split(',').map(x=>x.trim()).filter(Boolean);
if(!courseId||!gate||!authorityId||!decisionNotes) throw new Error('Usage: --course <COURSE-ID> --gate <gate> --authority <id> --decision-notes <text> [--evidence-refs id,id] [--write]');

const approvable=new Set(['pilotExecution','itemAnalysis','practicalAssessorCalibration','accessibilityUxHumanReview','occupationalProgramValidation']);
if(!approvable.has(gate)) throw new Error('Gate '+gate+' is not approved through this transition');

const reconciled=JSON.parse(execFileSync(process.execPath,['scripts/report-certification-evidence-reconciliation.mjs','--json'],{cwd:root,encoding:'utf8'}));
const row=reconciled.courses.find(x=>x.courseId===courseId);
if(!row) throw new Error('Unknown canonical course '+courseId);
const state=row.gates?.[gate];
if(!state) throw new Error('Gate not found '+gate);
if(!['evidence-complete','approved'].includes(state.status)) throw new Error(gate+' must be evidence-complete before approval; current='+state.status);
if(state.status==='approved') throw new Error(gate+' is already approved for '+courseId);

const coursePath=path.join(root,'content/courses',courseId+'.json');
const course=JSON.parse(fs.readFileSync(coursePath,'utf8'));
const now=new Date().toISOString();
const slug=gate.replace(/([a-z])([A-Z])/g,'$1-$2').toUpperCase();
const refs=[...new Set([...(evidenceRefs??[]),...(state.detail?.latestRecordId?[state.detail.latestRecordId]:[])])];
const record={
  id:'CGE-'+courseId.replace(/^COURSE-/,'')+'-'+slug+'-'+now.replace(/[-:.TZ]/g,'').slice(0,14),
  courseId,
  courseVersion:String(course.version),
  gate,
  status:'approved',
  authorityId,
  recordedAt:now,
  summary:'Approved '+gate+' for '+courseId+'@'+course.version+' after repository-verifiable evidence reached evidence-complete.',
  evidenceRefs:refs,
  limitations:[],
  decisionNotes
};
if(write){
  const dir=path.join(root,'content/certification-gate-evidence');fs.mkdirSync(dir,{recursive:true});
  const target=path.join(dir,record.id+'.json');if(fs.existsSync(target))throw new Error('Refusing to overwrite '+target);
  fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,derivedStatusBeforeApproval:state.status,record},null,2));