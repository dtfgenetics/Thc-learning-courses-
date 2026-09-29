import assert from 'node:assert/strict';
import { projectGraph, graphNeighborhood } from '../packages/domain/applied-learning-graph.mjs';

const graph={
 nodes:[
  {id:'CONCEPT-VPD',title:'Vapor pressure deficit',kind:'concept',status:'draft'},
  {id:'CONCEPT-TRANSPIRATION',title:'Transpiration',kind:'mechanism',status:'draft'},
  {id:'CONCEPT-STOMATA',title:'Stomatal behavior',kind:'mechanism',status:'draft'}
 ],
 edges:[
  {id:'EDGE-VPD-TRANSPIRATION',source:'CONCEPT-VPD',target:'CONCEPT-TRANSPIRATION',relationship:'influences'},
  {id:'EDGE-STOMATA-TRANSPIRATION',source:'CONCEPT-STOMATA',target:'CONCEPT-TRANSPIRATION',relationship:'contributes-to'}
 ]
};
const projected=projectGraph(graph);
assert.equal(projected.elements.length,5);
assert.equal(projected.edges[0].data.relationship,'influences');
const neighborhood=graphNeighborhood(graph,'CONCEPT-TRANSPIRATION');
assert.equal(neighborhood.nodes.length,3);
assert.equal(neighborhood.edges.length,2);
assert.throws(()=>projectGraph({nodes:graph.nodes,edges:[{id:'BAD',source:'MISSING',target:'CONCEPT-VPD'}]}),/unresolved/);
console.log('Applied-learning graph adapter OK');
