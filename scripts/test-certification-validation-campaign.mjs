import assert from 'node:assert/strict';
import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('registry/certification-validation-campaign.json','utf8'));
const construction=JSON.parse(fs.readFileSync(c.exactConstructionSnapshot,'utf8'));
const constructionVersions=new Map(construction.courses.map(course=>[course.courseId,course.version]));
assert.equal(c.summary.courses,15);
assert.equal(c.summary.conventionalFinalCourses,13);
assert.equal(c.summary.integratedPerformanceCourses,2);
assert.equal(c.summary.waves,7);
assert.equal(c.summary.approvalsClaimed,0);
const allCourses=new Set();
for(const wave of c.waves){
  assert.ok(wave.completionBoundary);
  for(const s of wave.sessions??[]) for(const x of s.courses??[]){
    allCourses.add(x.courseId);
    assert.equal(
      x.version,
      constructionVersions.get(x.courseId),
      `${wave.id}/${s.id}: ${x.courseId} must match the exact construction snapshot version`,
    );
  }
}
assert.equal(allCourses.size,15,'campaign must cover all 15 certification courses');
assert.deepEqual(allCourses,new Set(constructionVersions.keys()),'campaign course set must match the exact construction snapshot');
assert.equal(c.waves.find(x=>x.id==='WAVE-6-STANDARD-SETTING').state,'blocked-until-prerequisites');
assert.equal(c.waves.find(x=>x.id==='WAVE-7-SECURE-FORMS-AND-AUTHORIZATION').state,'blocked-until-prerequisites');
console.log('Certification validation campaign: PASS (15 courses, 7 dependency-safe waves, no approval manufactured).');
