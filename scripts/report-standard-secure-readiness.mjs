import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const readDir=(rel)=>{const dir=path.join(root,rel);if(!fs.existsSync(dir))return[];return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')));};
const registry=JSON.parse(fs.readFileSync(path.join(root,'registry/certification-validation-execution.json'),'utf8'));
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const assessments=new Map(readDir('content/assessments').map(x=>[x.id,x]));
const ss=readDir('content/standard-setting-evidence');
const fe=readDir('content/secure-form-equivalence-evidence');
const rows=[];
for(const row of registry.courses.filter(x=>x.conventionalFinal)){
  const c=courses.get(row.courseId); const a=assessments.get(row.finalAssessmentId);
  const s=ss.filter(x=>x.courseId===row.courseId&&String(x.courseVersion)===String(c?.version)&&x.assessmentId===row.finalAssessmentId&&String(x.assessmentVersion)===String(a?.version)&&x.status!=='invalidated').sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0]??null;
  const f=fe.filter(x=>x.courseId===row.courseId&&String(x.courseVersion)===String(c?.version)&&x.assessmentId===row.finalAssessmentId&&String(x.assessmentVersion)===String(a?.version)&&x.status!=='invalidated').sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0]??null;
  rows.push({
    courseId:row.courseId,courseVersion:c?.version??null,assessmentId:row.finalAssessmentId,assessmentVersion:a?.version??null,
    standardSetting:s?{id:s.id,status:s.status,method:s.method,productionCutScorePercent:s.governanceDecision?.productionCutScorePercent??null}:{status:'missing'},
    secureForms:f?{id:f.id,status:f.status,formCount:f.formCount,quantitativeEvidenceStatus:f.equivalenceReview?.quantitativeEvidenceStatus??null}:{status:'missing'}
  });
}
console.log(JSON.stringify({
  summary:{
    conventionalCourses:rows.length,
    standardSettingApproved:rows.filter(x=>x.standardSetting.status==='approved').length,
    secureFormsApproved:rows.filter(x=>x.secureForms.status==='approved').length
  },courses:rows
},null,2));
