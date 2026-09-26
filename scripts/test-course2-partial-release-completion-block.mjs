import { loadCourseAcademicCompletionBundle } from '../apps/api/src/course-enrollment-completion-service.mjs';

const bundle=loadCourseAcademicCompletionBundle('COURSE-LH-TECH1-002');

if(bundle!==null){
  console.error('Course 2 partial-release completion block failed: academic completion bundle should be unavailable while openAcademicDependencies remain.');
  process.exitCode=1;
}else{
  console.log('Course 2 partial-release completion block: OK');
}
