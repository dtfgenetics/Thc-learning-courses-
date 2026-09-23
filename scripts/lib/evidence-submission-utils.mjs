import fs from 'node:fs';
import path from 'node:path';

export const root=process.cwd();
export function read(rel){return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));}
export function readDir(rel){
  const d=path.join(root,rel); if(!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>read(path.join(rel,n)));
}
export const evidenceDirectories=[
  'content/reviews',
  'content/pilot-evidence',
  'content/course-pilot-execution-evidence',
  'content/calibration-evidence',
  'content/accessibility-review-evidence',
  'content/standard-setting-evidence',
  'content/secure-form-equivalence-evidence',
  'content/occupational-program-validation-evidence',
  'content/candidate-governance-approvals',
  'content/credential-authorization-evidence',
  'content/production-control-evidence',
  'content/certification-gate-evidence'
];
export function evidenceIndex(){
  const map=new Map();
  for(const dir of evidenceDirectories){
    for(const x of readDir(dir)){
      if(!x.id) continue;
      if(map.has(x.id)) throw new Error(`Duplicate evidence id ${x.id}`);
      map.set(x.id,{dir,record:x});
    }
  }
  return map;
}
export function statusIsReviewable(x){
  if(x.dir==='content/reviews') return x.record.status==='approved';
  if(x.dir==='content/calibration-evidence') return x.record.status==='complete';
  return ['evidence-complete','approved'].includes(x.record.status);
}
