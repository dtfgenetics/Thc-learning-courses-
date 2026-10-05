import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const outputPath=path.join(root,'content/applied-learning/graphs/academy-seed-001.json');

function readJson(filePath){
  return JSON.parse(fs.readFileSync(filePath,'utf8'));
}
function readDirJson(relativeDir){
  const dir=path.join(root,relativeDir);
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name=>name.endsWith('.json'))
    .sort()
    .map(name=>readJson(path.join(dir,name)));
}
function text(value){ return typeof value==='string' ? value.trim() : ''; }
function labelFor(type,row){
  if(type==='objective') return text(row.statement)||row.id;
  if(type==='claim') return text(row.statement)||row.id;
  return text(row.title)||row.id;
}
function node(type,row){
  return {
    id:`ALNODE-${row.id}`,
    canonicalType:type,
    canonicalId:row.id,
    label:labelFor(type,row),
    ...(text(row.domain)?{domain:row.domain}:{}),
    ...(text(row.status)?{status:row.status}:{})
  };
}

const collections={
  competency:readDirJson('content/competencies'),
  objective:readDirJson('content/learning-objectives'),
  lesson:readDirJson('content/lessons'),
  claim:readDirJson('content/claims'),
  reference:readDirJson('content/references')
};

const nodes=Object.entries(collections)
  .flatMap(([type,rows])=>rows.filter(row=>row?.id).map(row=>node(type,row)))
  .sort((a,b)=>a.id.localeCompare(b.id));
const nodeIds=new Set(nodes.map(row=>row.id));

const rawEdges=[];
function add(sourceId,targetId,relationship,evidenceIds=[]){
  const source=`ALNODE-${sourceId}`;
  const target=`ALNODE-${targetId}`;
  if(!nodeIds.has(source)||!nodeIds.has(target)) return;
  rawEdges.push({source,target,relationship,evidenceIds:[...new Set(evidenceIds.filter(Boolean))].sort()});
}

for(const objective of collections.objective){
  if(objective.competency) add(objective.id,objective.competency,'targets-competency');
}
for(const lesson of collections.lesson){
  for(const competencyId of lesson.competencies??[]) add(lesson.id,competencyId,'teaches-competency');
  for(const objectiveId of lesson.learningObjectives??lesson.objectives??[]) add(lesson.id,objectiveId,'teaches-objective');
  for(const referenceId of lesson.references??[]) add(lesson.id,referenceId,'cites-reference',[referenceId]);
}
for(const claim of collections.claim){
  for(const competencyId of claim.supportsCompetencies??[]) add(claim.id,competencyId,'supports-competency',claim.references??[]);
  for(const lessonId of claim.supportsLessons??[]) add(claim.id,lessonId,'supports-lesson',claim.references??[]);
  for(const referenceId of claim.references??[]) add(claim.id,referenceId,'supported-by-reference',[referenceId]);
}

const unique=new Map();
for(const edge of rawEdges){
  const key=[edge.source,edge.target,edge.relationship].join('|');
  if(!unique.has(key)) unique.set(key,edge);
}
const sortedEdges=[...unique.values()].sort((a,b)=>{
  const ak=[a.source,a.relationship,a.target].join('|');
  const bk=[b.source,b.relationship,b.target].join('|');
  return ak.localeCompare(bk);
});
const edges=sortedEdges.map((edge,index)=>({
  id:`ALEDGE-${String(index+1).padStart(6,'0')}`,
  ...edge
}));

const graph={
  id:'ALGRAPH-ACADEMY-SEED-001',
  version:'0.2.0',
  status:'draft',
  title:'THC Academy Canonical Knowledge Graph',
  summary:'Generated projection of canonical Academy competencies, objectives, lessons, claims, and references. Relationships are derived from source-of-truth curriculum mappings rather than duplicated instructional content.',
  generatedFrom:{
    competencies:collections.competency.length,
    objectives:collections.objective.length,
    lessons:collections.lesson.length,
    claims:collections.claim.length,
    references:collections.reference.length
  },
  nodes,
  edges
};

const rendered=JSON.stringify(graph,null,2)+'\n';
if(process.argv.includes('--check')){
  const current=fs.existsSync(outputPath)?fs.readFileSync(outputPath,'utf8'):'';
  if(current!==rendered){
    console.error('Applied-learning graph is stale. Run: npm run applied-learning:graph:build');
    process.exit(1);
  }
  console.log(`Applied-learning graph is synchronized: ${nodes.length} nodes, ${edges.length} edges`);
  process.exit(0);
}
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,rendered);
console.log(`Wrote ${path.relative(root,outputPath)} with ${nodes.length} nodes and ${edges.length} edges`);
