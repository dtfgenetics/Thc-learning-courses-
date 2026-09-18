import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const specs=Array.from({length:8},(_,i)=>{
  const n=String(i+1).padStart(3,'0');
  const release=read(`content/public-releases/PUBLIC-RELEASE-LH-TECH2-${n}.json`);
  const course=read(`content/courses/COURSE-LH-TECH2-${n}.json`);
  const module=read(`content/modules/${release.publicScope.modules[0]}.json`);
  return {n:Number(n),n3:n,release,course,module};
});

const server=createAcademyWebServer({env:{...process.env,NODE_ENV:'development',ACADEMY_PREVIEW_DRAFTS:'1'}});
server.listen(0,'127.0.0.1');
await once(server,'listening');

try {
  const base=`http://127.0.0.1:${server.address().port}`;
  const catalogResponse=await fetch(`${base}/api/catalog`);
  assert.equal(catalogResponse.status,200,'Academy catalog must resolve in draft preview');
  const catalog=await catalogResponse.json();

  for(const spec of specs){
    const courseId=spec.course.id;
    const catalogCourse=(catalog.courses??[]).find(row=>row.id===courseId);
    assert.ok(catalogCourse,`${courseId} must appear in Academy preview catalog`);
    const catalogModule=(catalogCourse.modules??[]).find(row=>row.id===spec.module.id);
    assert.ok(catalogModule,`${courseId} dedicated module must appear in catalog`);
    assert.deepEqual((catalogModule.lessons??[]).map(row=>row.id).filter(Boolean),spec.module.lessons,`${courseId} lesson order must match canonical module`);

    for(const lessonId of spec.module.lessons){
      const source=read(`content/lessons/${lessonId}.json`);
      assert.ok((source.references??[]).length>0,`${lessonId} must retain evidence references`);
      assert.ok((source.content?.overview??'').length>=40,`${lessonId} must retain a substantive overview`);
      assert.ok((source.content?.summary??'').length>=40,`${lessonId} must retain a substantive summary`);
      assert.ok((source.content?.blocks??[]).length>0,`${lessonId} must retain structured learner content`);

      const lessonResponse=await fetch(`${base}/api/lessons/${lessonId}`);
      assert.equal(lessonResponse.status,200,`${lessonId} learner route should resolve`);
      const lesson=await lessonResponse.json();
      assert.equal(lesson.id,lessonId);
      assert.equal(Object.hasOwn(lesson,'assessment'),false,`${lessonId} learner projection must not expose source assessment linkage`);
      assert.equal(Object.hasOwn(lesson,'questions'),false,`${lessonId} learner projection must not expose raw question objects`);
      assert.ok(Array.isArray(lesson.content?.blocks)&&lesson.content.blocks.length>0,`${lessonId} rendered learner projection needs rich blocks`);

      const seed=`tech2-${spec.n3}-runtime-qa`;
      const practiceResponse=await fetch(`${base}/api/lessons/${lessonId}/practice?seed=${seed}`);
      assert.equal(practiceResponse.status,200,`${lessonId} formative practice should resolve`);
      const practice=await practiceResponse.json();
      assert.equal(practice.presentationSeed,seed);
      assert.ok(Array.isArray(practice.items)&&practice.items.length>0,`${lessonId} needs formative practice`);
      const lessonObjectives=new Set(source.learningObjectives??[]);
      assert.ok(practice.items.every(item=>lessonObjectives.has(item.objective)),`${lessonId} practice must remain objective-aligned`);
      for(const item of practice.items){
        assert.equal(Object.hasOwn(item,'correct'),false,`${item.id} must not expose answer key before response`);
        assert.equal(Object.hasOwn(item,'rationale'),false,`${item.id} must not expose rationale before response`);
        assert.equal(Object.hasOwn(item,'references'),false,`${item.id} must not expose internal evidence IDs`);
      }
      const sample=practice.items[0];
      const gradeResponse=await fetch(`${base}/api/lessons/${lessonId}/practice/grade`,{
        method:'POST',headers:{accept:'application/json','content-type':'application/json'},
        body:JSON.stringify({itemId:sample.id,selectedIndex:0,presentationSeed:seed})
      });
      assert.equal(gradeResponse.status,200,`${lessonId} practice must grade server-side`);
      const grade=await gradeResponse.json();
      assert.equal(typeof grade.isCorrect,'boolean');
      assert.ok(typeof grade.rationale==='string'&&grade.rationale.trim().length>0);
    }

    const moduleSeed=`tech2-${spec.n3}-module-qa`;
    const checkpointResponse=await fetch(`${base}/api/modules/${spec.module.id}/assessment?seed=${moduleSeed}`);
    assert.equal(checkpointResponse.status,200,`${courseId} module checkpoint should resolve`);
    const checkpoint=await checkpointResponse.json();
    const sourceAssessment=read(`content/assessments/${spec.module.assessment}.json`);
    assert.equal(checkpoint.items.length,sourceAssessment.items.length,`${courseId} checkpoint count mismatch`);
    assert.equal(checkpoint.presentationSeed,moduleSeed);
    for(const item of checkpoint.items){
      assert.equal(Object.hasOwn(item,'correct'),false,`${item.id} checkpoint must not expose answer key before response`);
      assert.equal(Object.hasOwn(item,'rationale'),false,`${item.id} checkpoint must not expose rationale before response`);
    }
    const sample=checkpoint.items[0];
    const gradeResponse=await fetch(`${base}/api/modules/${spec.module.id}/assessment/grade`,{
      method:'POST',headers:{accept:'application/json','content-type':'application/json'},
      body:JSON.stringify({itemId:sample.id,selectedIndex:0,presentationSeed:moduleSeed})
    });
    assert.equal(gradeResponse.status,200,`${courseId} checkpoint must grade server-side`);
    assert.equal(typeof (await gradeResponse.json()).isCorrect,'boolean');

    if(spec.n===8) assert.equal(spec.course.finalAssessment,null,'Technician II Course 8 must remain integrated-performance/readiness based');
    else {
      assert.ok(spec.course.finalAssessment,`${courseId} must retain its academic final`);
      assert.ok(spec.release.publicScope.assessments.includes(spec.course.finalAssessment),`${courseId} public academic final must match authorized release manifest`);
    }
  }
} finally {
  server.close();
  await once(server,'close');
}

console.log('Technician II Courses 1-8 learner runtime regression: PASS (catalog, lessons, formative practice, server-side grading and module checkpoints).');
