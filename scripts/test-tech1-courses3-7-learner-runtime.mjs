import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

const configs=[
  {n:3,courseId:'COURSE-LH-TECH1-003',modulePath:'content/modules/MOD-LH-TECH1-003-MONITORING.json'},
  {n:4,courseId:'COURSE-LH-TECH1-004',modulePath:'content/modules/MOD-LH-TECH1-004-IRRIGATION.json'},
  {n:5,courseId:'COURSE-LH-TECH1-005',modulePath:'content/modules/MOD-LH-TECH1-005-CROPCARE.json'},
  {n:6,courseId:'COURSE-LH-TECH1-006',modulePath:'content/modules/MOD-LH-TECH1-006-HARVEST.json'},
  {n:7,courseId:'COURSE-LH-TECH1-007',modulePath:'content/modules/MOD-LH-TECH1-007-LAB.json'}
];

const server=createAcademyWebServer({env:{...process.env,NODE_ENV:'development',ACADEMY_PREVIEW_DRAFTS:'1'}});
server.listen(0,'127.0.0.1');
await once(server,'listening');
try {
  const base=`http://127.0.0.1:${server.address().port}`;
  const catalogResponse=await fetch(`${base}/api/catalog`);
  assert.equal(catalogResponse.status,200,'Draft-preview Academy catalog should be available');
  const catalog=await catalogResponse.json();

  for (const cfg of configs) {
    const course=read(`content/courses/${cfg.courseId}.json`);
    const module=read(cfg.modulePath);
    const catalogCourse=(catalog.courses??[]).find((row)=>row.id===cfg.courseId);
    assert.ok(catalogCourse,`Course ${cfg.n} must appear in draft-preview Academy catalog`);
    const catalogModule=(catalogCourse.modules??[]).find((row)=>row.id===module.id);
    assert.ok(catalogModule,`Course ${cfg.n} module must appear in learner catalog graph`);
    assert.deepEqual((catalogModule.lessons??[]).map((row)=>row.id).filter(Boolean),module.lessons,`Course ${cfg.n} lesson order must match canonical module`);

    for (const lessonId of module.lessons) {
      const sourceLesson=read(`content/lessons/${lessonId}.json`);
      const lessonResponse=await fetch(`${base}/api/lessons/${lessonId}`);
      assert.equal(lessonResponse.status,200,`${lessonId} learner route should resolve`);
      const lesson=await lessonResponse.json();
      assert.equal(lesson.id,lessonId);
      assert.equal(Object.hasOwn(lesson,'assessment'),false,`${lessonId} learner projection must not expose assessment linkage`);
      assert.equal(Object.hasOwn(lesson,'questions'),false,`${lessonId} learner projection must not expose raw questions`);
      assert.ok(Array.isArray(lesson.content?.blocks)&&lesson.content.blocks.length>0,`${lessonId} must expose rich learner content`);

      const seed=`course${cfg.n}-runtime-qa`;
      const practiceResponse=await fetch(`${base}/api/lessons/${lessonId}/practice?seed=${seed}`);
      assert.equal(practiceResponse.status,200,`${lessonId} formative practice should resolve`);
      const practice=await practiceResponse.json();
      assert.equal(practice.presentationSeed,seed);
      assert.ok(Array.isArray(practice.items)&&practice.items.length>0,`${lessonId} needs objective-aligned practice`);
      const objectives=new Set(sourceLesson.learningObjectives??[]);
      assert.ok(practice.items.every((item)=>objectives.has(item.objective)),`${lessonId} practice must stay inside lesson objectives`);
      for (const item of practice.items) {
        assert.equal(Object.hasOwn(item,'correct'),false,`${item.id} must not expose pre-answer key`);
        assert.equal(Object.hasOwn(item,'rationale'),false,`${item.id} must not expose pre-answer rationale`);
        assert.equal(Object.hasOwn(item,'references'),false,`${item.id} must not expose internal reference ids`);
      }
      const sample=practice.items[0];
      const gradeResponse=await fetch(`${base}/api/lessons/${lessonId}/practice/grade`,{
        method:'POST',
        headers:{accept:'application/json','content-type':'application/json'},
        body:JSON.stringify({itemId:sample.id,selectedIndex:0,presentationSeed:seed})
      });
      assert.equal(gradeResponse.status,200,`${lessonId} practice must grade server-side after response`);
      const grade=await gradeResponse.json();
      assert.equal(grade.itemId,sample.id);
      assert.equal(typeof grade.isCorrect,'boolean');
      assert.ok(typeof grade.rationale==='string');
    }

    assert.ok(module.assessment,`Course ${cfg.n} module must identify its formative checkpoint`);
    const moduleSeed=`course${cfg.n}-module-runtime-qa`;
    const moduleResponse=await fetch(`${base}/api/modules/${module.id}/assessment?seed=${moduleSeed}`);
    assert.equal(moduleResponse.status,200,`Course ${cfg.n} module checkpoint should resolve`);
    const checkpoint=await moduleResponse.json();
    const sourceAssessment=read(`content/assessments/${module.assessment}.json`);
    assert.equal(checkpoint.presentationSeed,moduleSeed);
    assert.equal(checkpoint.items.length,sourceAssessment.items.length,`Course ${cfg.n} module checkpoint should expose the controlled item count`);
    for (const item of checkpoint.items) {
      assert.equal(Object.hasOwn(item,'correct'),false,`${item.id} checkpoint must not expose pre-answer key`);
      assert.equal(Object.hasOwn(item,'rationale'),false,`${item.id} checkpoint must not expose pre-answer rationale`);
      assert.equal(Object.hasOwn(item,'references'),false,`${item.id} checkpoint must not expose internal reference ids`);
    }
    const moduleSample=checkpoint.items[0];
    const moduleGrade=await fetch(`${base}/api/modules/${module.id}/assessment/grade`,{
      method:'POST',
      headers:{accept:'application/json','content-type':'application/json'},
      body:JSON.stringify({itemId:moduleSample.id,selectedIndex:0,presentationSeed:moduleSeed})
    });
    assert.equal(moduleGrade.status,200,`Course ${cfg.n} checkpoint must grade server-side`);
    const moduleGradeBody=await moduleGrade.json();
    assert.equal(typeof moduleGradeBody.isCorrect,'boolean');

    if (cfg.n===7) assert.equal(course.finalAssessment,null,'Course 7 must remain integrated-performance based without a conventional final exam');
    else assert.ok(course.finalAssessment,`Course ${cfg.n} must retain its controlled academic final assessment`);
  }

  const invalidSeed=await fetch(`${base}/api/modules/MOD-LH-TECH1-003-MONITORING/assessment/grade`,{
    method:'POST',
    headers:{accept:'application/json','content-type':'application/json'},
    body:JSON.stringify({itemId:'invalid',selectedIndex:0,presentationSeed:'bad seed with spaces'})
  });
  assert.equal(invalidSeed.status,400,'Invalid presentation seeds must fail closed');
} finally {
  server.close();
  await once(server,'close');
}

console.log('Courses 3-7 learner runtime regression: PASS (catalog, lesson, practice, server grading and module checkpoints).');
