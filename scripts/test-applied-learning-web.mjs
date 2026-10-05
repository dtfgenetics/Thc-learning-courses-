import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const server=createAcademyWebServer({env:{NODE_ENV:'test',ACADEMY_PREVIEW_DRAFTS:'1'}});
server.listen(0,'127.0.0.1');
await once(server,'listening');
try{
  const base=`http://127.0.0.1:${server.address().port}`;

  const shellResponse=await fetch(`${base}/applied-learning`);
  assert.equal(shellResponse.status,200);
  const shell=await shellResponse.text();
  assert.match(shell,/Applied Learning Lab/);
  assert.match(shell,/Knowledge Graph/);
  assert.match(shell,/Measurement School/);

  const graphResponse=await fetch(`${base}/api/applied-learning/graphs/ALGRAPH-ACADEMY-SEED-001`);
  assert.equal(graphResponse.status,200);
  const graph=await graphResponse.json();
  assert.ok(graph.nodes.length>=50,'runtime graph should include the full canonical curriculum projection');
  assert.ok(graph.edges.length>=graph.nodes.length,'runtime graph should expose meaningful relationship density');
  assert.equal(graph.status,'draft');
  const vpdNode=graph.nodes.find(node=>node.canonicalId==='COMP-ENV-VPD-001');
  assert.ok(vpdNode);
  assert.match(vpdNode.label,/vapor pressure deficit/i);
  assert.ok(graph.nodes.some(node=>node.canonicalType==='objective'));
  assert.ok(graph.nodes.some(node=>node.canonicalType==='lesson'));
  assert.ok(graph.nodes.some(node=>node.canonicalType==='claim'));
  assert.ok(graph.nodes.some(node=>node.canonicalType==='reference'));
  assert.ok(graph.edges.some(edge=>edge.relationship==='teaches-objective'));
  assert.ok(graph.edges.some(edge=>edge.relationship==='supported-by-reference'));
  assert.ok(!('review' in graph));

  const measurementResponse=await fetch(`${base}/api/applied-learning/measurements/ALMEAS-SENSOR-PLACEMENT-001`);
  assert.equal(measurementResponse.status,200);
  const measurement=await measurementResponse.json();
  assert.equal(measurement.status,'draft');
  assert.deepEqual(measurement.competencyIds,['COMP-ENV-VPD-001']);
  assert.ok(measurement.steps.length>=4);
  assert.ok(!('review' in measurement));

  const prod=createAcademyWebServer({env:{NODE_ENV:'production',ACADEMY_PREVIEW_DRAFTS:'0'}});
  prod.listen(0,'127.0.0.1');
  await once(prod,'listening');
  try{
    const prodBase=`http://127.0.0.1:${prod.address().port}`;
    const hidden=await fetch(`${prodBase}/api/applied-learning/graphs/ALGRAPH-ACADEMY-SEED-001`);
    assert.equal(hidden.status,404,'draft applied-learning data must remain hidden in published-only mode');
  } finally {
    await new Promise(resolve=>prod.close(resolve));
  }
} finally {
  await new Promise(resolve=>server.close(resolve));
}
console.log('Applied-learning learner-safe Academy runtime OK');
