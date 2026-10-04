import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const readDir=(rel)=>{
  const dir=path.join(root,rel);
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')));
};
const assessments=readDir('content/performance-assessments').filter(a=>['practical','capstone'].includes(a.assessmentType));
const evidence=readDir('content/calibration-evidence');
const rows=assessments.map(a=>{
  const current=evidence.filter(e=>e.assessmentId===a.id&&String(e.assessmentVersion)===String(a.version)&&e.status!=='invalidated');
  const complete=current.find(e=>e.status==='complete')??null;
  return {
    assessmentId:a.id,
    assessmentVersion:a.version,
    assessmentType:a.assessmentType,
    status:a.status,
    calibrationEvidenceRecords:current.length,
    completeCalibrationEvidence:Boolean(complete),
    sampleCount:complete?.sampleCount??0,
    assessorCount:complete?.assessorCount??0,
    pairCount:complete?.pairCount??0,
    criticalErrorAgreement:complete?.criticalErrorAgreement??null,
    unresolvedCriticalErrorDisagreements:complete?.unresolvedCriticalErrorDisagreements??null
  };
});
const output={
  summary:{
    performanceAssessments:rows.length,
    assessmentsWithCalibrationEvidence:rows.filter(r=>r.calibrationEvidenceRecords>0).length,
    assessmentsWithCompleteCalibrationEvidence:rows.filter(r=>r.completeCalibrationEvidence).length,
    assessmentsWithUnresolvedCriticalErrorDisagreement:rows.filter(r=>(r.unresolvedCriticalErrorDisagreements??0)>0).length
  },
  assessments:rows
};
console.log(JSON.stringify(output,null,2));
