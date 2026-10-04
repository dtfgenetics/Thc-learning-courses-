import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const getAll=n=>{const out=[];for(let i=0;i<args.length;i++)if(args[i]===n&&args[i+1])out.push(args[i+1]);return out;};
const has=x=>args.includes(x);
const write=has('--write');

const sourceId=get('--source');
const sourceFile=get('--source-file');
const authority=get('--decision-authority');
const rationale=get('--rationale');
const adoptedSpecs=getAll('--component');
for(const flag of ['--confirm-all-components-pass','--confirm-no-critical-errors','--confirm-noncompensatory','--confirm-adopt']){
  if(!has(flag)) throw new Error(flag+' is required');
}
if((!sourceId&&!sourceFile)||!authority||!rationale) throw new Error('Usage: --source <IPSTDSET-ID> or --source-file <path> --decision-authority <id> --rationale <text> --component <ASSESSMENT-ID|adoptedPercent> repeated for every component --confirm-all-components-pass --confirm-no-critical-errors --confirm-noncompensatory --confirm-adopt [--write]');

const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const source=sourceFile
  ? JSON.parse(fs.readFileSync(path.resolve(root,sourceFile),'utf8'))
  : readDir('content/integrated-performance-standard-setting-evidence').find(x=>x.id===sourceId);
if(!source) throw new Error('Integrated standard-setting source record not found');
if(source.status!=='panel-complete') throw new Error('Source must have status=panel-complete');

const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const performance=new Map(readDir('content/performance-assessments').map(x=>[x.id,x]));
const course=courses.get(source.courseId);
if(!course||String(course.version)!==String(source.courseVersion)) throw new Error('Source does not match current course version');
if(course.finalAssessment) throw new Error('Integrated standard-setting approval applies only to courses without conventional finals');

const ext=course.extensions??{};
const expected=[...new Set([...(ext.credentialPracticalSetRequired??[]),...(ext.mappedPerformanceAssessments??[]),...(ext.capstoneRequired?[ext.capstoneRequired]:[])])];
const sourceIds=new Set((source.components??[]).map(x=>x.assessmentId));
for(const id of expected) if(!sourceIds.has(id)) throw new Error('Source missing required current component '+id);
if(sourceIds.size!==expected.length) throw new Error('Source component set does not exactly match current course');

for(const comp of source.components??[]){
  const a=performance.get(comp.assessmentId);
  if(!a||String(a.version)!==String(comp.assessmentVersion)) throw new Error('Component '+comp.assessmentId+' is not current version');
}

const adopted=new Map(adoptedSpecs.map(spec=>{
  const [id,pRaw]=spec.split('|');const pct=Number(pRaw);
  if(!id||!Number.isFinite(pct)||pct<0||pct>100) throw new Error('Invalid --component '+spec);
  return [id,pct];
}));
for(const id of expected) if(!adopted.has(id)) throw new Error('Missing adopted threshold for '+id);
for(const id of adopted.keys()) if(!expected.includes(id)) throw new Error('Unexpected adopted component '+id);

const now=new Date().toISOString();
const record=structuredClone(source);
record.id=source.id+'-APPROVED-'+now.replace(/[-:.TZ]/g,'').slice(0,14);
record.status='approved';
record.components=record.components.map(comp=>({
  ...comp,
  adoptedMinimumPercent:adopted.get(comp.assessmentId),
  criticalErrorRuleApproved:true
}));
record.decisionRule={
  allRequiredComponentsMustPass:true,
  noCriticalErrors:true,
  compensatoryScoringAllowed:false,
  notes:record.decisionRule?.notes??null
};
record.governanceDecision={
  decision:'adopt',
  decisionAuthority:authority,
  decisionDate:now,
  rationale
};
record.recordedAt=now;
record.summary='Approved integrated performance standard-setting decision derived from '+source.id+' for '+source.courseId+'@'+source.courseVersion+'.';
record.evidenceRefs=[...new Set([...(source.evidenceRefs??[]),source.id])];
record.limitations=[...(source.limitations??[]),'Approval applies only to the exact current practical/capstone versions and integrated decision rule recorded here.'];

if(write){
  const dir=path.join(root,'content/integrated-performance-standard-setting-evidence');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,record.id+'.json');if(fs.existsSync(file))throw new Error('Refusing to overwrite '+file);
  fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record},null,2));
