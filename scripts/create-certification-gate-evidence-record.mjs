import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=(name)=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
const write=args.includes('--write');

const courseId=get('--course');
const gate=get('--gate');
const status=get('--status');
const authorityId=get('--authority');
const summary=get('--summary');
const evidenceRefs=(get('--evidence-refs')??'').split(',').map(x=>x.trim()).filter(Boolean);
const limitations=(get('--limitations')??'').split('|').map(x=>x.trim()).filter(Boolean);

const allowedGates=new Set([
  'exactVersionHumanAssessmentReview','pilotExecution','itemAnalysis',
  'practicalAssessorCalibration','accessibilityUxHumanReview','standardSetting',
  'secureOperationalFormReadiness','credentialAuthorization'
]);
const allowedStatuses=new Set(['in-progress','evidence-complete','approved','revision-required']);

if(!courseId||!gate||!status||!authorityId||!summary){
  console.error('Usage: node scripts/create-certification-gate-evidence-record.mjs --course <COURSE-ID> --gate <gate> --status <status> --authority <id> --summary <text> [--evidence-refs ref1,ref2] [--limitations a|b] [--write]');
  process.exit(1);
}
if(!allowedGates.has(gate)) throw new Error(`Unsupported gate ${gate}`);
if(!allowedStatuses.has(status)) throw new Error(`Unsupported status ${status}`);

const coursePath=path.join(root,'content/courses',`${courseId}.json`);
if(!fs.existsSync(coursePath)) throw new Error(`Unknown course ${courseId}`);
const course=JSON.parse(fs.readFileSync(coursePath,'utf8'));

const stamp=new Date().toISOString();
const compact=stamp.replace(/[-:.TZ]/g,'').slice(0,14);
const gateSlug=gate.replace(/([a-z])([A-Z])/g,'$1-$2').toUpperCase();
const record={
  id:`CGE-${courseId.replace(/^COURSE-/,'')}-${gateSlug}-${compact}`,
  courseId,
  courseVersion:String(course.version),
  gate,
  status,
  authorityId,
  recordedAt:stamp,
  summary,
  evidenceRefs,
  limitations,
  decisionNotes:null
};

if(write){
  const dir=path.join(root,'content/certification-gate-evidence');
  fs.mkdirSync(dir,{recursive:true});
  const target=path.join(dir,`${record.id}.json`);
  if(fs.existsSync(target)) throw new Error(`Refusing to overwrite ${path.relative(root,target)}`);
  fs.writeFileSync(target,`${JSON.stringify(record,null,2)}\n`);
}
console.log(JSON.stringify({wroteFile:write,record},null,2));
