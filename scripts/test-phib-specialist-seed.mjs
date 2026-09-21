import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const configs=[{n:1,items:10,objectives:10},{n:2,items:10,objectives:10},{n:3,items:15,objectives:5}];

for(const config of configs){
  const n3=String(config.n).padStart(3,'0');
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
  assert.equal(final.items.length,config.items,`${finalId}: controlled seed-bank size drift`);
  assert.equal(final.totalItems,final.items.length,`${finalId}: totalItems drift`);

  const expectedObjectivePrefix=`LO-LH-PHIB-${n3}-`;
  const objectiveIds=new Set(final.objectives);
  assert.equal(objectiveIds.size,config.objectives,`${finalId}: course-owned objective count drift`);

  for(const itemId of final.items){
    const item=read(`content/questions/${itemId}.json`);
    assert.equal(item.status,'draft',`${itemId}: item must remain draft before review/pilot`);
    assert.equal(item.purpose,'summative',`${itemId}: item purpose drift`);
    assert.match(item.objective,new RegExp(`^${expectedObjectivePrefix}`),`${itemId}: source-course objective leaked into specialist bank`);
    assert.ok(objectiveIds.has(item.objective),`${itemId}: objective missing from specialist final`);
    const objective=read(`content/learning-objectives/${item.objective}.json`);
    assert.equal(objective.competency,item.competency,`${itemId}: item/objective competency mismatch`);
    assert.ok((item.references??[]).length>0,`${itemId}: controlled reference required`);
  }
}
console.log('Plant Health specialist seed contract: PASS (3 canonical draft courses with course-owned objectives, dedicated draft finals, and fail-closed credential activation).');
