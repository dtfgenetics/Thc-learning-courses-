import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=(rel)=>{
  const dir=path.join(root,rel);
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>read(path.join(rel,n)));
};

const registry=read('registry/certification-validation-execution.json');
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const performance=new Map(readDir('content/performance-assessments').map(x=>[x.id,x]));

function reverseMappings(assessment){
  const ext=assessment?.extensions??{};
  return [...new Set([
    ...(Array.isArray(ext.courseMappings)?ext.courseMappings:[]),
    ...(ext.course?[ext.course]:[]),
    ...(ext.integratedCourseId?[ext.integratedCourseId]:[]),
    ...(assessment?.integratedCourseId?[assessment.integratedCourseId]:[])
  ].filter(Boolean))];
}
function idsFor(course){
  const ext=course?.extensions??{};
  const ids=[
    ...(ext.mappedPractical?[ext.mappedPractical]:[]),
    ...(Array.isArray(ext.credentialPracticalSetRequired)?ext.credentialPracticalSetRequired:[]),
    ...(Array.isArray(ext.mappedPerformanceAssessments)?ext.mappedPerformanceAssessments:[]),
    ...(ext.capstoneRequired?[ext.capstoneRequired]:[])
  ];
  for(const [id,a] of performance) if(reverseMappings(a).includes(course?.id)) ids.push(id);
  return [...new Set(ids)];
}

assert.equal(registry.courses.length,15,'expected 15 canonical certification courses');
const mapped=new Map();
for(const row of registry.courses){
  const course=courses.get(row.courseId);
  assert.ok(course,`${row.courseId}: canonical course missing`);
  const ids=idsFor(course);
  assert.ok(ids.length>0,`${row.courseId}: every canonical certification course must map at least one practical/capstone`);
  assert.equal(row.evidence?.practicalAssessorCalibration,'prepared',`${row.courseId}: calibration gate must be prepared rather than not-applicable`);
  for(const id of ids) assert.ok(performance.has(id),`${row.courseId}: missing mapped performance assessment ${id}`);
  mapped.set(row.courseId,ids);
}

assert.deepEqual(mapped.get('COURSE-LH-TECH1-001'),['PRACTICAL-LH-TECH1-001-WORKFLOW']);
assert.deepEqual(mapped.get('COURSE-LH-TECH1-002'),['PRACTICAL-TECH1-A']);
assert.deepEqual(mapped.get('COURSE-LH-TECH1-003'),['PRACTICAL-TECH1-A']);
assert.deepEqual(mapped.get('COURSE-LH-TECH1-004'),['PRACTICAL-TECH1-B']);
assert.deepEqual(new Set(mapped.get('COURSE-LH-TECH1-005')),new Set(['PRACTICAL-TECH1-C','PRACTICAL-TECH1-D','PRACTICAL-TECH1-E']));
assert.deepEqual(mapped.get('COURSE-LH-TECH1-006'),['PRACTICAL-TECH1-F']);
assert.equal(mapped.get('COURSE-LH-TECH1-007').length,7,'Tech I integrated course must map six practicals plus capstone');

for(let n=1;n<=7;n++){
  const id=`COURSE-LH-TECH2-${String(n).padStart(3,'0')}`;
  assert.equal(mapped.get(id).length,1,`${id}: expected one course-mapped Technician II practical`);
}
assert.equal(mapped.get('COURSE-LH-TECH2-008').length,8,'Tech II integrated course must map seven practicals plus capstone');

console.log('Certification performance/calibration mapping: PASS (15/15 courses have mapped performance evidence and applicable calibration gates).');
