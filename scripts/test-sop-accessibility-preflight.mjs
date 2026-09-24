import assert from 'node:assert/strict';
import fs from 'node:fs';
const review=JSON.parse(fs.readFileSync('registry/sop-package-review-queue.json','utf8'));
const pre=JSON.parse(fs.readFileSync('registry/sop-accessibility-preflight.json','utf8'));
assert.equal(pre.packageCount,17);
assert.equal(pre.completed,17);
assert.equal(pre.manualApproved,0);
assert.match(pre.targetStandard,/WCAG 2\.2/i);

function heads(text){return text.split(/\r?\n/).map(l=>l.match(/^(#{1,6})\s+(.+)/)).filter(Boolean).map(m=>({level:m[1].length,text:m[2]}));}
for(const row of review.packages){
  assert.equal(row.accessibilityPreflight,'complete');
  assert.equal(row.accessibilityManualReview,'not-started');
  assert.ok(fs.existsSync(row.accessibilityReviewPacket),`${row.id}: accessibility packet missing`);
  const packet=fs.readFileSync(row.accessibilityReviewPacket,'utf8').toLowerCase();
  for(const token of ['wcag 2.2','keyboard','screen-reader','mobile','desktop','zoom','reflow','manual review pending']) assert.ok(packet.includes(token),`${row.id}: packet missing ${token}`);
  const base='docs/sop-packages/'+row.id;
  for(const file of ['SCIENTIFIC-SOP-DRAFT.md','LEARNER-GUIDE-DRAFT.md','IMPLEMENTATION-HANDOFF.md']){
    const hs=heads(fs.readFileSync(base+'/'+file,'utf8'));
    assert.equal(hs.filter(h=>h.level===1).length,1,`${row.id}/${file}: expected one H1`);
    for(let i=1;i<hs.length;i++) assert.ok(hs[i].level<=hs[i-1].level+1,`${row.id}/${file}: skipped heading level`);
  }
  const csv='apps/web/public/downloads/sop-packages/'+row.id.toLowerCase()+'-records-template.csv';
  const header=fs.readFileSync(csv,'utf8').trim().split(/\r?\n/)[0].split(',');
  assert.ok(header.length>=20,`${row.id}: records template requires >=20 fields`);
  assert.equal(new Set(header).size,header.length,`${row.id}: duplicate CSV header`);
  assert.ok(header.every(x=>x.trim()),`${row.id}: blank CSV header`);
}
console.log('SOP accessibility preflight: PASS (17/17 source packages prepared for manual WCAG 2.2 AA review; no rendered approval implied).');
