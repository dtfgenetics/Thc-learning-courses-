import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const course=read('content/courses/COURSE-LH-TECH2-003.json');
const program=read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');
const finalA=read('content/assessments/ASSESS-LH-TECH2-003-FINAL.json');
const formA=read('content/assessments/ASSESS-LH-TECH2-003-M01.json');
const practical=read('content/performance-assessments/PRACTICAL-TECH2-C-FERTIGATION-ROOTZONE-TROUBLESHOOTING.json');
assert.equal(course.version,'0.2.0'); assert.equal(course.status,'draft'); assert.equal(course.finalAssessment,finalA.id);
assert.ok(course.modules.includes('MOD-LH-TECH2-003-FERTIGATION'));
assert.equal(course.extensions.mappedPractical,practical.id);
assert.equal(course.extensions.independentRecipeDesignAuthorityConferred,false);
assert.equal(finalA.items.length,24); assert.equal(formA.items.length,12);
assert.equal(new Set(finalA.items.filter((id)=>formA.items.includes(id))).size,0);
for(const id of [...finalA.items,...formA.items]) assert.equal(id.startsWith('ITEM-TECH2-'),false,'public credential item leaked into course grading: '+id);
for(const comp of practical.competencies){assert.ok(course.competencies.includes(comp),'Practical C competency not mapped: '+comp);assert.ok(program.competencies.includes(comp),'Program missing Practical C competency: '+comp);}
for(const comp of ['COMP-ROOTZONE-001','COMP-PRO-QA-001']) assert.ok(course.competencies.includes(comp));
assert.equal(finalA.blueprint.reduce((s,r)=>s+r.items,0),24);
for(const itemId of finalA.items){const item=read('content/questions/'+itemId+'.json'); assert.ok(item.references.length>0);}
console.log('Technician II Course 003 instruction, bank isolation, recipe authority, safety boundary and Practical C alignment passed.');
