import fs from 'node:fs';
import path from 'node:path';
import { candidateFingerprint, findVisual, latestApprovedVisualReviews, reviewTypes, root } from './lib/tech2-visual-review.mjs';

const args=Object.fromEntries(process.argv.slice(2).filter((x)=>x.startsWith('--')&&x.includes('=')).map((x)=>{const [k,...v]=x.slice(2).split('=');return[k,v.join('=')];}));
const checkOnly=process.argv.includes('--check');
const visualId=args.visual;
if(!visualId) throw new Error('Usage: node scripts/promote-tech2-visual.mjs --visual=VIS-LH-TECH2-... [--check]');
const hit=findVisual(visualId);
if(!hit) throw new Error(`Unknown visual ${visualId}`);
const fingerprint=candidateFingerprint(visualId);
const reviews=latestApprovedVisualReviews(visualId,fingerprint);
const failures=[];
for(const type of reviewTypes){
  const review=reviews[type];
  if(!review) failures.push(`missing exact-version ${type} review`);
  else if(review.status!=='approved') failures.push(`${type} latest exact-version status=${review.status}`);
}
if(failures.length){
  console.error(`${visualId} cannot be promoted: ${failures.join('; ')}`);
  process.exit(2);
}
if(checkOnly){
  console.log(`${visualId} is eligible for promotion with exact fingerprint ${fingerprint}`);
  process.exit(0);
}
const plan=hit.plan;
hit.concept.status='approved';
hit.concept.qaApproved=true;
hit.concept.approvedFingerprint=fingerprint;
const planPath=path.join(root,'visuals/TECH2-VISUAL-PRODUCTION-PLAN.json');
fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n','utf8');
for(const lessonId of hit.concept.lessonIds??[]){
  const rel=`content/lessons/${lessonId}.json`;
  const full=path.join(root,rel);
  const lesson=JSON.parse(fs.readFileSync(full,'utf8'));
  const visual=(lesson.content?.extensions?.primaryVisuals??[]).find((row)=>row.assetId===visualId);
  if(!visual) throw new Error(`${visualId}: mapped visual missing from ${lessonId}`);
  visual.extensions=visual.extensions??{};
  visual.extensions.releaseApproved=true;
  visual.extensions.releaseState='approved';
  visual.extensions.approvedFingerprint=fingerprint;
  fs.writeFileSync(full,JSON.stringify(lesson,null,2)+'\n','utf8');
}
console.log(`Promoted ${visualId} with exact fingerprint ${fingerprint}`);
