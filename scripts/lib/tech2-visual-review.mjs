import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const root=process.cwd();
export const reviewTypes=['visual-technical','visual-instructional','visual-accessibility'];
export const reviewStatuses=['approved','changes-requested','rejected'];

export function readJson(rel){return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));}
export function readText(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
export function visualPlan(){return readJson('visuals/TECH2-VISUAL-PRODUCTION-PLAN.json');}
export function findVisual(conceptId){
  const plan=visualPlan();
  for(const course of plan.courses??[]){
    const concept=(course.concepts??[]).find((row)=>row.conceptId===conceptId);
    if(concept) return {plan,course,concept};
  }
  return null;
}
function stableCandidateProjection(course,concept){
  return {
    courseId:course.courseId,
    conceptId:concept.conceptId,
    outcomeIndex:concept.outcomeIndex,
    outcome:concept.outcome,
    deliveryType:concept.deliveryType,
    targetPublicPath:concept.targetPublicPath,
    sourcePath:concept.sourcePath,
    learnerTextAlternative:concept.learnerTextAlternative,
    caption:concept.caption,
    lessonIds:concept.lessonIds,
    references:concept.references
  };
}
export function candidateFingerprint(conceptId){
  const hit=findVisual(conceptId);
  if(!hit) throw new Error(`Unknown Technician II visual: ${conceptId}`);
  const {course,concept}=hit;
  if(!fs.existsSync(path.join(root,concept.sourcePath))) throw new Error(`${conceptId}: source file missing`);
  const hash=crypto.createHash('sha256');
  hash.update(JSON.stringify(stableCandidateProjection(course,concept)));
  hash.update('\n--svg--\n');
  hash.update(readText(concept.sourcePath));
  for(const lessonId of concept.lessonIds??[]){
    const lesson=readJson(`content/lessons/${lessonId}.json`);
    const visual=(lesson.content?.extensions?.primaryVisuals??[]).find((row)=>row.assetId===conceptId);
    if(!visual) throw new Error(`${conceptId}: lesson mapping missing from ${lessonId}`);
    const stableLesson={
      lessonId,
      assetId:visual.assetId,
      title:visual.title,
      src:visual.src,
      alt:visual.alt,
      caption:visual.caption,
      references:visual.references
    };
    hash.update('\n--lesson--\n');
    hash.update(JSON.stringify(stableLesson));
  }
  return `sha256:${hash.digest('hex')}`;
}
export function readVisualReviews(){
  const dir=path.join(root,'content/reviews');
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name)=>name.endsWith('.json')).sort().map((name)=>readJson(path.join('content/reviews',name)))
    .filter((review)=>reviewTypes.includes(review.reviewType));
}
export function latestApprovedVisualReviews(conceptId,fingerprint){
  const reviews=readVisualReviews().filter((review)=>review.objectId===conceptId && review.objectVersion===fingerprint);
  const result={};
  for(const type of reviewTypes){
    const rows=reviews.filter((review)=>review.reviewType===type).sort((a,b)=>Date.parse(b.reviewedAt)-Date.parse(a.reviewedAt));
    result[type]=rows[0]??null;
  }
  return result;
}
