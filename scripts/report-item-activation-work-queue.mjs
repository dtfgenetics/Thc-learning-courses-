import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=new Set(process.argv.slice(2));
const asJson=args.has('--json');
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

const assessment=read('content/assessments/ASSESS-CULT-FOUNDATIONS-FINAL-001.json');
const readiness=read('registry/cultivation-foundations-item-bank-readiness.json');
const questionDir=path.join(root,'content/questions');
const questions=fs.readdirSync(questionDir)
  .filter(n=>n.endsWith('.json'))
  .map(n=>read(path.join('content/questions',n)));

const eligiblePurpose=new Set(['summative','credential']);
const rows=assessment.blueprint.map((bp)=>{
  const candidates=questions
    .filter(q=>q.competency===bp.competency && eligiblePurpose.has(q.purpose))
    .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  const active=candidates.filter(q=>q.status==='active');
  const nonActive=candidates.filter(q=>q.status!=='active');
  const byStatus={};
  for(const q of candidates) byStatus[q.status??'missing']=(byStatus[q.status??'missing']??0)+1;
  const deficit=Math.max(0,readiness.minimumActiveItemsPerCompetency-active.length);
  return {
    competency:bp.competency,
    formItems:bp.items,
    cognitiveTarget:bp.cognitiveTarget,
    candidateCount:candidates.length,
    activeCount:active.length,
    minimumActiveRequired:readiness.minimumActiveItemsPerCompetency,
    activationDeficit:deficit,
    candidateDepthMet:candidates.length>=readiness.minimumCandidateItemsPerCompetency,
    activeDepthMet:deficit===0,
    statusCounts:byStatus,
    activeItemIds:active.map(q=>q.id),
    priorityCandidateItemIds:nonActive.slice(0,Math.max(deficit,readiness.minimumActiveItemsPerCompetency)).map(q=>q.id),
    activationEvidenceRequired:[
      'exact-version human assessment review approval',
      'controlled pilot evidence for the exact item version',
      'documented disposition of review/pilot findings',
      'status transition recorded without overwriting prior evidence',
      'approved secure operational assessment-store boundary before credential use'
    ]
  };
});

const output={
  generatedFrom:'content/questions + ASSESS-CULT-FOUNDATIONS-FINAL-001 + cultivation-foundations-item-bank-readiness',
  assessmentId:assessment.id,
  assessmentVersion:assessment.version,
  currentState:readiness.state,
  boundary:readiness.boundary,
  summary:{
    competencies:rows.length,
    competenciesWithCandidateDepth:rows.filter(r=>r.candidateDepthMet).length,
    competenciesWithActiveDepth:rows.filter(r=>r.activeDepthMet).length,
    totalCandidates:rows.reduce((n,r)=>n+r.candidateCount,0),
    totalActive:rows.reduce((n,r)=>n+r.activeCount,0),
    totalActivationDeficit:rows.reduce((n,r)=>n+r.activationDeficit,0),
    minimumActiveItemsPerCompetency:readiness.minimumActiveItemsPerCompetency,
    operationalPoolReady:rows.every(r=>r.activeDepthMet)
  },
  competencies:rows
};

if(asJson) console.log(JSON.stringify(output,null,2));
else{
  console.log('Cultivation Foundations item activation queue');
  console.log(`Competencies with candidate depth: ${output.summary.competenciesWithCandidateDepth}/${output.summary.competencies}`);
  console.log(`Competencies with active depth: ${output.summary.competenciesWithActiveDepth}/${output.summary.competencies}`);
  console.log(`Total candidate items: ${output.summary.totalCandidates}; active: ${output.summary.totalActive}; remaining activation slots: ${output.summary.totalActivationDeficit}`);
  for(const r of rows){
    console.log(`- ${r.competency}: candidates=${r.candidateCount}, active=${r.activeCount}, deficit=${r.activationDeficit}, statuses=${JSON.stringify(r.statusCounts)}`);
    if(r.activationDeficit>0) console.log(`  priority candidates: ${r.priorityCandidateItemIds.join(', ')}`);
  }
}
