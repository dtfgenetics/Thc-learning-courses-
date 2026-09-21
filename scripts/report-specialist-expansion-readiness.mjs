import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const registry=read('content/credential-programs/registry.json');
const reuse=read('registry/specialist-expansion-source-reuse.json');

const courseDir=path.join(root,'content','courses');
const courseIds=new Set(fs.readdirSync(courseDir)
  .filter((f)=>f.endsWith('.json'))
  .map((f)=>read(path.join('content','courses',f)).id));

const futureIds=new Set(registry.futureExpansionScope?.programIds??[]);
const programs=(registry.programs??[]).filter((p)=>futureIds.has(p.id));

const rows=programs.map((program)=>{
  const planned=(program.plannedCourses??[]).map((x)=>x.id);
  const present=planned.filter((id)=>courseIds.has(id));
  const missing=planned.filter((id)=>!courseIds.has(id));
  const reuseRow=(reuse.programs??[]).find((x)=>x.programId===program.id);
  const candidates=reuseRow?.candidateReuseSources??[];
  const existingCandidates=candidates.filter((id)=>courseIds.has(id));
  return {
    programId:program.id,
    title:program.title,
    plannedCourseCount:planned.length,
    presentCanonicalCourseCount:present.length,
    missingCanonicalCourseCount:missing.length,
    presentCanonicalCourses:present,
    missingCanonicalCourses:missing,
    candidateReuseSources:candidates,
    existingReuseSourceCount:existingCandidates.length,
    existingReuseSources:existingCandidates,
    state:missing.length===0?'canonical-course-set-present':'planned-content-authoring'
  };
});

const summary={
  releaseScope:registry.currentReleaseScope,
  futureExpansionScope:registry.futureExpansionScope,
  futureProgramCount:rows.length,
  plannedFutureCourseCount:rows.reduce((n,row)=>n+row.plannedCourseCount,0),
  presentFutureCanonicalCourseCount:rows.reduce((n,row)=>n+row.presentCanonicalCourseCount,0),
  missingFutureCanonicalCourseCount:rows.reduce((n,row)=>n+row.missingCanonicalCourseCount,0),
  existingReuseSourceCount:[...new Set(rows.flatMap((row)=>row.existingReuseSources))].length,
  programs:rows,
  boundary:'Source-reuse candidates reduce duplicate authoring but do not satisfy a future course requirement until target objectives, content, evidence, assessment and review records are reconciled.'
};

if(process.argv.includes('--json')) process.stdout.write(JSON.stringify(summary,null,2)+'\n');
else{
  console.log('THC Academy specialist/lead expansion readiness');
  console.log(`Future programs: ${summary.futureProgramCount}`);
  console.log(`Planned canonical courses: ${summary.plannedFutureCourseCount}`);
  console.log(`Present planned course IDs: ${summary.presentFutureCanonicalCourseCount}`);
  console.log(`Missing planned course IDs: ${summary.missingFutureCanonicalCourseCount}`);
  console.log(`Existing reusable source courses: ${summary.existingReuseSourceCount}`);
  console.log('');
  for(const row of rows) console.log(`- ${row.programId}: ${row.presentCanonicalCourseCount}/${row.plannedCourseCount} canonical planned courses present; ${row.existingReuseSourceCount} reuse sources`);
  console.log('');
  console.log('Use --json for the complete missing-course and reuse-source queue.');
}
