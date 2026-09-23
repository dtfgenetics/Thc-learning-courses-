import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const finals=[
  ...Array.from({length:6},(_,i)=>`ASSESS-LH-TECH1-${String(i+1).padStart(3,'0')}-FINAL`),
  ...Array.from({length:7},(_,i)=>`ASSESS-LH-TECH2-${String(i+1).padStart(3,'0')}-FINAL`)
];

const rows=[];
let failures=0;

for(const id of finals){
  const file=path.join(root,'content/assessments',`${id}.json`);
  const assessment=JSON.parse(fs.readFileSync(file,'utf8'));
  const ext=assessment.extensions??{};
  const marker=ext.itemQualityRevision??ext.itemQualityReview;
  const type=ext.itemQualityRevision?'revision':ext.itemQualityReview?'review':'missing';
  const revised=Number(marker?.revisedItemCount ?? (type==='revision' ? assessment.totalItems : 0));
  const preserved=Number(marker?.preservedItemCount ?? (type==='review' ? assessment.totalItems : 0));
  const total=Number(assessment.totalItems);

  const problems=[];
  if(!marker) problems.push('missing-quality-marker');
  if(marker && marker.reviewRequired!==true) problems.push('human-review-not-open');
  if(marker && marker.professionalValidationConferred!==false) problems.push('professional-validation-boundary-missing');
  if(marker && revised+preserved!==total) problems.push('revised-plus-preserved-does-not-equal-total');
  if(ext.courseDerivedAssessment!==true) problems.push('course-derived-provenance-missing');
  if(ext.encyclopediaSubstitutionAllowed!==false) problems.push('encyclopedia-boundary-not-fail-closed');
  if(ext.untaughtMaterialAllowed!==false) problems.push('untaught-material-boundary-not-fail-closed');

  if(problems.length) failures+=problems.length;
  rows.push({id,type,total,revised,preserved,problems});
}

const summary={
  conventionalFinals:rows.length,
  reviewedFinals:rows.filter(r=>r.type!=='missing').length,
  revisedFinals:rows.filter(r=>r.type==='revision').length,
  preservedReviewFinals:rows.filter(r=>r.type==='review').length,
  totalItems:rows.reduce((n,r)=>n+r.total,0),
  revisedItems:rows.reduce((n,r)=>n+r.revised,0),
  preservedItems:rows.reduce((n,r)=>n+r.preserved,0)
};

if(process.argv.includes('--json')){
  console.log(JSON.stringify({summary,rows},null,2));
}else{
  console.log('# Certification Final Quality Coverage\n');
  console.log(`Conventional finals reviewed: ${summary.reviewedFinals}/${summary.conventionalFinals}`);
  console.log(`Finals with item revisions: ${summary.revisedFinals}`);
  console.log(`Finals reviewed and preserved without item rewrites: ${summary.preservedReviewFinals}`);
  console.log(`Items in reviewed conventional finals: ${summary.totalItems}`);
  console.log(`Items revised in this quality-pass metadata: ${summary.revisedItems}`);
  console.log(`Items intentionally preserved after review: ${summary.preservedItems}\n`);
  console.log('| Final | Quality state | Items | Revised | Preserved | Problems |');
  console.log('|---|---|---:|---:|---:|---|');
  for(const r of rows) console.log(`| ${r.id} | ${r.type} | ${r.total} | ${r.revised} | ${r.preserved} | ${r.problems.join(', ')||'—'} |`);
}

if(process.argv.includes('--check') && failures>0){
  console.error(`\nFinal-quality coverage failures: ${failures}`);
  process.exitCode=1;
}
