import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const packets=[
  ...Array.from({length:7},(_,i)=>({
    id:`COURSE-LH-TECH1-${String(i+1).padStart(3,'0')}`,
    path:`docs/learning-hub/tech1/course-${String(i+1).padStart(3,'0')}/accessibility/COURSE${i+1}-RENDERED-ACCESSIBILITY-UX-REVIEW.md`
  })),
  ...Array.from({length:8},(_,i)=>({
    id:`COURSE-LH-TECH2-${String(i+1).padStart(3,'0')}`,
    path:`docs/learning-hub/tech2/course-${String(i+1).padStart(3,'0')}/accessibility/COURSE${i+1}-RENDERED-ACCESSIBILITY-UX-REVIEW.md`
  }))
];

assert.equal(packets.length,15,'canonical rendered-QA packet inventory must cover 15 courses');

for(const packet of packets){
  const full=path.join(root,packet.path);
  assert.ok(fs.existsSync(full),`${packet.id}: missing rendered accessibility/UX review packet`);
  const text=fs.readFileSync(full,'utf8');
  assert.ok(text.includes(packet.id),`${packet.id}: packet must identify the canonical course`);
  assert.match(text,/WCAG\s*2\.2/i,`${packet.id}: packet must target WCAG 2.2`);
  assert.match(text,/keyboard/i,`${packet.id}: packet must include keyboard review`);
  assert.match(text,/screen[- ]reader|assistive technology/i,`${packet.id}: packet must include screen-reader or assistive-technology review`);
  assert.match(text,/mobile|phone/i,`${packet.id}: packet must include mobile review`);
  assert.match(text,/desktop/i,`${packet.id}: packet must include desktop review`);
  assert.match(text,/zoom|reflow/i,`${packet.id}: packet must include zoom/reflow review`);
  assert.match(text,/human|manual/i,`${packet.id}: packet must preserve a human/manual review boundary`);
  assert.match(text,/automated|machine/i,`${packet.id}: packet must distinguish automated support from rendered approval`);
  assert.doesNotMatch(text,/Approved for rendered academic accessibility\/UX use:\s*(YES|APPROVED|TRUE)/i,`${packet.id}: machine-authored packet must not fabricate rendered approval`);
}

console.log('Certification rendered accessibility/UX packet coverage passed for 15/15 canonical courses.');
