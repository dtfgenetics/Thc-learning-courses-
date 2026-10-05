import assert from 'node:assert/strict';
import { buildCanonicalAppliedLearningGraph } from '../packages/domain/applied-learning-canonical-graph.mjs';
import { projectGraph, graphNeighborhood } from '../packages/domain/applied-learning-graph.mjs';

const graph=buildCanonicalAppliedLearningGraph();
assert.equal(graph.status,'draft');
assert.ok(graph.nodes.length>=50,`canonical graph unexpectedly small: ${graph.nodes.length}`);
assert.ok(graph.edges.length>=graph.nodes.length,`graph should have meaningful relationship density: ${graph.edges.length} edges for ${graph.nodes.length} nodes`);

const canonicalTypes=new Set(graph.nodes.map(node=>node.canonicalType));
for(const required of ['competency','objective','lesson','claim','reference']){
  assert.ok(canonicalTypes.has(required),`graph must include ${required} nodes`);
}

const nodeIds=new Set(graph.nodes.map(node=>node.id));
assert.equal(nodeIds.size,graph.nodes.length,'graph node IDs must be unique');
for(const node of graph.nodes){
  assert.ok(typeof node.label==='string'&&node.label.trim().length>0,`${node.id}: learner label required`);
}
for(const edge of graph.edges){
  assert.ok(nodeIds.has(edge.source),`${edge.id}: unresolved source`);
  assert.ok(nodeIds.has(edge.target),`${edge.id}: unresolved target`);
}
assert.equal(new Set(graph.edges.map(edge=>edge.id)).size,graph.edges.length,'graph edge IDs must be unique');

const relationships=new Set(graph.edges.map(edge=>edge.relationship));
for(const required of ['targets-competency','teaches-competency','teaches-objective','cites-reference','supports-competency','supports-lesson','supported-by-reference']){
  assert.ok(relationships.has(required),`graph must include relationship ${required}`);
}

const projected=projectGraph({
  nodes:graph.nodes.map(node=>({
    id:node.id,
    title:node.label,
    kind:node.canonicalType,
    status:node.status??graph.status
  })),
  edges:graph.edges
});
assert.equal(projected.nodes.length,graph.nodes.length);
assert.equal(projected.edges.length,graph.edges.length);

const vpd=graphNeighborhood({
  nodes:graph.nodes.map(node=>({id:node.id,title:node.label,kind:node.canonicalType,status:node.status??graph.status})),
  edges:graph.edges
},'ALNODE-COMP-ENV-VPD-001');
for(const neighbor of ['ALNODE-LO-ENV-VPD-001','ALNODE-LESSON-ENV-VPD-001','ALNODE-CLAIM-ENV-VPD-001']){
  assert.ok(vpd.nodes.some(row=>row.data.id===neighbor),`VPD neighborhood should include ${neighbor}`);
}

assert.throws(()=>projectGraph({nodes:[{id:'A'}],edges:[{id:'BAD',source:'MISSING',target:'A'}]}),/unresolved/);
console.log(`Applied-learning canonical graph OK: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
