import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const readJson=(rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDirJson=(rel)=>{
  const dir=path.join(root,rel);
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>readJson(path.join(rel,n)));
};

const finalIds=[
  ...Array.from({length:6},(_,i)=>`ASSESS-LH-TECH1-${String(i+1).padStart(3,'0')}-FINAL`),
  ...Array.from({length:7},(_,i)=>`ASSESS-LH-TECH2-${String(i+1).padStart(3,'0')}-FINAL`)
];

const assessments=new Map(readDirJson('content/assessments').map(x=>[x.id,x]));
const questions=new Map(readDirJson('content/questions').map(x=>[x.id,x]));
const reviews=readDirJson('content/reviews');

function latestReview(objectId,objectVersion){
  return reviews
    .filter(r=>r.objectId===objectId && String(r.objectVersion)===String(objectVersion) && r.reviewType==='assessment')
    .sort((a,b)=>Date.parse(b.reviewedAt)-Date.parse(a.reviewedAt))[0] ?? null;
}
function state(review){
  if(!review) return 'pending';
  return review.status==='approved' ? 'approved' : 'revision-required';
}

const rows=[];
let structuralFailures=0;
for(const id of finalIds){
  const assessment=assessments.get(id);
  if(!assessment){
    rows.push({assessmentId:id,problems:['missing-final-assessment']});
    structuralFailures++;
    continue;
  }
  const marker=assessment.extensions?.itemQualityRevision ?? assessment.extensions?.itemQualityReview;
  const markerType=assessment.extensions?.itemQualityRevision?'revision':assessment.extensions?.itemQualityReview?'review':'missing';
  const problems=[];
  if(!marker){problems.push('missing-quality-pass-marker');structuralFailures++;}
  if(assessment.extensions?.courseDerivedAssessment!==true){problems.push('course-derived-provenance-missing');structuralFailures++;}
  if(assessment.extensions?.encyclopediaSubstitutionAllowed!==false){problems.push('encyclopedia-boundary-not-fail-closed');structuralFailures++;}
  if(assessment.extensions?.untaughtMaterialAllowed!==false){problems.push('untaught-material-boundary-not-fail-closed');structuralFailures++;}

  const definitionReview=latestReview(assessment.id,assessment.version);
  const itemRows=[];
  for(const itemId of assessment.items ?? []){
    const item=questions.get(itemId);
    if(!item){
      problems.push(`missing-item:${itemId}`);
      structuralFailures++;
      continue;
    }
    const review=latestReview(item.id,item.version);
    itemRows.push({
      id:item.id,
      version:item.version,
      state:state(review),
      latestReviewId:review?.id ?? null,
      latestReviewStatus:review?.status ?? null
    });
  }
  if(itemRows.length!==assessment.totalItems){
    problems.push('resolved-item-count-mismatch');
    structuralFailures++;
  }

  const counts={approved:0,pending:0,'revision-required':0};
  for(const item of itemRows) counts[item.state]=(counts[item.state]??0)+1;
  rows.push({
    assessmentId:id,
    courseId:assessment.extensions?.courseId ?? null,
    assessmentVersion:assessment.version,
    qualityPass:markerType,
    definitionReview:{
      state:state(definitionReview),
      latestReviewId:definitionReview?.id ?? null,
      latestReviewStatus:definitionReview?.status ?? null
    },
    itemReview:{
      total:itemRows.length,
      approved:counts.approved??0,
      pending:counts.pending??0,
      revisionRequired:counts['revision-required']??0
    },
    problems,
    items:itemRows
  });
}

const summary={
  conventionalFinals:rows.length,
  definitionApproved:rows.filter(r=>r.definitionReview?.state==='approved').length,
  definitionPending:rows.filter(r=>r.definitionReview?.state==='pending').length,
  definitionRevisionRequired:rows.filter(r=>r.definitionReview?.state==='revision-required').length,
  totalCurrentItems:rows.reduce((n,r)=>n+(r.itemReview?.total??0),0),
  itemApproved:rows.reduce((n,r)=>n+(r.itemReview?.approved??0),0),
  itemPending:rows.reduce((n,r)=>n+(r.itemReview?.pending??0),0),
  itemRevisionRequired:rows.reduce((n,r)=>n+(r.itemReview?.revisionRequired??0),0),
  finalsWithQualityPass:rows.filter(r=>r.qualityPass==='revision'||r.qualityPass==='review').length
};

if(process.argv.includes('--json')){
  console.log(JSON.stringify({summary,rows},null,2));
}else{
  console.log('# Certification Final Human Review Queue\n');
  console.log('This report tracks exact current assessment/item versions. Pending review is expected and does not equal failure.\n');
  console.log(`Conventional finals: ${summary.conventionalFinals}`);
  console.log(`Final definitions approved/pending/revision-required: ${summary.definitionApproved}/${summary.definitionPending}/${summary.definitionRevisionRequired}`);
  console.log(`Current final items approved/pending/revision-required: ${summary.itemApproved}/${summary.itemPending}/${summary.itemRevisionRequired}\n`);
  console.log('| Final | Quality pass | Final review | Items | Approved | Pending | Revision required | Problems |');
  console.log('|---|---|---|---:|---:|---:|---:|---|');
  for(const r of rows){
    console.log(`| ${r.assessmentId} | ${r.qualityPass??'—'} | ${r.definitionReview?.state??'—'} | ${r.itemReview?.total??0} | ${r.itemReview?.approved??0} | ${r.itemReview?.pending??0} | ${r.itemReview?.revisionRequired??0} | ${r.problems?.join(', ')||'—'} |`);
  }
}

if(process.argv.includes('--check') && structuralFailures>0){
  console.error(`\nStructural review-queue failures: ${structuralFailures}`);
  for(const r of rows) for(const p of r.problems??[]) console.error(`- ${r.assessmentId}: ${p}`);
  process.exitCode=1;
}

if(process.argv.includes('--require-complete')){
  const incomplete=rows.filter(r=>r.definitionReview?.state!=='approved'||(r.itemReview?.approved??0)!==(r.itemReview?.total??0));
  if(incomplete.length){
    console.error('\nHuman assessment review is not complete for:');
    for(const r of incomplete) console.error(`- ${r.assessmentId}: final=${r.definitionReview?.state}, items=${r.itemReview?.approved??0}/${r.itemReview?.total??0} approved`);
    process.exitCode=1;
  }
}
