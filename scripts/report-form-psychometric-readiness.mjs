import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const courses=readDir('content/courses');
const assessments=new Map(readDir('content/assessments').map(x=>[x.id,x]));
const evidence=readDir('content/form-psychometric-evidence');
const rows=[];

for(const c of courses.filter(x=>Boolean(x.finalAssessment))){
  const a=assessments.get(c.finalAssessment);
  if(!a) continue;
  const recs=evidence
    .filter(e=>e.courseId===c.id&&String(e.courseVersion)===String(c.version)&&e.assessmentId===a.id&&String(e.assessmentVersion)===String(a.version)&&e.status!=='invalidated')
    .sort((x,y)=>Date.parse(y.recordedAt)-Date.parse(x.recordedAt));
  const latest=recs[0]??null;
  rows.push({
    courseId:c.id,courseVersion:c.version,assessmentId:a.id,assessmentVersion:a.version,itemCount:(a.items??[]).length,
    evidence:latest?{
      id:latest.id,status:latest.status,formId:latest.formId,formRevision:latest.formRevision,cohortId:latest.cohortId,sampleSize:latest.sampleSize,
      reliabilityStatus:latest.reliability?.status??null,reliabilityMethod:latest.reliability?.method??null,reliabilityValue:latest.reliability?.value??null,
      classificationCuts:(latest.classificationAnalysis?.cutScores??[]).map(x=>({percent:x.percent,source:x.source,passRate:x.passRate}))
    }:{status:'missing'}
  });
}
console.log(JSON.stringify({
  summary:{
    conventionalFinals:rows.length,
    withAnyFormEvidence:rows.filter(x=>x.evidence.status!=='missing').length,
    withCompleteFormEvidence:rows.filter(x=>x.evidence.status==='complete').length,
    withComputedReliability:rows.filter(x=>x.evidence.reliabilityStatus==='computed').length,
    withInsufficientReliabilityData:rows.filter(x=>x.evidence.reliabilityStatus==='insufficient-data').length
  },
  forms:rows
},null,2));
