import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();const errors=[];
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>({file:path.join(rel,n),data:JSON.parse(fs.readFileSync(path.join(d,n),'utf8'))}));};
const courses=new Map(readDir('content/courses').map(x=>[x.data.id,x.data]));
const assessments=new Map(readDir('content/assessments').map(x=>[x.data.id,x.data]));
const rows=readDir('content/form-psychometric-evidence');
const ids=new Set();
for(const {file,data:r} of rows){
  if(ids.has(r.id))errors.push(file+': duplicate id '+r.id);else ids.add(r.id);
  const c=courses.get(r.courseId),a=assessments.get(r.assessmentId);
  if(!c)errors.push(file+': unknown course '+r.courseId);else if(String(c.version)!==String(r.courseVersion))errors.push(file+': stale courseVersion');
  if(!a)errors.push(file+': unknown assessment '+r.assessmentId);else{
    if(String(a.version)!==String(r.assessmentVersion))errors.push(file+': stale assessmentVersion');
    if((a.items??[]).length!==r.itemCount)errors.push(file+': itemCount does not match current assessment');
    if(c&&c.finalAssessment!==a.id)errors.push(file+': assessment is not current final for course');
  }
  if(r.reliability?.status==='computed'){
    if(r.reliability.method==='none'||typeof r.reliability.value!=='number')errors.push(file+': computed reliability requires method and numeric value');
    if(r.reliability.usableParticipantCount<r.reliability.minimumSampleSize)errors.push(file+': computed reliability below declared minimum sample size');
  }else if(r.reliability?.value!==null){
    errors.push(file+': non-computed reliability must have value=null');
  }
  const hist=(r.scoreSummary?.histogram??[]).reduce((n,b)=>n+b.count,0);
  if(hist!==r.sampleSize)errors.push(file+': histogram count '+hist+' does not equal sampleSize '+r.sampleSize);
  for(const cut of r.classificationAnalysis?.cutScores??[]){
    if(cut.passCount+cut.failCount!==r.sampleSize)errors.push(file+': classification counts do not equal sample size at cut '+cut.percent);
  }
}
if(errors.length){console.error('Form psychometric evidence validation failed:');errors.forEach(e=>console.error('- '+e));process.exit(1);}
console.log('Form psychometric evidence validation passed. '+rows.length+' record(s) checked.');
