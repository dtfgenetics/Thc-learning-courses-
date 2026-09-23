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
  'content/form-psychometric-evidence',
  'content/course-pilot-execution-evidence',
  'content/calibration-evidence',
  'content/accessibility-review-evidence',
  'content/standard-setting-evidence',
  'content/integrated-performance-standard-setting-evidence',
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
  if(x.dir==='content/form-psychometric-evidence') return x.record.status==='complete';
  return ['evidence-complete','approved'].includes(x.record.status);
}

export function buildOwnershipResolver(){
  const courses=readDir('content/courses');
  const assessments=readDir('content/assessments');
  const questions=readDir('content/questions');
  const performance=readDir('content/performance-assessments');
  const programs=readDir('content/credential-programs').filter(x=>x.id);
  const controls=read('registry/candidate-governance-controls.json');

  const courseIds=new Set(courses.map(x=>x.id));
  const courseByAssessment=new Map();
  const courseByItem=new Map();
  const courseByPerformance=new Map();

  for(const a of assessments){
    const cid=a.extensions?.courseId;
    if(cid) courseByAssessment.set(a.id,new Set([cid]));
    for(const itemId of a.items??[]){
      if(!courseByItem.has(itemId)) courseByItem.set(itemId,new Set());
      if(cid) courseByItem.get(itemId).add(cid);
    }
  }

  for(const p of performance){
    const ext=p.extensions??{};
    const ids=[...(ext.courseMappings??[]),...(ext.course?[ext.course]:[]),...(ext.integratedCourseId?[ext.integratedCourseId]:[]),...(p.integratedCourseId?[p.integratedCourseId]:[])].filter(Boolean);
    courseByPerformance.set(p.id,new Set(ids));
  }

  const programByCourse=new Map();
  for(const p of programs){
    for(const cid of p.requiredCourses??[]){
      if(!programByCourse.has(cid)) programByCourse.set(cid,new Set());
      programByCourse.get(cid).add(p.id);
    }
  }

  function addProgramsFromCourses(owner){
    for(const cid of owner.courseIds){
      for(const pid of programByCourse.get(cid)??[]) owner.programIds.add(pid);
    }
  }

  function resolve(hit){
    const {dir,record:r}=hit;
    const owner={courseIds:new Set(),programIds:new Set(),controlIds:new Set()};

    if(r.courseId) owner.courseIds.add(r.courseId);
    if(r.credentialProgramId) owner.programIds.add(r.credentialProgramId);
    if(r.controlId) owner.controlIds.add(r.controlId);

    if(dir==='content/reviews'){
      const oid=r.objectId;
      if(courseIds.has(oid)) owner.courseIds.add(oid);
      for(const cid of courseByAssessment.get(oid)??[]) owner.courseIds.add(cid);
      for(const cid of courseByItem.get(oid)??[]) owner.courseIds.add(cid);
      for(const cid of courseByPerformance.get(oid)??[]) owner.courseIds.add(cid);
    }
    if(dir==='content/pilot-evidence'){
      for(const cid of courseByItem.get(r.itemId)??[]) owner.courseIds.add(cid);
    }
    if(dir==='content/calibration-evidence'){
      for(const cid of courseByPerformance.get(r.assessmentId)??[]) owner.courseIds.add(cid);
    }
    if(dir==='content/candidate-governance-approvals'){
      for(const pid of controls.appliesTo??[]) owner.programIds.add(pid);
    }

    addProgramsFromCourses(owner);
    return {
      courseIds:[...owner.courseIds].sort(),
      programIds:[...owner.programIds].sort(),
      controlIds:[...owner.controlIds].sort()
    };
  }

  return {resolve};
}
