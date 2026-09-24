import assert from 'node:assert/strict';
import fs from 'node:fs';

const file='docs/academy-v2/job-task-analyses/CULTIVATION_TECHNICIAN_II_JTA.md';
const text=fs.readFileSync(file,'utf8');
assert.match(text,/CREDPROG-CULT-TECH-II-001/);
assert.match(text,/requires cannabis cultivation SME\/employer validation/i);
assert.match(text,/THC-CERT-OCCUPATIONAL-SOURCE-BASELINE-001/);
for(let i=1;i<=12;i++) assert.match(text,new RegExp('### '+i+'\\.'));
for(let i=1;i<=8;i++) assert.match(text,new RegExp('COURSE-LH-TECH2-00'+i));
for(const p of ['Practical A','Practical B','Practical C','Practical D','Practical E','Practical F','Practical G']) assert.ok(text.includes(p),`missing ${p}`);
assert.match(text,/Senior Technician Diagnostic Shift/);
assert.match(text,/does not independently authorize/i);
assert.match(text,/Formal validation still required/);
console.log('Technician II JTA baseline: PASS (12-domain occupational model, 8-course map, 7 practicals, capstone, explicit SME/employer validation boundary).');
