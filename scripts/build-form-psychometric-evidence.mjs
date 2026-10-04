import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const has=x=>args.includes(x);
const input=get('--input');
const write=has('--write');
const complete=has('--complete');
if(!input) throw new Error('Usage: --input <private-form-results.json> [--complete] [--write]');

const payload=JSON.parse(fs.readFileSync(path.resolve(root,input),'utf8'));
for(const k of ['courseId','assessmentId','formId','formRevision','cohortId','analystId']) if(!payload[k]) throw new Error(k+' is required');
if(!Array.isArray(payload.participants)||payload.participants.length===0) throw new Error('participants must be a non-empty array');
const minReliabilitySampleSize=Number(payload.minimumReliabilitySampleSize);
if(!Number.isInteger(minReliabilitySampleSize)||minReliabilitySampleSize<2) throw new Error('minimumReliabilitySampleSize must be an integer >= 2');

const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const assessments=new Map(readDir('content/assessments').map(x=>[x.id,x]));
const course=courses.get(payload.courseId); const assessment=assessments.get(payload.assessmentId);
if(!course) throw new Error('Unknown course '+payload.courseId);
if(!assessment) throw new Error('Unknown assessment '+payload.assessmentId);
if(course.finalAssessment!==assessment.id) throw new Error('Assessment is not the current final for '+course.id);
const itemIds=assessment.items??[];
const itemSet=new Set(itemIds);

function median(values){
  if(!values.length)return null;const s=[...values].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;
}
function percentile(values,p){
  if(!values.length)return null;const s=[...values].sort((a,b)=>a-b);const idx=Math.max(0,Math.ceil(p*s.length)-1);return s[idx];
}
function mean(values){return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;}
function sd(values){
  if(!values.length)return null;const m=mean(values);return Math.sqrt(values.reduce((n,x)=>n+(x-m)**2,0)/values.length);
}
function variance(values){
  if(values.length<2)return null;const m=mean(values);return values.reduce((n,x)=>n+(x-m)**2,0)/(values.length-1);
}
function kr20(matrix){
  const n=matrix.length;if(n<2)return null;const k=matrix[0].length;if(k<2)return null;
  const totals=matrix.map(row=>row.reduce((a,b)=>a+b,0));
  const varTotal=variance(totals);if(!Number.isFinite(varTotal)||varTotal===0)return null;
  let pq=0;
  for(let j=0;j<k;j++){
    const p=matrix.reduce((n,row)=>n+row[j],0)/n;
    pq+=p*(1-p);
  }
  return (k/(k-1))*(1-(pq/varTotal));
}

const scores=[];const durations=[];const matrix=[];const seen=new Set();
for(const [i,p] of payload.participants.entries()){
  if(!p||typeof p!=='object') throw new Error('participants['+i+'] must be an object');
  if(typeof p.participantId!=='string'||!p.participantId) throw new Error('participantId required');
  if(seen.has(p.participantId)) throw new Error('duplicate participantId '+p.participantId);seen.add(p.participantId);
  if(!Number.isFinite(p.durationSeconds)||p.durationSeconds<0) throw new Error('durationSeconds invalid for '+p.participantId);
  if(!Array.isArray(p.items)) throw new Error('items array required for '+p.participantId);
  const map=new Map();
  for(const r of p.items){
    if(!itemSet.has(r.itemId)) throw new Error('unknown item '+r.itemId+' for '+p.participantId);
    if(map.has(r.itemId)) throw new Error('duplicate item response '+r.itemId+' for '+p.participantId);
    if(typeof r.correct!=='boolean') throw new Error('correct must be boolean for '+r.itemId);
    map.set(r.itemId,r.correct?1:0);
  }
  if(map.size!==itemIds.length) throw new Error(p.participantId+' must include every current assessment item exactly once');
  const row=itemIds.map(id=>map.get(id));
  matrix.push(row);
  const raw=row.reduce((a,b)=>a+b,0);
  scores.push((raw/itemIds.length)*100);
  durations.push(p.durationSeconds);
}

const bins=[];
for(let low=0;low<100;low+=10){
  const upper=low===90?101:low+10;
  bins.push({lowerInclusive:low,upperExclusive:upper,count:scores.filter(x=>x>=low&&x<upper).length});
}
const cutSpecs=Array.isArray(payload.cutScores)?payload.cutScores:[];
const cutScores=cutSpecs.map((x,i)=>{
  if(!x||!Number.isFinite(x.percent)||x.percent<0||x.percent>100) throw new Error('cutScores['+i+'].percent invalid');
  const allowed=new Set(['configured-provisional','panel-recommendation','governance-adopted','sensitivity-only','other']);
  if(!allowed.has(x.source)) throw new Error('cutScores['+i+'].source invalid');
  const passCount=scores.filter(s=>s>=x.percent).length;const failCount=scores.length-passCount;
  return {percent:x.percent,source:x.source,passCount,failCount,passRate:scores.length?passCount/scores.length:null,notes:x.notes??null};
});

let reliabilityStatus='not-computed',reliabilityValue=null,reliabilityReason='Reliability calculation not requested.';
if(payload.computeReliability===true){
  if(matrix.length<minReliabilitySampleSize){
    reliabilityStatus='insufficient-data';
    reliabilityReason='Usable participant count '+matrix.length+' is below analyst-specified minimum '+minReliabilitySampleSize+'.';
  }else{
    const value=kr20(matrix);
    if(value===null||!Number.isFinite(value)){
      reliabilityStatus='insufficient-data';
      reliabilityReason='KR-20 could not be computed because score/item variance was insufficient.';
    }else{
      reliabilityStatus='computed';
      reliabilityValue=Math.max(-1,Math.min(1,value));
      reliabilityReason=null;
    }
  }
}

const now=payload.completedAt??new Date().toISOString();
const safe=v=>String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const record={
  id:'FORMPSY-'+safe(payload.cohortId)+'-'+safe(payload.formId)+'-'+safe(payload.formRevision),
  courseId:course.id,
  courseVersion:String(course.version),
  assessmentId:assessment.id,
  assessmentVersion:assessment.version,
  formId:payload.formId,
  formRevision:payload.formRevision,
  cohortId:payload.cohortId,
  status:complete?'complete':'draft',
  sampleSize:scores.length,
  itemCount:itemIds.length,
  scoreSummary:{
    meanPercent:mean(scores),medianPercent:median(scores),standardDeviationPercent:sd(scores),
    minimumPercent:scores.length?Math.min(...scores):null,maximumPercent:scores.length?Math.max(...scores):null,histogram:bins
  },
  timingSummary:{
    medianSeconds:median(durations),p90Seconds:percentile(durations,0.9),
    minimumSeconds:durations.length?Math.min(...durations):null,maximumSeconds:durations.length?Math.max(...durations):null
  },
  classificationAnalysis:{cutScores},
  reliability:{
    status:reliabilityStatus,
    method:payload.computeReliability===true?'kr-20':'none',
    minimumSampleSize:minReliabilitySampleSize,
    usableParticipantCount:matrix.length,
    value:reliabilityValue,
    reason:reliabilityReason
  },
  analystId:payload.analystId,
  recordedAt:now,
  summary:'Form-level psychometric evidence for '+assessment.id+'@'+assessment.version+', opaque form '+payload.formId+'@'+payload.formRevision+', cohort '+payload.cohortId+'. Participant-level data are excluded from repository evidence.',
  limitations:[
    'This aggregate record does not contain participant identifiers or response-level data.',
    'Reliability is reported only when requested and the analyst-specified minimum sample/data conditions are satisfied.',
    'Classification rates describe this pilot cohort and do not independently establish a production cut score.'
  ]
};
if(write){
  const dir=path.join(root,'content/form-psychometric-evidence');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,record.id+'.json');if(fs.existsSync(file))throw new Error('Refusing to overwrite '+file);
  fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,participantLevelDataCommitted:false,record},null,2));
