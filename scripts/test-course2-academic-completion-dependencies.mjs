import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const course=JSON.parse(fs.readFileSync(path.join(root,'content/courses/COURSE-LH-TECH1-002.json'),'utf8'));
const expected=[
  'MOD-PLANT-BIO-001',
  'MOD-FLOWER-001',
  'MOD-LH-TECH1-001-RECORDS',
  'MOD-LH-TECH1-002-OBSERVATION'
];

const actual=course.extensions?.academicCompletionModules??[];
const missing=expected.filter((id)=>!actual.includes(id));
const extra=actual.filter((id)=>!expected.includes(id));
const open=course.extensions?.openAcademicDependencies??[];
const flowering=JSON.parse(fs.readFileSync(path.join(root,'content/modules/MOD-FLOWER-001.json'),'utf8'));

const failures=[];
if(missing.length) failures.push(`missing academic completion modules: ${missing.join(', ')}`);
if(extra.length) failures.push(`unexpected academic completion modules: ${extra.join(', ')}`);
if(course.extensions?.academicCompletionBlockedWhileOpenDependencies!==true) failures.push('academicCompletionBlockedWhileOpenDependencies must be true');
if(flowering.status!=='published' && !open.includes('MOD-FLOWER-001')) failures.push('draft Flowering foundation must be declared as an open academic dependency');
if(flowering.status!=='published' && course.extensions?.academicPublicationStatus!=='partial-public-academic-release') failures.push('Course 2 must remain partial public academic release while Flowering is draft');

if(failures.length){
  console.error('Course 2 academic completion dependency contract failed:');
  for(const failure of failures) console.error(`- ${failure}`);
  process.exitCode=1;
}else{
  console.log('Course 2 academic completion dependency contract: OK');
}
