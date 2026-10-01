import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=(p)=>fs.existsSync(path.join(root,p));
const expected={
  '002':32,'003':32,'004':36,'005':36,'006':36,'007':12
};
for(const [n,count] of Object.entries(expected)){
  const courseId=`COURSE-LH-TECH1-${n}`;
  const releaseId=`PUBLIC-RELEASE-LH-TECH1-${n}`;
  const release=read(`content/public-releases/${releaseId}.json`);
  const course=read(`content/courses/${courseId}.json`);
  assert.equal(release.id,releaseId);
  assert.equal(release.courseId,courseId);
  assert.equal(release.publicationState,'published');
  assert.equal(release.publicationBoundary?.credentialExam,'restricted');
  assert.equal(release.publicationBoundary?.credentialDecision,'restricted-governance');
  const expectedModules=[...(course.extensions?.academicCompletionModules??course.modules??[])].sort();
  assert.ok(expectedModules.length>0,`${courseId}: course must define at least one academic completion module.`);
  assert.deepEqual([...(release.publicScope?.modules??[])].sort(),expectedModules,`${courseId}: public release modules must match the course academic completion modules.`);
  const modules=expectedModules.map(moduleId=>read(`content/modules/${moduleId}.json`));
  assert.ok(modules.some(module=>module.id.includes(`TECH1-${n}`)),`${courseId}: public release must include its dedicated course module.`);
  const releasedLessons=[...new Set(modules.flatMap(module=>module.lessons??[]))].sort();
  assert.deepEqual(release.publicScope.studentSources.map(x=>path.basename(x,'.json')).sort(),releasedLessons,`${courseId}: public student sources must exactly match all released academic module lessons.`);
  for(const source of release.publicScope.studentSources) assert.ok(exists(source),`${courseId}: missing public source ${source}`);
  const assessments=release.publicScope.assessments.map(id=>read(`content/assessments/${id}.json`));
  const itemIds=assessments.flatMap(a=>a.items||[]);
  assert.equal(new Set(itemIds).size,itemIds.length,`${courseId}: public assessments must not duplicate item identities across forms.`);
  assert.equal(itemIds.length,count,`${courseId}: expected ${count} public learning items, found ${itemIds.length}.`);
  assert.equal(release.publicScope.publicCourseItems,count,`${courseId}: manifest item count mismatch.`);
  for(const id of itemIds){
    const q=read(`content/questions/${id}.json`);
    assert.ok(['formative','summative'].includes(q.purpose),`${courseId}: credential-purpose item ${id} must not be public.`);
  }
  if(n==='007'){
    assert.equal(course.finalAssessment,null);
    assert.equal(release.publicScope.assessments.length,1);
    assert.equal(release.publicationBoundary?.secureCredentialForms,'restricted');
  }else{
    assert.ok(release.publicScope.assessments.includes(course.finalAssessment),`${courseId}: public release must include the dedicated course final assessment.`);
  }
}
console.log('Technician I Courses 2-7 public-release audit passed: learner lesson sources and public learning assessments are explicitly released while credential exams, secure forms, and credential decisions remain restricted.');
