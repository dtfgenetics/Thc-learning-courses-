import assert from 'node:assert/strict';
import fs from 'node:fs';

const r=JSON.parse(fs.readFileSync('registry/occupational-validation-instruments.json','utf8'));
assert.equal(r.programs.length,2);
assert.equal(r.programs.find((x)=>x.programId==='CREDPROG-CULT-TECH-I-001').taskCount,13);
assert.equal(r.programs.find((x)=>x.programId==='CREDPROG-CULT-TECH-II-001').taskCount,12);
assert.match(r.decisionBoundary,/No automatic numeric cutoff/i);
for(const p of r.programs){
  for(const key of ['panelCsv','emergingTaskCsv','instructions']) assert.ok(fs.existsSync(p[key]),p.programId+': missing '+key);
  const header=fs.readFileSync(p.panelCsv,'utf8').split(/\r?\n/)[0];
  for(const field of ['relevance','importance_0_5','frequency_0_5','consequence_1_5','expected_at_entry','assess_in_credential']) assert.ok(header.includes(field),p.programId+': missing '+field);
}
console.log('Occupational validation instruments: PASS (Tech I 13 tasks; Tech II 12 tasks; SME ratings + emerging-task capture; no automatic approval cutoff).');
