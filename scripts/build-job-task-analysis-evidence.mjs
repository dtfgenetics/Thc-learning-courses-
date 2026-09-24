import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const has=x=>args.includes(x);
const input=get('--input');
const write=has('--write');
const requestComplete=has('--complete');
if(!input) throw new Error('Usage: --input <PRIVATE-JTA-RATINGS.json> [--complete] [--write]');

const payload=JSON.parse(fs.readFileSync(path.resolve(root,input),'utf8'));
for(const k of ['credentialProgramId','panelId','analystId','populationDefinition']) if(!payload[k]) throw new Error(k+' is required');
if(!Array.isArray(payload.operatingContexts)||payload.operatingContexts.length===0) throw new Error('operatingContexts must be non-empty');
if(!Array.isArray(payload.reviewers)||payload.reviewers.length===0) throw new Error('reviewers must be non-empty');
const minimumRatingsPerTask=Number(payload.minimumRatingsPerTask??3);
if(!Number.isInteger(minimumRatingsPerTask)||minimumRatingsPerTask<2) throw new Error('minimumRatingsPerTask must be integer >=2');

const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const baseline=read('registry/public-occupational-source-baseline.json');
const programs=new Map(fs.readdirSync(path.join(root,'content/credential-programs')).filter(n=>n.endsWith('.json')&&n!=='registry.json').map(n=>{
  const p=JSON.parse(fs.readFileSync(path.join(root,'content/credential-programs',n),'utf8'));return[p.id,p];
}));
const program=programs.get(payload.credentialProgramId);if(!program)throw new Error('Unknown credential program '+payload.credentialProgramId);
const baseProgram=(baseline.programs??[]).find(x=>x.credentialProgramId===program.id);if(!baseProgram)throw new Error('No occupational baseline for '+program.id);
if(String(baseProgram.credentialProgramVersion)!==String(program.version))throw new Error('Occupational baseline uses stale program version');

const expected=new Map(baseProgram.taskFamilies.map(x=>[x.id,x]));
const seenReviewers=new Set();
const ratingsByTask=new Map([...expected.keys()].map(id=>[id,[]]));
let employerPerspectiveCount=0,cultivationRoleCount=0;

for(const [i,rev] of payload.reviewers.entries()){
  if(!rev||typeof rev!=='object') throw new Error('reviewers['+i+'] invalid');
  if(typeof rev.reviewerId!=='string'||!rev.reviewerId) throw new Error('reviewerId required');
  if(seenReviewers.has(rev.reviewerId))throw new Error('duplicate reviewerId '+rev.reviewerId);seenReviewers.add(rev.reviewerId);
  if(rev.employerPerspective===true)employerPerspectiveCount++;
  if(rev.cultivationRole===true)cultivationRoleCount++;
  if(!Array.isArray(rev.ratings))throw new Error(rev.reviewerId+': ratings required');
  const local=new Set();
  for(const r of rev.ratings){
    if(!expected.has(r.taskFamilyId))throw new Error(rev.reviewerId+': unknown task family '+r.taskFamilyId);
    if(local.has(r.taskFamilyId))throw new Error(rev.reviewerId+': duplicate rating '+r.taskFamilyId);local.add(r.taskFamilyId);
    for(const k of ['frequency','importance','criticality']){
      if(!Number.isInteger(r[k])||r[k]<1||r[k]>5)throw new Error(rev.reviewerId+': '+k+' must be integer 1..5');
    }
    if(typeof r.essential!=='boolean')throw new Error(rev.reviewerId+': essential must be boolean');
    if(!['keep','adapt','reject'].includes(r.disposition))throw new Error(rev.reviewerId+': invalid disposition');
    ratingsByTask.get(r.taskFamilyId).push(r);
  }
}

const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
const round=n=>Math.round(n*100)/100;
const taskFamilies=[...expected.values()].map(t=>{
  const rs=ratingsByTask.get(t.id);
  if(!rs.length) return {
    taskFamilyId:t.id,label:t.label,courseMappings:t.courseMappings,ratingsCount:0,
    frequencyMean:1,importanceMean:1,criticalityMean:1,essentialityRate:0,
    dispositionCounts:{keep:0,adapt:0,reject:0},consensusDisposition:'mixed',notes:'No usable ratings supplied.'
  };
  const counts={keep:0,adapt:0,reject:0};for(const r of rs)counts[r.disposition]++;
  const max=Math.max(counts.keep,counts.adapt,counts.reject);
  const winners=Object.entries(counts).filter(([,v])=>v===max).map(([k])=>k);
  return {
    taskFamilyId:t.id,label:t.label,courseMappings:t.courseMappings,ratingsCount:rs.length,
    frequencyMean:round(mean(rs.map(x=>x.frequency))),
    importanceMean:round(mean(rs.map(x=>x.importance))),
    criticalityMean:round(mean(rs.map(x=>x.criticality))),
    essentialityRate:round(rs.filter(x=>x.essential).length/rs.length),
    dispositionCounts:counts,
    consensusDisposition:winners.length===1?winners[0]:'mixed',
    notes:null
  };
});

const missing=(payload.missingTaskFamilies??[]).map((x,i)=>{
  if(!x.id||!/^JTA-ADD-[A-Z0-9-]+$/.test(x.id))throw new Error('missingTaskFamilies['+i+'].id invalid');
  if(!x.label||!x.rationale||!Array.isArray(x.proposedCourseMappings)||!x.proposedCourseMappings.length)throw new Error('missingTaskFamilies['+i+'] incomplete');
  const n=Number(x.reviewerSupportCount);if(!Number.isInteger(n)||n<1)throw new Error('missingTaskFamilies['+i+'].reviewerSupportCount invalid');
  return {id:x.id,label:x.label,rationale:x.rationale,proposedCourseMappings:x.proposedCourseMappings,reviewerSupportCount:n};
});

const coverageComplete=taskFamilies.every(x=>x.ratingsCount>=minimumRatingsPerTask);
const status=requestComplete&&coverageComplete?'complete':'preliminary';
const now=payload.completedAt??new Date().toISOString();
const safe=v=>String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const record={
  id:'JTA-'+safe(program.id.replace(/^CREDPROG-/,''))+'-'+safe(payload.panelId),
  credentialProgramId:program.id,
  credentialProgramVersion:String(program.version),
  status,
  baselineId:baseline.id,
  baselineAsOf:baseline.asOf,
  panel:{panelId:payload.panelId,respondentCount:payload.reviewers.length,employerPerspectiveCount,cultivationRoleCount,minimumRatingsPerTask},
  population:{definition:payload.populationDefinition,operatingContexts:payload.operatingContexts,jurisdictionNotes:payload.jurisdictionNotes??'Operating context and legal scope must be validated for intended jurisdictions.'},
  taskFamilies,
  missingTaskFamilies:missing,
  analystId:payload.analystId,
  recordedAt:now,
  summary:'Aggregate job-task-analysis evidence for '+program.id+'@'+program.version+' from panel '+payload.panelId+'; public occupational baseline '+baseline.id+' reviewed and cannabis-specific task ratings aggregated.',
  limitations:[
    'Reviewer identities and response-level ratings are excluded from repository evidence.',
    'Public O*NET/BLS sources are adjacent occupational evidence, not a substitute for cannabis cultivation SME/employer validation.',
    'A complete aggregate record does not itself approve occupational validation or the credential.'
  ]
};
if(requestComplete&&!coverageComplete){
  record.limitations.push('Completion requested but one or more baseline task families had fewer than '+minimumRatingsPerTask+' usable ratings; status remains preliminary.');
}
if(write){
  const dir=path.join(root,'content/job-task-analysis-evidence');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,record.id+'.json');if(fs.existsSync(file))throw new Error('Refusing to overwrite '+file);
  fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,participantLevelDataCommitted:false,coverageComplete,record},null,2));