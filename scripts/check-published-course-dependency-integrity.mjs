import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const readJson=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const listJson=(dir)=>fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.json'));

const failures=[];
const rows=[];

for(const file of listJson('content/courses')){
  const course=readJson(`content/courses/${file}`);
  if(course.status!=='published') continue;
  const issues=[];
  for(const moduleId of course.modules??[]){
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
  rows.push({courseId:course.id,title:course.title,issues});
  if(issues.length) failures.push({courseId:course.id,issues});
}

if(process.argv.includes('--json')) console.log(JSON.stringify({rows,failures},null,2));
else {
  console.log('# Published-course dependency integrity');
  for(const row of rows) console.log(`${row.courseId}: ${row.issues.length ? row.issues.join('; ') : 'OK'}`);
}

if(process.argv.includes('--check') && failures.length){
  console.error(`\n${failures.length} published course(s) depend on draft/missing curriculum objects.`);
  process.exitCode=1;
}
