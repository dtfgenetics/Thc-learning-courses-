import fs from 'node:fs';
const q=JSON.parse(fs.readFileSync('visuals/TECH1-COURSES3-6-PRODUCTION-RASTER-WORK-QUEUE.json','utf8'));
const docs=['docs/learning-hub/tech1/TECH1-COURSES3-6-PRODUCTION-BRIEFS-BATCH-A.md','docs/learning-hub/tech1/TECH1-COURSES3-6-PRODUCTION-BRIEFS-BATCH-B.md'];
const corpus=docs.map(p=>fs.readFileSync(p,'utf8')).join('\n');
const errors=[];
for(const a of q.assets){const n=corpus.split(a.assetId).length-1;if(n!==1) errors.push(a.assetId+' brief occurrence expected 1, got '+n);}
for(const required of ['**Evidence:**','**Acceptance:**']) if(!corpus.includes(required)) errors.push('brief corpus missing '+required);
if(errors.length){console.error('Raster production brief coverage failed:\n- '+errors.join('\n- '));process.exit(1);}
console.log('Raster production brief coverage passed: all 30 queue assets have exactly one governed production brief.');
