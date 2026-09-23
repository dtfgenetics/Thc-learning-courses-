import {spawnSync} from 'node:child_process';

const run=spawnSync(process.execPath,['scripts/report-certification-evidence-reconciliation.mjs','--json'],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.canonicalCourses!==15) throw new Error('expected 15 canonical courses');
if(!out.acceptedSubmissionSummary) throw new Error('acceptedSubmissionSummary missing');
for(const row of out.courses){
  if(!row.submissionReview) throw new Error(row.courseId+': submissionReview missing');
  if(!Array.isArray(row.submissionReview.acceptedCourseSubmissions)||!Array.isArray(row.submissionReview.acceptedProgramSubmissions)) throw new Error(row.courseId+': accepted submission arrays missing');
  for(const gate of Object.values(row.gates)){
    if(gate?.source==='evidence-submission') throw new Error(row.courseId+': submission acceptance must not directly promote gate status');
  }
}
console.log('Accepted evidence submissions are surfaced without directly promoting certification gates.');
