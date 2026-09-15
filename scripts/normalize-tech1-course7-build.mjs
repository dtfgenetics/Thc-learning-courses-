import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const write = (rel, value) => fs.writeFileSync(path.join(root, rel), JSON.stringify(value, null, 2) + '\n');

const generatedJson = [
  'content/lessons/LESSON-LH-TECH1-007-02.json',
  ...Array.from({length:12}, (_,i)=>`content/questions/ITEM-LH-TECH1-007-M01-${String(i+1).padStart(3,'0')}.json`)
];

for (const rel of generatedJson) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8').replaceAll('REF-WATER-001', 'REF-IRRIGATION-001');
  fs.writeFileSync(path.join(root, rel), text);
}

const targets = [0,1,2,3,0,1,2,3,0,1,2,3];
for (let i=0; i<12; i++) {
  const rel = `content/questions/ITEM-LH-TECH1-007-M01-${String(i+1).padStart(3,'0')}.json`;
  const q = read(rel);
  const correctChoice = q.choices[q.correct];
  const remaining = q.choices.filter((_, idx)=>idx !== q.correct);
  const target = targets[i];
  remaining.splice(target, 0, correctChoice);
  q.choices = remaining;
  q.correct = target;
  q.extensions = {...(q.extensions||{}), courseId:'COURSE-LH-TECH1-007', itemSet:'course7-readiness-v1'};
  write(rel, q);
}

console.log('Normalized Course 007 references and balanced readiness-item source answer positions.');
