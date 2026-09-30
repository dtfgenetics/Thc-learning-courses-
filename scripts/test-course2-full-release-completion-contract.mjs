import fs from 'node:fs';
import path from 'node:path';
import { loadCourseAcademicCompletionBundle } from '../apps/api/src/course-enrollment-completion-service.mjs';

const root=process.cwd();
const courseId='COURSE-LH-TECH1-002';
const expectedModules=[
  'MOD-PLANT-BIO-001',
  'MOD-FLOWER-001',
  'MOD-LH-TECH1-001-RECORDS',
  'MOD-LH-TECH1-002-OBSERVATION'
];

function read(kind,id){
  const file=path.join(root,'content',kind,`${id}.json`);
  return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
}

const course=read('courses',courseId);
const unresolved=[];
for(const moduleId of expectedModules){
  const module=read('modules',moduleId);
  if(!module || module.status!=='published'){
    unresolved.push(moduleId);
    continue;
  }
  for(const lessonId of module.lessons??[]){
    const lesson=read('lessons',lessonId);
    if(!lesson || lesson.status!=='published') unresolved.push(lessonId);
  }
}
const finalAssessment=course?.finalAssessment?read('assessments',course.finalAssessment):null;
if(!finalAssessment || finalAssessment.status!=='published') unresolved.push(course?.finalAssessment??'course-final');

const bundle=loadCourseAcademicCompletionBundle(courseId);
const failures=[];

if(unresolved.length>0){
  if(bundle) failures.push('academic completion bundle must fail closed while full-release dependencies are unresolved');
}else{
  if(!bundle) failures.push('academic completion bundle is unavailable after full Course 2 academic release');
  if(bundle){
    const moduleIds=bundle.modules.map((module)=>module.id);
    for(const moduleId of expectedModules){
      if(!moduleIds.includes(moduleId)) failures.push(`completion bundle missing module ${moduleId}`);
    }
    if(moduleIds.length!==expectedModules.length) failures.push(`expected ${expectedModules.length} completion modules, found ${moduleIds.length}`);
    if(bundle.lessons.length!==13) failures.push(`expected 13 required lessons, found ${bundle.lessons.length}`);
    if(bundle.course.extensions?.openAcademicDependencies?.length) failures.push('openAcademicDependencies must be empty after full academic release');
    if(bundle.course.extensions?.academicPublicationStatus!=='owner-approved-public-academic-release') failures.push(`unexpected academicPublicationStatus: ${bundle.course.extensions?.academicPublicationStatus}`);
  }
}

if(failures.length){
  console.error('Course 2 full-release completion contract failed:');
  for(const failure of failures) console.error(`- ${failure}`);
  process.exitCode=1;
}else if(unresolved.length>0){
  console.log(`Course 2 full-release completion contract: correctly fail-closed with ${unresolved.length} unresolved publication dependency/dependencies.`);
}else{
  console.log('Course 2 full-release completion contract: OK');
}
