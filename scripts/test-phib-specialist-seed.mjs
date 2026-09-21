import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

for(const n of [1,2]){
  const n3=String(n).padStart(3,'0');
  const courseId=`COURSE-LH-PHIB-${n3}`;
  const course=read(`content/courses/${courseId}.json`);
  const finalId=`ASSESS-LH-PHIB-${n3}-FINAL`;
  const final=read(`content/assessments/${finalId}.json`);

  assert.equal(course.status,'draft',`${courseId}: specialist seed must remain draft`);
  assert.equal(course.credentialBearing,false,`${courseId}: must stay non-credential until program activation gates close`);
  assert.equal(course.finalAssessment,finalId,`${courseId}: dedicated final mapping drift`);
  assert.equal(course.extensions?.credentialBearingActivationBlocked,true,`${courseId}: credential activation must remain fail-closed`);
  assert.equal(course.extensions?.assessmentValidationRequired,true,`${courseId}: assessment validation must remain required`);

  assert.equal(final.status,'draft',`${finalId}: assessment must remain draft`);
  assert.equal(final.purpose,'summative',`${finalId}: specialist course final must be summative, not an operational credential bank`);
  assert.equal(final.extensions?.credentialUseAuthorized,false,`${finalId}: credential use must remain unauthorized`);
  assert.equal(final.items.length,10,`${finalId}: current seed bank must contain ten controlled draft items`);
  assert.equal(final.totalItems,final.items.length,`${finalId}: totalItems drift`);

  const expectedObjectivePrefix=`LO-LH-PHIB-${n3}-`;
  const objectiveIds=new Set(final.objectives);
  assert.equal(objectiveIds.size,10,`${finalId}: ten course-owned objectives required for the current seed`);

  for(const itemId of final.items){
    const item=read(`content/questions/${itemId}.json`);
    assert.equal(item.status,'draft',`${itemId}: item must remain draft before review/pilot`);
    assert.equal(item.purpose,'summative',`${itemId}: item purpose drift`);
    assert.match(item.objective,new RegExp(`^${expectedObjectivePrefix}`),`${itemId}: source-course objective leaked into specialist bank`);
    assert.ok(objectiveIds.has(item.objective),`${itemId}: objective missing from specialist final`);
    const objective=read(`content/learning-objectives/${item.objective}.json`);
    assert.equal(objective.competency,item.competency,`${itemId}: item/objective competency mismatch`);
    assert.ok((item.references??[]).length>0,`${itemId}: controlled reference required`);
    assert.ok(item.extensions?.sourceObjective,`${itemId}: source-objective lineage must remain explicit`);
  }
}

console.log('Plant Health specialist seed contract: PASS (2 canonical draft courses, course-owned objectives, dedicated draft finals, fail-closed credential activation).');
