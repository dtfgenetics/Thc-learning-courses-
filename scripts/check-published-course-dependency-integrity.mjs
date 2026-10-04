import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const readJson=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const listJson=(dir)=>fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.json'));

const failures=[];
const rows=[];

const releaseDir=path.join(root,'content/public-releases');
const publicReleases=fs.existsSync(releaseDir)
  ? fs.readdirSync(releaseDir)
      .filter((f)=>f.endsWith('.json'))
      .map((f)=>readJson(`content/public-releases/${f}`))
  : [];
const releaseByCourseId=new Map(publicReleases.map((release)=>[release.courseId,release]));

for(const file of listJson('content/courses')){
  const course=readJson(`content/courses/${file}`);
  if(course.status!=='published') continue;
  const issues=[];
  const release=releaseByCourseId.get(course.id);
  const partialRelease=course.extensions?.academicPublicationStatus==='partial-public-academic-release';
  const declaredOpen=new Set(course.extensions?.openAcademicDependencies??[]);
  const scopedModules=partialRelease
    ? new Set(release?.publicScope?.modules??[])
    : new Set(course.modules??[]);

  if(partialRelease){
    if(!release) issues.push('partial academic release is missing a public-release manifest');
    if(release && !['partial-published','published'].includes(release.publicationState)) issues.push(`public release state is ${release.publicationState}`);
    const excluded=new Set(release?.publicScope?.excludedModules??[]);
    for(const moduleId of declaredOpen){
      if(!excluded.has(moduleId)) issues.push(`open dependency ${moduleId} is not explicitly excluded from public release`);
    }
    for(const moduleId of excluded){
      if(!declaredOpen.has(moduleId)) issues.push(`public release excludes undeclared dependency ${moduleId}`);
    }
    for(const moduleId of course.modules??[]){
      if(!scopedModules.has(moduleId) && !excluded.has(moduleId)) {
        issues.push(`course module ${moduleId} is neither released nor explicitly excluded`);
      }
    }
    for(const moduleId of scopedModules){
      if(!(course.modules??[]).includes(moduleId)) {
        issues.push(`public release scopes module ${moduleId} that is not declared on the course`);
      }
    }
  }

  for(const moduleId of course.modules??[]){
    if(partialRelease && !scopedModules.has(moduleId)) continue;
    const modulePath=`content/modules/${moduleId}.json`;
    if(!fs.existsSync(path.join(root,modulePath))){
      issues.push(`missing module ${moduleId}`);
      continue;
    }
    const module=readJson(modulePath);
    if(module.status!=='published') issues.push(`module ${moduleId} is ${module.status}`);
    for(const lessonId of module.lessons??[]){
      const lessonPath=`content/lessons/${lessonId}.json`;
      if(!fs.existsSync(path.join(root,lessonPath))){
        issues.push(`missing lesson ${lessonId}`);
        continue;
      }
      const lesson=readJson(lessonPath);
      if(lesson.status!=='published') issues.push(`lesson ${lessonId} is ${lesson.status}`);
    }
  }
  rows.push({courseId:course.id,title:course.title,publicationMode:partialRelease?'partial-public-academic-release':'full-published',issues});
  if(issues.length) failures.push({courseId:course.id,issues});
}

if(process.argv.includes('--json')) console.log(JSON.stringify({rows,failures},null,2));
else {
  console.log('# Published-course dependency integrity');
  for(const row of rows) console.log(`${row.courseId} [${row.publicationMode}]: ${row.issues.length ? row.issues.join('; ') : 'OK'}`);
}

if(process.argv.includes('--check') && failures.length){
  console.error(`\n${failures.length} published course(s) depend on draft/missing curriculum objects.`);
  process.exitCode=1;
}
