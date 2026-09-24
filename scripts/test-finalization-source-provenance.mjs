import {spawnSync} from 'node:child_process';

const run=spawnSync(process.execPath,['scripts/report-finalization-status.mjs','--json'],{
  cwd:process.cwd(),encoding:'utf8'
});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.courseSummary.canonicalCourses!==15) throw new Error('expected 15 canonical courses');
if(!out.programEvidence?.sourceProvenance) throw new Error('programEvidence.sourceProvenance missing');
if(!out.sourceProvenance) throw new Error('sourceProvenance detail missing');
for(const key of ['structuralProblems','sourceReviewQueue','refreshQueue']){
  if(!Array.isArray(out.sourceProvenance[key])) throw new Error('sourceProvenance.'+key+' must be an array');
}
if(out.programEvidence.sourceProvenance.canonicalLessons!==284) throw new Error('finalization source summary must cover 284 canonical lessons');
console.log('Finalization source provenance integration: PASS (15 courses / 284 lessons).');
