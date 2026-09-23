import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const errors=[];
const readDir=(rel)=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>({file:path.join(rel,n),data:JSON.parse(fs.readFileSync(path.join(d,n),'utf8'))}));};
const courses=new Map(readDir('content/courses').map(x=>[x.data.id,x.data]));
const rows=readDir('content/course-pilot-execution-evidence');
const ids=new Set();
for(const {file,data:r} of rows){
  if(ids.has(r.id)) errors.push(`${file}: duplicate id ${r.id}`); else ids.add(r.id);
  const c=courses.get(r.courseId);
  if(!c) errors.push(`${file}: unknown course ${r.courseId}`);
  else if(String(c.version)!==String(r.courseVersion)) errors.push(`${file}: courseVersion ${r.courseVersion} does not match current ${c.version}`);
  if(r.status==='approved'||r.status==='evidence-complete'){
    if(r.dataQualityReviewed!==true) errors.push(`${file}: ${r.status} pilot requires dataQualityReviewed=true`);
    if(r.learnerFeedbackCollected!==true) errors.push(`${file}: ${r.status} pilot requires learnerFeedbackCollected=true`);
    if(r.fairnessAccessibilityEvidence?.reviewed!==true) errors.push(`${file}: ${r.status} pilot requires fairness/accessibility review`);
    if(r.fairnessAccessibilityEvidence?.materialIssuesResolvedOrDispositioned!==true) errors.push(`${file}: ${r.status} pilot requires fairness/accessibility issues resolved or dispositioned`);
    if(r.stopCriteriaTriggered===true && !r.stopCriteriaDisposition) errors.push(`${file}: triggered stop criteria require documented disposition`);
    if(r.knowledgeEvidence?.required===true && (r.knowledgeEvidence?.itemEvidenceComplete!==true || r.knowledgeEvidence?.currentItemVersionsOnly!==true)) errors.push(`${file}: required knowledge evidence must be complete and current-version only`);
    if(r.performanceEvidence?.required===true && (r.performanceEvidence?.executionCompleted!==true || r.performanceEvidence?.currentAssessmentVersionsOnly!==true)) errors.push(`${file}: required performance evidence must be complete and current-version only`);
  }
}
if(errors.length){console.error('Course pilot execution evidence validation failed:');for(const e of errors)console.error('- '+e);process.exit(1);}
console.log(`Course pilot execution evidence validation passed. ${rows.length} record(s) checked.`);
