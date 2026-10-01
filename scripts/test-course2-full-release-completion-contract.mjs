import { loadCourseAcademicCompletionBundle } from '../apps/api/src/course-enrollment-completion-service.mjs';

const bundle=loadCourseAcademicCompletionBundle('COURSE-LH-TECH1-002');
const expectedModules=[
  'MOD-PLANT-BIO-001',
  'MOD-FLOWER-001',
  'MOD-LH-TECH1-001-RECORDS',
  'MOD-LH-TECH1-002-OBSERVATION'
];

const failures=[];
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

if(failures.length){
  console.error('Course 2 full-release completion contract failed:');
  for(const failure of failures) console.error(`- ${failure}`);
  process.exitCode=1;
}else{
  console.log('Course 2 full-release completion contract: OK');
}
