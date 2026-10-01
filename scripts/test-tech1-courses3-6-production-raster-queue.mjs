import fs from 'node:fs';
const p='visuals/TECH1-COURSES3-6-PRODUCTION-RASTER-WORK-QUEUE.json';
const q=JSON.parse(fs.readFileSync(p,'utf8'));
const errors=[];
if(q.summary?.total!==30) errors.push('expected summary.total=30');
if(q.assets?.length!==30) errors.push('expected 30 asset records');
const ids=new Set();
const allowed=new Set(['png','webp','jpeg','jpg']);
for(const a of q.assets||[]){
 if(ids.has(a.assetId)) errors.push('duplicate '+a.assetId); ids.add(a.assetId);
 if(a.legacySvgReleaseAllowed!==false) errors.push(a.assetId+' must block SVG final release');
 if(a.compatibilityCandidateMayBePromoted!==false) errors.push(a.assetId+' must block compatibility-render promotion');
 if(!allowed.has(a.preferredFormat)) errors.push(a.assetId+' invalid preferredFormat');
 if(a.releaseApproved!==false) errors.push(a.assetId+' cannot start release-approved');
 const keys=['integrity','copyUnits','factual','accessibility','responsiveOrPrint','publicPath'];
 for(const k of keys) if(!(k in (a.qa||{}))) errors.push(a.assetId+' missing qa.'+k);
}
const byCourse={};
for(const a of q.assets||[]) byCourse[a.courseId]=(byCourse[a.courseId]||0)+1;
for(const [id,n] of Object.entries({'COURSE-LH-TECH1-003':6,'COURSE-LH-TECH1-004':7,'COURSE-LH-TECH1-005':9,'COURSE-LH-TECH1-006':8})) if(byCourse[id]!==n) errors.push(id+' expected '+n+' got '+(byCourse[id]||0));
if(errors.length){console.error('Tech I Courses 3-6 production raster queue failed:\n- '+errors.join('\n- '));process.exit(1);}
console.log('Tech I Courses 3-6 production raster queue passed: 30 fail-closed production briefs across Courses 3-6.');
