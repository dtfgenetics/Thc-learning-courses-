import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const errors=[];
const readJson=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const readDir=(rel)=>{
  const dir=path.join(root,rel);
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>({file:path.join(rel,n),data:readJson(path.join(dir,n))}));
};

const courses=new Map(readDir('content/courses').map(x=>[x.data.id,x.data]));
const entries=readDir('content/certification-gate-evidence');
const ids=new Set();
const gates=new Set([
  'exactVersionHumanAssessmentReview','pilotExecution','itemAnalysis',
  'practicalAssessorCalibration','accessibilityUxHumanReview','standardSetting',
  'secureOperationalFormReadiness','credentialAuthorization'
]);
const statuses=new Set(['in-progress','evidence-complete','approved','revision-required']);

for(const {file,data:r} of entries){
  for(const f of ['id','courseId','courseVersion','gate','status','authorityId','recordedAt','summary']){
    if(r[f]===undefined||r[f]===null||r[f]==='') errors.push(`${file}: missing required field ${f}`);
  }
  if(typeof r.id!=='string'||!/^CGE-[A-Z0-9-]+$/.test(r.id)) errors.push(`${file}: invalid id`);
  else if(ids.has(r.id)) errors.push(`${file}: duplicate id ${r.id}`);
  else ids.add(r.id);
  if(!gates.has(r.gate)) errors.push(`${file}: invalid gate ${r.gate}`);
  if(!statuses.has(r.status)) errors.push(`${file}: invalid status ${r.status}`);
  if(!Number.isFinite(Date.parse(r.recordedAt))) errors.push(`${file}: recordedAt must be a valid date-time`);

  const course=courses.get(r.courseId);
  if(!course) errors.push(`${file}: unknown courseId ${r.courseId}`);
  else if(String(course.version)!==String(r.courseVersion)) errors.push(`${file}: courseVersion ${r.courseVersion} does not match current ${course.version}`);

  if(r.evidenceRefs!==undefined && (!Array.isArray(r.evidenceRefs)||r.evidenceRefs.some(x=>typeof x!=='string'||!x))) errors.push(`${file}: evidenceRefs must be an array of non-empty strings`);
  if(r.limitations!==undefined && (!Array.isArray(r.limitations)||r.limitations.some(x=>typeof x!=='string'||!x))) errors.push(`${file}: limitations must be an array of non-empty strings`);
}

if(errors.length){
  console.error('Certification gate evidence validation failed:');
  for(const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`Certification gate evidence validation passed. ${entries.length} record(s) checked against current course versions.`);
