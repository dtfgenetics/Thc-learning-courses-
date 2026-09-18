import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const plan=read('visuals/TECH2-VISUAL-PRODUCTION-PLAN.json');

assert.equal(plan.program,'CREDPROG-CULT-TECH-II-001');
assert.equal(plan.policy?.expandable,true);
assert.equal(plan.policy?.maximumAssetCount,null);
assert.equal(plan.policy?.primaryConceptCount,36);
assert.equal((plan.courses??[]).length,8);

let total=0;
const ids=new Set();
for(const [courseIndex,entry] of plan.courses.entries()){
  const n3=String(courseIndex+1).padStart(3,'0');
  assert.equal(entry.courseId,`COURSE-LH-TECH2-${n3}`);
  const course=read(`content/courses/${entry.courseId}.json`);
  assert.equal(entry.concepts.length,(course.learningOutcomes??[]).length,`${entry.courseId}: one primary visual concept required per current learning outcome`);
  for(const concept of entry.concepts){
    total++;
    assert.ok(!ids.has(concept.conceptId),`duplicate visual concept id ${concept.conceptId}`);
    ids.add(concept.conceptId);
    assert.equal(concept.outcome,course.learningOutcomes[concept.outcomeIndex-1],`${concept.conceptId}: outcome drift`);
    assert.ok(plan.policy.statusValues.includes(concept.status),`${concept.conceptId}: unsupported status`);
    assert.match(concept.targetPublicPath??'',/^\/assets\/tech2\/course[1-8]\/outcome-[0-9]{2}\.svg$/);
    assert.match(concept.sourcePath??'',/^apps\/web\/public\/assets\/tech2\/course[1-8]\/outcome-[0-9]{2}\.svg$/);
    const releaseStates=new Set(['approved','produced']);
    if(releaseStates.has(concept.status)){
      assert.equal(concept.qaApproved,true,`${concept.conceptId}: approved/produced requires QA approval`);
      assert.ok(typeof concept.learnerTextAlternative==='string'&&concept.learnerTextAlternative.trim().length>=40,`${concept.conceptId}: meaningful text alternative required`);
      assert.ok(typeof concept.caption==='string'&&concept.caption.trim().length>=20,`${concept.conceptId}: caption required`);
      assert.ok(Array.isArray(concept.lessonIds)&&concept.lessonIds.length>0,`${concept.conceptId}: lesson placement required`);
      assert.ok(Array.isArray(concept.references)&&concept.references.length>0,`${concept.conceptId}: evidence references required`);
      assert.ok(fs.existsSync(path.join(root,concept.sourcePath)),`${concept.conceptId}: produced source file missing`);
    } else if(concept.status==='review-candidate'){
      assert.equal(concept.qaApproved,false,`${concept.conceptId}: review candidate must remain unapproved until release QA is complete`);
      assert.ok(typeof concept.learnerTextAlternative==='string'&&concept.learnerTextAlternative.trim().length>=40,`${concept.conceptId}: review candidate requires meaningful text alternative`);
      assert.ok(typeof concept.caption==='string'&&concept.caption.trim().length>=20,`${concept.conceptId}: review candidate requires caption`);
      assert.ok(Array.isArray(concept.lessonIds)&&concept.lessonIds.length>0,`${concept.conceptId}: review candidate requires lesson placement`);
      assert.ok(Array.isArray(concept.references)&&concept.references.length>0,`${concept.conceptId}: review candidate requires evidence references`);
      assert.ok(fs.existsSync(path.join(root,concept.sourcePath)),`${concept.conceptId}: review candidate source file missing`);
    } else {
      assert.notEqual(concept.status,'produced',`${concept.conceptId}: cannot claim production without full gate`);
    }
  }
}
assert.equal(total,36);
console.log('Technician II visual production plan: PASS (36 outcome-aligned concepts, fail-closed release lifecycle).');
