import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const has=x=>args.includes(x);
const write=has('--write');

const courseId=get('--course');
const method=get('--method');
const panelists=Number(get('--panelists'));
const rawScore=Number(get('--raw-score'));
const percent=Number(get('--percent'));
const authority=get('--authority');
const performanceLevelDescriptionApproved=has('--pld-approved');
const sensitivityReviewed=has('--sensitivity-reviewed');
const pilotSampleSizeRaw=get('--pilot-sample-size');
const pilotSampleSize=pilotSampleSizeRaw===null?null:Number(pilotSampleSizeRaw);
const estimatedPassRateRaw=get('--estimated-pass-rate');
const estimatedPassRate=estimatedPassRateRaw===null?null:Number(estimatedPassRateRaw);
const roundingRule=get('--rounding-rule');
const notes=get('--notes');

if(!courseId||!method||!authority) throw new Error('Usage: --course <COURSE-ID> --method <method> --panelists <N>=2+ --raw-score <N> --percent <0-100> --authority <id> [--pld-approved] [--sensitivity-reviewed] [--pilot-sample-size N] [--estimated-pass-rate 0-1] [--rounding-rule text] [--notes text] [--write]');
if(!Number.isInteger(panelists)||panelists<2) throw new Error('--panelists must be an integer >= 2');
if(!Number.isFinite(rawScore)||rawScore<0) throw new Error('--raw-score must be >= 0');
if(!Number.isFinite(percent)||percent<0||percent>100) throw new Error('--percent must be between 0 and 100');
if(pilotSampleSize!==null&&(!Number.isInteger(pilotSampleSize)||pilotSampleSize<0)) throw new Error('--pilot-sample-size must be an integer >= 0');
if(estimatedPassRate!==null&&(!Number.isFinite(estimatedPassRate)||estimatedPassRate<0||estimatedPassRate>1)) throw new Error('--estimated-pass-rate must be between 0 and 1');

const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const assessments=readDir('content/assessments');
const course=courses.get(courseId); if(!course) throw new Error('Unknown course '+courseId);
if(!course.finalAssessment) throw new Error(courseId+' does not use a conventional final; this intake is for conventional-final standard setting');
const assessment=assessments.find(x=>x.id===course.finalAssessment);
if(!assessment) throw new Error('Missing final assessment '+course.finalAssessment);
const methods=new Set(['modified-angoff','angoff','bookmark','borderline-group','contrasting-groups','other']);
if(!methods.has(method)) throw new Error('Unsupported standard-setting method '+method);

const now=new Date().toISOString();
const safe=v=>String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const record={
  id:'STDSET-'+safe(course.id.replace(/^COURSE-/,''))+'-'+now.replace(/[-:.TZ]/g,'').slice(0,14),
  courseId:course.id,
  courseVersion:String(course.version),
  assessmentId:assessment.id,
  assessmentVersion:assessment.version,
  status:'panel-complete',
  method,
  panelistCount:panelists,
  stableItemCount:(assessment.items??[]).length,
  performanceLevelDescriptionApproved,
  recommendedCutScore:{rawScore,percent,roundingRule:roundingRule??null},
  impactReview:{
    pilotSampleSize,
    estimatedPassRateAtRecommendedCut:estimatedPassRate,
    sensitivityReviewed,
    notes:notes??null
  },
  governanceDecision:{
    decision:'pending',
    productionCutScorePercent:null,
    decisionAuthority:null,
    decisionDate:null,
    rationale:null
  },
  authorityId:authority,
  recordedAt:now,
  summary:'Panel-complete standard-setting evidence for '+course.id+'@'+course.version+' and '+assessment.id+'@'+assessment.version+'; governance adoption remains pending.',
  evidenceRefs:[],
  limitations:['Panel recommendation only. This record does not adopt a production cut score until a separate governance decision is recorded.']
};

if(write){
  const dir=path.join(root,'content/standard-setting-evidence');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,record.id+'.json');if(fs.existsSync(file))throw new Error('Refusing to overwrite '+file);
  fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record},null,2));
