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

const performance=readDir('content/performance-assessments');
const performanceMap=new Map(performance.map(x=>[x.data.id,x.data]));
const calibration=readDir('content/calibration-evidence');
const seen=new Set();

for(const {file,data:r} of calibration){
  for(const field of ['id','assessmentId','assessmentVersion','status','sampleCount','assessorCount','pairCount','domains','analystId']){
    if(r[field]===undefined || r[field]===null || r[field]==='') errors.push(`${file}: missing required field ${field}`);
  }
  if(typeof r.id!=='string'||!/^CAL-[A-Z0-9-]+$/.test(r.id)) errors.push(`${file}: invalid id`);
  else if(seen.has(r.id)) errors.push(`${file}: duplicate id ${r.id}`);
  else seen.add(r.id);

  const target=performanceMap.get(r.assessmentId);
  if(!target) errors.push(`${file}: unknown performance assessment ${r.assessmentId}`);
  else if(String(target.version)!==String(r.assessmentVersion)) errors.push(`${file}: assessmentVersion ${r.assessmentVersion} does not match current ${target.version}`);

  if(!['draft','complete','invalidated'].includes(r.status)) errors.push(`${file}: invalid status ${r.status}`);
  for(const field of ['sampleCount','assessorCount','pairCount','unresolvedCriticalErrorDisagreements']){
    if(!Number.isInteger(r[field])||r[field]<0) errors.push(`${file}: ${field} must be a non-negative integer`);
  }
  for(const field of ['exactTotalScoreAgreement','criticalErrorAgreement']){
    if(r[field]!==null && r[field]!==undefined && (typeof r[field]!=='number'||r[field]<0||r[field]>1)) errors.push(`${file}: ${field} must be null or between 0 and 1`);
  }
  if(r.meanAbsoluteTotalScoreDifference!==null && r.meanAbsoluteTotalScoreDifference!==undefined && (typeof r.meanAbsoluteTotalScoreDifference!=='number'||r.meanAbsoluteTotalScoreDifference<0)) errors.push(`${file}: meanAbsoluteTotalScoreDifference must be null or non-negative`);
  if(!Array.isArray(r.domains)) errors.push(`${file}: domains must be an array`);

  if(r.status==='complete'){
    if(r.sampleCount<1) errors.push(`${file}: complete evidence requires sampleCount >= 1`);
    if(r.assessorCount<2) errors.push(`${file}: complete evidence requires at least two assessors`);
    if(r.pairCount<1) errors.push(`${file}: complete evidence requires at least one paired comparison`);
    if(typeof r.exactTotalScoreAgreement!=='number') errors.push(`${file}: complete evidence requires exactTotalScoreAgreement`);
    if(typeof r.meanAbsoluteTotalScoreDifference!=='number') errors.push(`${file}: complete evidence requires meanAbsoluteTotalScoreDifference`);
    if(typeof r.criticalErrorAgreement!=='number') errors.push(`${file}: complete evidence requires criticalErrorAgreement`);
    if(!r.completedAt || !Number.isFinite(Date.parse(r.completedAt))) errors.push(`${file}: complete evidence requires valid completedAt`);
  }
}

if(errors.length){
  console.error('Practical calibration evidence validation failed:');
  for(const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`Practical calibration evidence validation passed. ${calibration.length} record(s) checked against current performance-assessment versions.`);
