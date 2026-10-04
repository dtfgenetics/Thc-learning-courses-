import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const getArg=(name)=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
const inputPath=getArg('--input');
const write=args.includes('--write');
const complete=args.includes('--complete');

if(!inputPath){
  console.error('Usage: node scripts/build-practical-calibration-evidence.mjs --input <private-paired-ratings.json> [--complete] [--write]');
  process.exit(1);
}
const absolute=path.resolve(root,inputPath);
if(!fs.existsSync(absolute)) throw new Error(`Calibration input not found: ${inputPath}`);
const payload=JSON.parse(fs.readFileSync(absolute,'utf8'));
if(typeof payload.assessmentId!=='string') throw new Error('assessmentId is required');
if(typeof payload.assessmentVersion!=='string') throw new Error('assessmentVersion is required');
if(typeof payload.calibrationId!=='string'||payload.calibrationId.length<3) throw new Error('calibrationId is required');
if(typeof payload.analystId!=='string'||payload.analystId.length<3) throw new Error('analystId is required');
if(!Array.isArray(payload.ratings)||payload.ratings.length<2) throw new Error('ratings must contain at least two rating records');

const perfDir=path.join(root,'content/performance-assessments');
const assessments=new Map(fs.readdirSync(perfDir).filter(n=>n.endsWith('.json')).map(n=>{
  const a=JSON.parse(fs.readFileSync(path.join(perfDir,n),'utf8'));
  return [a.id,a];
}));
const assessment=assessments.get(payload.assessmentId);
if(!assessment) throw new Error(`Unknown assessment ${payload.assessmentId}`);
if(String(assessment.version)!==String(payload.assessmentVersion)) throw new Error(`Input version ${payload.assessmentVersion} does not match current assessment version ${assessment.version}`);

for(const [i,r] of payload.ratings.entries()){
  if(typeof r.sampleId!=='string'||!r.sampleId) throw new Error(`ratings[${i}].sampleId is required`);
  if(typeof r.assessorId!=='string'||!r.assessorId) throw new Error(`ratings[${i}].assessorId is required`);
  if(!Number.isFinite(r.totalScore)||r.totalScore<0) throw new Error(`ratings[${i}].totalScore must be non-negative`);
  if(typeof r.criticalError!=='boolean') throw new Error(`ratings[${i}].criticalError must be boolean`);
  if(!r.domainScores||typeof r.domainScores!=='object'||Array.isArray(r.domainScores)) throw new Error(`ratings[${i}].domainScores must be an object`);
  for(const [name,value] of Object.entries(r.domainScores)){
    if(!name||!Number.isFinite(value)||value<0) throw new Error(`ratings[${i}].domainScores contains invalid value`);
  }
}

const bySample=new Map();
for(const r of payload.ratings){
  if(!bySample.has(r.sampleId)) bySample.set(r.sampleId,[]);
  bySample.get(r.sampleId).push(r);
}
const pairRows=[];
for(const [sampleId,ratings] of bySample){
  if(ratings.length<2) continue;
  for(let i=0;i<ratings.length;i++){
    for(let j=i+1;j<ratings.length;j++){
      const a=ratings[i],b=ratings[j];
      const domainNames=[...new Set([...Object.keys(a.domainScores),...Object.keys(b.domainScores)])].sort();
      const domains=domainNames.filter(n=>Number.isFinite(a.domainScores[n])&&Number.isFinite(b.domainScores[n])).map(n=>({
        domainName:n,
        difference:Math.abs(a.domainScores[n]-b.domainScores[n]),
        exact:a.domainScores[n]===b.domainScores[n]
      }));
      pairRows.push({
        sampleId,
        assessorA:a.assessorId,
        assessorB:b.assessorId,
        totalDifference:Math.abs(a.totalScore-b.totalScore),
        totalExact:a.totalScore===b.totalScore,
        criticalErrorAgreement:a.criticalError===b.criticalError,
        domains
      });
    }
  }
}
if(pairRows.length===0) throw new Error('No paired ratings were available; at least one sample must be independently scored by two assessors');

const mean=(values)=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
const proportion=(values)=>values.length?values.filter(Boolean).length/values.length:null;
const domainNames=[...new Set(pairRows.flatMap(p=>p.domains.map(d=>d.domainName)))].sort();
const domains=domainNames.map(domainName=>{
  const rows=pairRows.flatMap(p=>p.domains.filter(d=>d.domainName===domainName));
  return {
    domainName,
    pairCount:rows.length,
    exactAgreement:proportion(rows.map(r=>r.exact)),
    meanAbsoluteDifference:mean(rows.map(r=>r.difference))
  };
});
const assessorIds=[...new Set(payload.ratings.map(r=>r.assessorId))].sort();
const sampleIds=[...new Set(payload.ratings.map(r=>r.sampleId))].sort();
const unresolved=pairRows.filter(p=>!p.criticalErrorAgreement).length;

const record={
  id:`CAL-${payload.calibrationId.replace(/[^A-Z0-9-]/gi,'-').toUpperCase()}`,
  assessmentId:payload.assessmentId,
  assessmentVersion:String(payload.assessmentVersion),
  status:complete?'complete':'draft',
  sampleCount:sampleIds.length,
  assessorCount:assessorIds.length,
  pairCount:pairRows.length,
  exactTotalScoreAgreement:proportion(pairRows.map(p=>p.totalExact)),
  meanAbsoluteTotalScoreDifference:mean(pairRows.map(p=>p.totalDifference)),
  criticalErrorAgreement:proportion(pairRows.map(p=>p.criticalErrorAgreement)),
  unresolvedCriticalErrorDisagreements:unresolved,
  domains,
  assessorIds,
  sampleIds,
  analystId:payload.analystId,
  completedAt:complete?(payload.completedAt??new Date().toISOString()):null,
  notes:payload.notes??'Aggregated from paired assessor calibration ratings. Candidate/person-level material is not stored in the repository.',
  limitations:Array.isArray(payload.limitations)?payload.limitations:[]
};

if(write){
  const outDir=path.join(root,'content/calibration-evidence');
  fs.mkdirSync(outDir,{recursive:true});
  const target=path.join(outDir,`${record.id}.json`);
  if(fs.existsSync(target)) throw new Error(`Refusing to overwrite existing calibration evidence ${path.relative(root,target)}`);
  fs.writeFileSync(target,`${JSON.stringify(record,null,2)}\n`);
}
console.log(JSON.stringify({
  assessmentId:record.assessmentId,
  assessmentVersion:record.assessmentVersion,
  status:record.status,
  wroteFile:write,
  participantOrCandidateLevelDataCommitted:false,
  record
},null,2));
