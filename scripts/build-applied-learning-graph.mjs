import fs from 'node:fs';
import path from 'node:path';
import { buildCanonicalAppliedLearningGraph } from '../packages/domain/applied-learning-canonical-graph.mjs';

const root=process.cwd();
const outputPath=path.join(root,'content/applied-learning/graphs/academy-seed-001.json');
const graph=buildCanonicalAppliedLearningGraph({root});

if(graph.nodes.length<50) throw new Error(`canonical graph unexpectedly small: ${graph.nodes.length} nodes`);
if(graph.edges.length<graph.nodes.length) throw new Error(`canonical graph relationship coverage unexpectedly sparse: ${graph.edges.length} edges for ${graph.nodes.length} nodes`);

const nodeIds=new Set(graph.nodes.map(row=>row.id));
for(const edge of graph.edges){
  if(!nodeIds.has(edge.source)||!nodeIds.has(edge.target)) throw new Error(`unresolved generated edge ${edge.id}`);
}

if(process.argv.includes('--check')){
  console.log(`Canonical applied-learning graph valid: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(graph,null,2)+'\n');
console.log(`Wrote ${path.relative(root,outputPath)} with ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
