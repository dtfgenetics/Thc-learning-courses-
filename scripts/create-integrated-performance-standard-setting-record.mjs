import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const getAll=n=>{const out=[];for(let i=0;i<args.length;i++)if(args[i]===n&&args[i+1])out.push(args[i+1]);return out;};
const has=x=>args.includes(x);
const write=has('--write');

const courseId=get('--course');
const method=get('--method')??'performance-standard-study';
const authority=get('--authority');
const panelists=Number(get('--panelists'));
const componentSpecs=getAll('--component');
if(!courseId||!authority||!Number.isInteger(panelists)||panelists<2) throw new Error('Usage: --course COURSE-LH-TECH1-007|COURSE-LH-TECH2-008 --panelists <N>=2+ --authority <id> --component <ASSESSMENT-ID|recommendedPercent> repeated for every required component [--method ...] [--write]');

const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const perf=new Map(readDir('content/performance-assessments').map(x=>[x.id,x]));
const c=courses.get(courseId); if(!c) throw new Error('Unknown course '+courseId);
if(c.finalAssessment) throw new Error(courseId+' uses a conventional final; use conventional standard-setting intake');
const ext=c.extensions??{};
const expected=[...new Set([...(ext.credentialPracticalSetRequired??[]),...(ext.mappedPerformanceAssessments??[]),...(ext.capstoneRequired?[ext.capstoneRequired]:[])])];
const supplied=new Map(componentSpecs.map(spec=>{
  const [id,pctRaw]=spec.split('|');const pct=Number(pctRaw);
  if(!id||!Number.isFinite(pct)||pct<0||pct>100) throw new Error('Invalid --component '+spec);
  return [id,pct];
}));
for(const id of expected) if(!supplied.has(id)) throw new Error('Missing required component recommendation '+id);
for(const id of supplied.keys()) if(!expected.includes(id)) throw new Error('Unexpected component '+id);

const components=expected.map(id=>{
  const a=perf.get(id);if(!a)throw new Error('Missing performance assessment '+id);
  return {assessmentId:id,assessmentVersion:a.version,assessmentType:a.assessmentType,recommendedMinimumPercent:supplied.get(id),adoptedMinimumPercent:null,criticalErrorRuleApproved:false};
});
const now=new Date().toISOString();
const safe=v=>String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const record={
  id:'IPSTDSET-'+safe(courseId.replace(/^COURSE-/,''))+'-'+now.replace(/[-:.TZ]/g,'').slice(0,14),
  courseId,courseVersion:String(c.version),status:'panel-complete',method,panelistCount:panelists,components,
  decisionRule:{allRequiredComponentsMustPass:true,noCriticalErrors:true,compensatoryScoringAllowed:false,notes:null},
  governanceDecision:{decision:'pending',decisionAuthority:null,decisionDate:null,rationale:null},
  authorityId:authority,recordedAt:now,
  summary:'Panel-complete integrated performance standard-setting evidence for '+courseId+'@'+c.version+'; governance adoption remains pending.',
  evidenceRefs:[],limitations:['Panel recommendation only. Adopted component thresholds and governance approval remain pending.']
};
if(write){
  const dir=path.join(root,'content/integrated-performance-standard-setting-evidence');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,record.id+'.json');if(fs.existsSync(file))throw new Error('Refusing to overwrite '+file);
  fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record},null,2));
