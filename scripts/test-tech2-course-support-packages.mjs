import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const text=(p)=>fs.readFileSync(path.join(root,p),'utf8');

for(let n=1;n<=8;n++){
  const n3=String(n).padStart(3,'0');
  const course=read(`content/courses/COURSE-LH-TECH2-${n3}.json`);
  const base=`docs/learning-hub/tech2/course-${n3}`;
  const manifestPath=`${base}/COURSE-PACKAGE-MANIFEST.md`;
  const supportPath=`${base}/LEARNER-REMEDIATION-VISUAL-PACKAGE.md`;
  assert.ok(fs.existsSync(path.join(root,manifestPath)),`Course ${n}: package manifest missing`);
  assert.ok(fs.existsSync(path.join(root,supportPath)),`Course ${n}: learner/remediation/visual package missing`);
  const manifest=text(manifestPath);
  const support=text(supportPath);
  assert.match(manifest,new RegExp(course.id.replaceAll('-','\\-')),`Course ${n}: manifest must name canonical course id`);
  assert.match(manifest,/Public academic package:\*\* published|Public academic package:\*\*\s*published|Public academic package:\s*published/i,`Course ${n}: manifest must record published academic package`);
  assert.match(manifest,/human\/evidence gates|Open human\/evidence gates/i,`Course ${n}: manifest must preserve human gates`);
  assert.match(support,/Applied (?:learner )?artifact:/,`Course ${n}: support package needs applied artifacts`);
  assert.match(support,/Equivalent reassessment:/,`Course ${n}: support package needs equivalent reassessment`);
  assert.match(support,/Visual concept 1:/,`Course ${n}: support package needs visual briefs`);
  assert.match(support,/Accessibility\/manual|Accessibility\/manual review/i,`Course ${n}: support package needs accessibility review criteria`);
  assert.match(support,/does not validate|does not issue|do not validate|do not issue|does not itself validate|Public academic completion alone does not validate|Readiness checks.*do not count/i,`Course ${n}: support package must preserve credential boundary`);
  const outcomeCount=(course.learningOutcomes??[]).length;
  assert.ok(outcomeCount>=4,`Course ${n}: expected at least four learning outcomes`);
  for(let i=1;i<=outcomeCount;i++) assert.match(support,new RegExp(`### Outcome ${i}(?:\\n|\\r)`),`Course ${n}: missing support for outcome ${i}`);
}
console.log('Technician II Courses 1-8 learner/remediation/visual package contract: PASS');
