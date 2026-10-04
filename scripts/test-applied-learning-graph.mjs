import fs from 'node:fs';
import assert from 'node:assert/strict';
import { projectGraph, graphNeighborhood } from '../packages/domain/applied-learning-graph.mjs';

const seed=JSON.parse(fs.readFileSync('content/applied-learning/graphs/academy-seed-001.json','utf8'));
const registry=JSON.parse(fs.readFileSync('registry/curriculum.json','utf8'));
assert.equal(seed.status,'draft');
assert.equal(seed.nodes.length,50,'milestone seed must contain 50 canonical nodes');

const canonicalSets={
  competency:new Set(registry.competencies),
  objective:new Set(registry.learningObjectives),
  lesson:new Set(registry.lessons),
  claim:new Set(registry.claims),
  reference:new Set(registry.references)
};
for(const node of seed.nodes){
  assert.ok(canonicalSets[node.canonicalType]?.has(node.canonicalId),`${node.id}: unresolved canonical ${node.canonicalType} ${node.canonicalId}`);
}
const nodeIds=new Set(seed.nodes.map(x=>x.id));
assert.equal(nodeIds.size,seed.nodes.length,'graph node IDs must be unique');
for(const edge of seed.edges){
  assert.ok(nodeIds.has(edge.source),`${edge.id}: unresolved source`);
  assert.ok(nodeIds.has(edge.target),`${edge.id}: unresolved target`);
  for(const evidenceId of edge.evidenceIds??[]) assert.ok(canonicalSets.reference.has(evidenceId),`${edge.id}: unresolved evidence ${evidenceId}`);
}

const projected=projectGraph({
  nodes:seed.nodes.map(node=>({
    id:node.id,
    title:node.canonicalId,
    kind:node.canonicalType,
    status:seed.status
  })),
  edges:seed.edges
});
assert.equal(projected.nodes.length,50);
assert.equal(projected.edges.length,seed.edges.length);
const vpd=graphNeighborhood({
  nodes:seed.nodes.map(node=>({id:node.id,title:node.canonicalId,kind:node.canonicalType,status:seed.status})),
  edges:seed.edges
},'ALNODE-COMP-ENV-VPD-001');
assert.ok(vpd.nodes.some(row=>row.data.id==='ALNODE-CLAIM-ENV-VPD-001'));
assert.throws(()=>projectGraph({nodes:[{id:'A'}],edges:[{id:'BAD',source:'MISSING',target:'A'}]}),/unresolved/);

console.log('Applied-learning canonical graph seed and adapter OK');
