import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=(p)=>fs.existsSync(path.join(root,p));

const course=read('content/courses/COURSE-LH-TECH1-006.json');
assert.equal(course.status,'published');
assert.equal(course.extensions?.academicPublicationStatus,'owner-approved-public-academic-release');
assert.equal(course.extensions?.professionalCredentialUseAuthorized,false);
assert.equal(course.finalAssessment,'ASSESS-LH-TECH1-006-FINAL');
assert.ok(course.modules.includes('MOD-LH-TECH1-006-HARVEST'));
assert.equal(course.extensions?.dedicatedCourseAssessmentRequired,false);
assert.equal(course.extensions?.dedicatedPerformanceValidationRequired,true);
assert.equal(course.extensions?.mappedPractical,'PRACTICAL-TECH1-F');
assert.equal(course.extensions?.independentProductReleaseAuthorityConferred,false);
assert.equal(course.extensions?.dedicatedItemCount,36);
assert.equal(course.extensions?.learnerAssetLayerBuilt,true);
assert.equal(course.extensions?.totalLearnerAssetCount,8);
assert.equal(course.extensions?.driveAssetMirrorStatus,'verified-8-of-8');

const module=read('content/modules/MOD-LH-TECH1-006-HARVEST.json');
assert.equal(module.lessons.length,4);
for(const id of module.lessons){
  assert.ok(exists(`content/lessons/${id}.json`));
  const l=read(`content/lessons/${id}.json`);
  assert.ok(l.estimatedMinutes>=45);
  assert.ok(l.content?.overview?.length>=40);
  assert.ok(l.content?.summary?.length>=40);
  assert.ok((l.content?.blocks??[]).length>0);
  assert.ok((l.references??[]).length>0);
  for(const o of l.learningObjectives) assert.ok(exists(`content/learning-objectives/${o}.json`));
}

const formative=read('content/assessments/ASSESS-LH-TECH1-006-M01.json');
const final=read('content/assessments/ASSESS-LH-TECH1-006-FINAL.json');
assert.equal(formative.purpose,'formative');
assert.equal(formative.items.length,12);
assert.equal(final.status,'published');
assert.equal(final.purpose,'summative');
assert.equal(final.items.length,24);
assert.equal(new Set([...formative.items,...final.items]).size,36);
assert.equal(final.extensions?.linkedCredentialPractical,'PRACTICAL-TECH1-F');

const expectedObjectives=['LO-LH-TECH1-006-01','LO-LH-TECH1-006-02','LO-LH-TECH1-006-03','LO-LH-TECH1-006-04','LO-LH-TECH1-006-05','LO-LH-TECH1-006-06'];
assert.deepEqual(new Set(final.objectives),new Set(expectedObjectives));
assert.deepEqual(new Set(formative.objectives),new Set(expectedObjectives));
assert.equal(final.extensions?.courseDerivedAssessment,true,'Course 6 final must remain explicitly course-derived');
assert.equal(final.extensions?.encyclopediaSubstitutionAllowed,false,'Encyclopedia material cannot substitute for Course 6 instruction');
assert.equal(final.extensions?.untaughtMaterialAllowed,false,'Course 6 final cannot assess untaught material');
assert.equal(final.extensions?.independentProductReleaseAuthorityStillExcluded,true,'Course 6 assessment must not imply product-release authority');
const taughtMaterialMap=final.extensions?.taughtMaterialMap??{};
for(const objectiveId of expectedObjectives){
  assert.ok(Array.isArray(taughtMaterialMap[objectiveId])&&taughtMaterialMap[objectiveId].length>0,`${objectiveId}: final must map to dedicated taught material`);
  for(const lessonId of taughtMaterialMap[objectiveId]){
    assert.match(lessonId,/^LESSON-LH-TECH1-006-/,`${objectiveId}: test-to-teaching map must stay inside Course 6`);
    assert.ok(module.lessons.includes(lessonId),`${objectiveId}: mapped lesson must belong to the dedicated Course 6 module`);
    const lesson=read(`content/lessons/${lessonId}.json`);
    assert.ok((lesson.learningObjectives??[]).includes(objectiveId),`${objectiveId}: mapped lesson ${lessonId} must actually teach the objective`);
  }
}
assert.ok(exists('docs/learning-hub/tech1/course-006/TEST-TO-TEACHING-MAP.md'),'Course 6 must retain a human-readable test-to-teaching audit');

const summativeCounts=new Map(expectedObjectives.map(x=>[x,0]));
const formativeCounts=new Map(expectedObjectives.map(x=>[x,0]));
const keys=[0,0,0,0];let high=0;
for(const id of final.items){
  const q=read(`content/questions/${id}.json`);
  assert.equal(q.purpose,'summative');
  assert.ok(q.references.length);
  assert.ok(final.competencies.includes(q.competency));
  assert.ok(final.objectives.includes(q.objective));
  summativeCounts.set(q.objective,summativeCounts.get(q.objective)+1);
  keys[q.correct]++;
  if(['apply','analyze','evaluate','create'].includes(q.bloomLevel)) high++;
}
for(const [id,n] of summativeCounts) assert.equal(n,4,`${id} should have four summative items; found ${n}`);
assert.ok(high>=22);
assert.ok(Math.max(...keys)<=6,`unbalanced key positions: ${keys}`);
for(const id of formative.items){
  const q=read(`content/questions/${id}.json`);
  assert.equal(q.purpose,'formative');
  assert.ok(q.references.length,`${id} must retain references`);
  assert.ok(formative.objectives.includes(q.objective));
  formativeCounts.set(q.objective,formativeCounts.get(q.objective)+1);
}
for(const [id,n] of formativeCounts) assert.ok(n>=1,`${id} needs item-level formative coverage; found ${n}`);

const packageFiles=[
  'docs/learning-hub/tech1/course-006/OBJECTIVE-COVERAGE.md',
  'docs/learning-hub/tech1/course-006/LEARNER-MATERIALS.md',
  'docs/learning-hub/tech1/course-006/EVIDENCE-DOSSIER.md',
  'docs/learning-hub/tech1/course-006/instructor/INSTRUCTOR-GUIDE.md',
  'docs/learning-hub/tech1/course-006/instructor/OBJECTIVE-REMEDIATION-MATRIX.md',
  'docs/learning-hub/tech1/course-006/assessor/PRACTICAL-F-ASSESSOR-GUIDE.md',
  'docs/learning-hub/tech1/course-006/assessor/PRACTICAL-F-CALIBRATION-VALIDATION-PACKET.md',
  'docs/learning-hub/tech1/course-006/accessibility/COURSE6-RENDERED-ACCESSIBILITY-UX-REVIEW.md',
  'docs/learning-hub/tech1/course-006/FINAL-HUMAN-REVIEW-WORKLIST.md',
  'docs/learning-hub/tech1/course-006/COURSE-PACKAGE-MANIFEST.md'
];
for(const file of packageFiles) assert.ok(exists(file),`missing Course 006 package artifact ${file}`);

await import('./test-course6-practical-crosswalk.mjs');
await import('./test-course6-visual-registry.mjs');

const visualRegistry=read('visuals/COURSE6-ASSET-REGISTRY.json');
const produced=(visualRegistry.assets??[]).filter(x=>x.status==='produced');
assert.equal(produced.length,8);
const server=createAcademyWebServer({env:{...process.env,NODE_ENV:'development',ACADEMY_PREVIEW_DRAFTS:'1'}});
server.listen(0,'127.0.0.1');
await once(server,'listening');
try{
  const base=`http://127.0.0.1:${server.address().port}`;
  for(const asset of produced){
    const response=await fetch(`${base}${asset.learnerPath}`);
    assert.equal(response.status,200,`${asset.learnerPath} should be served by Academy runtime`);
    assert.match(response.headers.get('content-type')??'',/^image\/webp/);
  }
  assert.equal((await fetch(`${base}/assets/course6x/harvest-readiness-stop-work.webp`)).status,404);
  assert.equal((await fetch(`${base}/assets/course6/not-a-real-asset.webp`)).status,404);
} finally {
  server.close();
  await once(server,'close');
}

console.log('Course 006 production slice passed: four lessons, six objectives, 36 referenced scored items, complete package artifacts, Practical F mapping and eight lesson-reachable runtime assets and 8/8 controlled Drive mirrors are verified while human/professional-release gates remain open.');
