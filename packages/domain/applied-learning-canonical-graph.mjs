import fs from 'node:fs';
import path from 'node:path';

function readJson(filePath){
  return JSON.parse(fs.readFileSync(filePath,'utf8'));
}
function readDirJson(root,relativeDir){
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
function graphNode(type,row){
  return {
    id:`ALNODE-${row.id}`,
    canonicalType:type,
    canonicalId:row.id,
    label:labelFor(type,row),
    ...(text(row.domain)?{domain:row.domain}:{}),
    ...(text(row.status)?{status:row.status}:{})
  };
}

export function buildCanonicalAppliedLearningGraph({root=process.cwd()}={}){
  const collections={
    competency:readDirJson(root,'content/competencies'),
    objective:readDirJson(root,'content/learning-objectives'),
    lesson:readDirJson(root,'content/lessons'),
    claim:readDirJson(root,'content/claims'),
    reference:readDirJson(root,'content/references')
  };

  const nodes=Object.entries(collections)
    .flatMap(([type,rows])=>rows.filter(row=>row?.id).map(row=>graphNode(type,row)))
    .sort((a,b)=>a.id.localeCompare(b.id));
  const nodeIds=new Set(nodes.map(row=>row.id));
  const rawEdges=[];

  function add(sourceId,targetId,relationship,evidenceIds=[]){
    const source=`ALNODE-${sourceId}`;
    const target=`ALNODE-${targetId}`;
    if(!nodeIds.has(source)||!nodeIds.has(target)) return;
    rawEdges.push({
      source,target,relationship,
      evidenceIds:[...new Set(evidenceIds.filter(Boolean))].sort()
    });
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
  const sorted=[...unique.values()].sort((a,b)=>
    [a.source,a.relationship,a.target].join('|').localeCompare([b.source,b.relationship,b.target].join('|'))
  );
  const edges=sorted.map((edge,index)=>({
    id:`ALEDGE-${String(index+1).padStart(6,'0')}`,
    ...edge
  }));

  return {
    id:'ALGRAPH-ACADEMY-SEED-001',
    version:'0.2.0',
    status:'draft',
    title:'THC Academy Canonical Knowledge Graph',
    summary:'Live projection of canonical Academy competencies, objectives, lessons, claims, and references. Relationships are derived from source-of-truth curriculum mappings rather than duplicated instructional content.',
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
}
