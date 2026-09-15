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
  assert.ok(Array.isArray(release.publicScope?.modules)&&release.publicScope.modules.length===1,`${courseId}: public release must name exactly the dedicated course module.`);
  const moduleId=release.publicScope.modules[0];
  const module=read(`content/modules/${moduleId}.json`);
  assert.ok(module.id.includes(`TECH1-${n}`),`${courseId}: release module must be course-specific.`);
  assert.deepEqual(release.publicScope.studentSources.map(x=>path.basename(x,'.json')).sort(),[...module.lessons].sort(),`${courseId}: public student sources must exactly match dedicated module lessons.`);
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
    assert.equal(release.publicScope.assessments.length,2);
    assert.ok(release.publicScope.assessments.includes(course.finalAssessment));
  }
}
console.log('Technician I Courses 2-7 public-release audit passed: learner lesson sources and public learning assessments are explicitly released while credential exams, secure forms, and credential decisions remain restricted.');
