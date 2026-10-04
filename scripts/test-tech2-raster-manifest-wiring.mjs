import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=(p)=>fs.existsSync(path.join(root,p));

const manifestPath='visuals/TECH2-RASTER-CANDIDATE-MANIFEST.json';
const manifest=read(manifestPath);
assert.equal(manifest.releaseApproved,true,'Technician II raster manifest must remain owner-approved');
assert.equal(manifest.count,36,'Technician II raster manifest must retain 36 governed primary visuals');

const byConcept=new Map(manifest.candidates.map(c=>[c.conceptId,c]));
assert.equal(byConcept.size,36,'Technician II raster concept IDs must be unique');

const expectedByCourse=new Map([
  ['COURSE-LH-TECH2-001',4],['COURSE-LH-TECH2-002',4],['COURSE-LH-TECH2-003',4],['COURSE-LH-TECH2-004',4],
  ['COURSE-LH-TECH2-005',4],['COURSE-LH-TECH2-006',4],['COURSE-LH-TECH2-007',4],['COURSE-LH-TECH2-008',8]
]);

let seen=0;
for(let courseNum=1;courseNum<=8;courseNum++){
  const cc=String(courseNum).padStart(3,'0');
  const courseId='COURSE-LH-TECH2-'+cc;
  let courseSeen=0;
  for(let lessonNum=1;lessonNum<=4;lessonNum++){
    const ll=String(lessonNum).padStart(2,'0');
    const lessonPath=`content/lessons/LESSON-LH-TECH2-${cc}-${ll}.json`;
    const lesson=read(lessonPath);
    const visuals=lesson.content?.extensions?.primaryVisuals??[];
    for(const visual of visuals){
      seen++;
      courseSeen++;
      assert.match(visual.src,/\.webp$/,`${visual.assetId}: learner-facing primary visual must use WebP`);
      assert.equal(visual.extensions?.releaseApproved,true,`${visual.assetId}: lesson metadata must mark released raster approved`);
      assert.equal(visual.extensions?.releaseState,'owner-approved-production-release',`${visual.assetId}: lesson release state must match canonical raster manifest`);
      assert.equal(visual.extensions?.rasterManifest,manifestPath,`${visual.assetId}: lesson must point to canonical raster manifest`);
      const candidate=byConcept.get(visual.assetId);
      assert.ok(candidate,`${visual.assetId}: missing from raster manifest`);
      assert.equal(candidate.courseId,courseId,`${visual.assetId}: manifest course mismatch`);
      assert.equal(candidate.releaseApproved,true,`${visual.assetId}: manifest candidate must remain release-approved`);
      assert.equal(candidate.status,'owner-approved-production-release',`${visual.assetId}: manifest status mismatch`);
      const expectedPublicPath=candidate.candidateSourcePath.replace(/^apps\/web\/public/,'');
      assert.equal(visual.src,expectedPublicPath,`${visual.assetId}: lesson path must match manifest candidate path`);
      assert.ok(exists(candidate.candidateSourcePath),`${visual.assetId}: approved raster file missing at ${candidate.candidateSourcePath}`);
    }
  }
  assert.equal(courseSeen,expectedByCourse.get(courseId),`${courseId}: governed primary visual count mismatch`);
}
assert.equal(seen,36,'All 36 governed Technician II primary visuals must be wired into lesson metadata');

console.log('Technician II raster manifest wiring passed: 36/36 WebP primary visuals match approved manifest and public files.');
