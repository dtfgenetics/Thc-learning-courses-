import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=(p)=>fs.existsSync(path.join(root,p));

const finals=[
  ...Array.from({length:6},(_,i)=>`ASSESS-LH-TECH1-${String(i+1).padStart(3,'0')}-FINAL`),
  ...Array.from({length:7},(_,i)=>`ASSESS-LH-TECH2-${String(i+1).padStart(3,'0')}-FINAL`)
];

const normalize=(v)=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const words=(v)=>normalize(v).split(' ').filter(Boolean);
const higherOrder=new Set(['apply','analyze','evaluate','create']);

function choiceLengthSpread(choices=[]){
  const lengths=choices.map((c)=>words(c).length).filter(Boolean);
  if(lengths.length<2) return 1;
  return Math.max(...lengths)/Math.max(1,Math.min(...lengths));
}

function cueingSignals(item){
  const warnings=[];
  const stem=String(item.stem??'');
  if(/\b(always|never|obviously|clearly)\b/i.test(stem)) warnings.push('absolute-or-cueing-stem-language');
  const choices=item.choices??[];
  if(choices.some((c)=>/\b(all|none) of the above\b/i.test(c))) warnings.push('all-none-of-above');
  if(choiceLengthSpread(choices)>=2.5) warnings.push('large-choice-length-spread');
  if(choices.length && new Set(choices.map((c)=>words(c).length)).size===1) {
    // not a problem; left intentionally neutral
  }
  return warnings;
}

const rows=[];
let structuralFailures=0;
for(const assessmentId of finals){
  const ap=`content/assessments/${assessmentId}.json`;
  if(!exists(ap)){
    rows.push({assessmentId,missing:true,flags:['missing-final-assessment']});
    structuralFailures++;
    continue;
  }
  const assessment=read(ap);
  const items=(assessment.items??[]).map((id)=>read(`content/questions/${id}.json`));
  const objectiveCounts=new Map((assessment.objectives??[]).map((id)=>[id,0]));
  let scenarios=0,higher=0,rationale60=0,rationale100=0,cued=0,lengthSpread=0;
  const reviewItems=[];

  for(const item of items){
    if(item.type==='scenario'||item.type==='case-study') scenarios++;
    if(higherOrder.has(item.bloomLevel)) higher++;
    const rlen=words(item.rationale).length;
    if(rlen>=60) rationale60++;
    if(rlen>=100) rationale100++;
    objectiveCounts.set(item.objective,(objectiveCounts.get(item.objective)??0)+1);
    const cues=cueingSignals(item);
    if(cues.length){
      cued++;
      if(cues.includes('large-choice-length-spread')) lengthSpread++;
      reviewItems.push({id:item.id,signals:cues});
    }
  }

  const counts=[...objectiveCounts.values()];
  const minObjective=Math.min(...counts);
  const maxObjective=Math.max(...counts);
  const itemCount=items.length;
  const flags=[];
  if(minObjective===0){flags.push('objective-with-zero-final-items');structuralFailures++;}
  if(new Set(assessment.items??[]).size!==itemCount){flags.push('duplicate-final-item-id');structuralFailures++;}
  if(itemCount!==assessment.totalItems){flags.push('total-items-mismatch');structuralFailures++;}
  if((assessment.extensions?.courseDerivedAssessment)!==true){flags.push('course-derived-flag-missing');structuralFailures++;}
  if(assessment.extensions?.encyclopediaSubstitutionAllowed!==false){flags.push('encyclopedia-boundary-not-fail-closed');structuralFailures++;}
  if(assessment.extensions?.untaughtMaterialAllowed!==false){flags.push('untaught-material-boundary-not-fail-closed');structuralFailures++;}

  const metrics={
    itemCount,
    objectiveCount:objectiveCounts.size,
    minItemsPerObjective:minObjective,
    maxItemsPerObjective:maxObjective,
    objectiveSpread:maxObjective-minObjective,
    scenarioShare:Number((scenarios/itemCount).toFixed(3)),
    higherOrderShare:Number((higher/itemCount).toFixed(3)),
    rationale60WordShare:Number((rationale60/itemCount).toFixed(3)),
    rationale100WordShare:Number((rationale100/itemCount).toFixed(3)),
    cueingReviewShare:Number((cued/itemCount).toFixed(3)),
    largeChoiceLengthSpreadCount:lengthSpread
  };

  const priorities=[];
  if(metrics.scenarioShare<0.5) priorities.push('review-scenario-depth');
  if(metrics.higherOrderShare<0.75) priorities.push('review-cognitive-demand');
  if(metrics.rationale60WordShare<0.25) priorities.push('review-rationale-depth');
  if(metrics.cueingReviewShare>0.15) priorities.push('review-distractor-cueing');
  if(metrics.objectiveSpread>2) priorities.push('review-objective-balance');

  rows.push({assessmentId,courseId:assessment.extensions?.courseId,title:assessment.title,metrics,flags,priorities,reviewItems});
}

rows.sort((a,b)=>{
  const ap=(a.priorities??[]).length+(a.flags??[]).length*10;
  const bp=(b.priorities??[]).length+(b.flags??[]).length*10;
  return bp-ap || String(a.assessmentId).localeCompare(String(b.assessmentId));
});

const report={scope:'13 conventional canonical Technician course finals',method:'Heuristic review prioritization plus fail-closed structural provenance checks',rows};

if(process.argv.includes('--json')){
  console.log(JSON.stringify(report,null,2));
}else{
  console.log('# Certification Final-Assessment Quality Audit\n');
  console.log('Heuristics prioritize human review; they are not automatic item-validity judgments.\n');
  console.log('| Final | Items | Scenario share | Higher-order share | Rationale >=60w | Cueing-review share | Obj min-max | Priorities | Structural flags |');
  console.log('|---|---:|---:|---:|---:|---:|---:|---|---|');
  for(const r of rows){
    if(r.missing){
      console.log(`| ${r.assessmentId} | — | — | — | — | — | — | — | ${r.flags.join(', ')} |`);
      continue;
    }
    const m=r.metrics;
    console.log(`| ${r.assessmentId} | ${m.itemCount} | ${m.scenarioShare} | ${m.higherOrderShare} | ${m.rationale60WordShare} | ${m.cueingReviewShare} | ${m.minItemsPerObjective}-${m.maxItemsPerObjective} | ${r.priorities.join(', ')||'—'} | ${r.flags.join(', ')||'—'} |`);
  }
}

if(process.argv.includes('--check') && structuralFailures>0){
  console.error(`\nStructural/provenance failures: ${structuralFailures}`);
  for(const r of rows){
    for(const flag of r.flags??[]) console.error(`- ${r.assessmentId}: ${flag}`);
  }
  process.exitCode=1;
}
