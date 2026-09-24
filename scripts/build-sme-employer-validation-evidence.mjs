import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const has=x=>args.includes(x);
const input=get('--input'),jtaSourceFile=get('--jta-source-file');
const write=has('--write'),requestComplete=has('--complete');
if(!input) throw new Error('Usage: --input <PRIVATE-SME-VALIDATION.json> [--jta-source-file <JTA.json>] [--complete] [--write]');

const payload=JSON.parse(fs.readFileSync(path.resolve(root,input),'utf8'));
for(const k of ['credentialProgramId','panelId','analystId']) if(!payload[k]) throw new Error(k+' is required');
if(!Array.isArray(payload.reviewers)||payload.reviewers.length===0) throw new Error('reviewers must be non-empty');
const min=Number(payload.minimumRatingsPerTask??3);
if(!Number.isInteger(min)||min<2) throw new Error('minimumRatingsPerTask must be integer >=2');

const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const programs=new Map(readDir('content/credential-programs').filter(x=>x.id).map(x=>[x.id,x]));
const program=programs.get(payload.credentialProgramId);if(!program)throw new Error('Unknown credential program '+payload.credentialProgramId);
const jtas=jtaSourceFile?[JSON.parse(fs.readFileSync(path.resolve(root,jtaSourceFile),'utf8'))]:readDir('content/job-task-analysis-evidence');
const jta=jtas.filter(x=>x.credentialProgramId===program.id&&String(x.credentialProgramVersion)===String(program.version)&&x.status==='complete').sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0];
if(!jta) throw new Error('No complete current JTA evidence exists for '+program.id+'@'+program.version);

const expected=new Map((jta.taskFamilies??[]).map(x=>[x.taskFamilyId,x]));
const byTask=new Map([...expected.keys()].map(id=>[id,[]]));
const seen=new Set();let employerCount=0,currentRoleCount=0;
const claimCounts={representative:0,'too-broad':0,'too-narrow':0,unclear:0};

for(const [i,rev] of payload.reviewers.entries()){
  if(!rev?.reviewerId)throw new Error('reviewers['+i+'].reviewerId required');
  if(seen.has(rev.reviewerId))throw new Error('duplicate reviewerId '+rev.reviewerId);seen.add(rev.reviewerId);
  if(rev.employerPerspective===true)employerCount++;
  if(rev.currentCultivationRole===true)currentRoleCount++;
  if(!['representative','too-broad','too-narrow','unclear'].includes(rev.occupationalClaimDisposition))throw new Error(rev.reviewerId+': invalid occupationalClaimDisposition');
  claimCounts[rev.occupationalClaimDisposition]++;
  if(!Array.isArray(rev.taskReviews))throw new Error(rev.reviewerId+': taskReviews required');
  const local=new Set();
  for(const tr of rev.taskReviews){
    if(!expected.has(tr.taskFamilyId))throw new Error(rev.reviewerId+': unknown task family '+tr.taskFamilyId);
    if(local.has(tr.taskFamilyId))throw new Error(rev.reviewerId+': duplicate task review '+tr.taskFamilyId);local.add(tr.taskFamilyId);
    for(const k of ['credentialLevelFit','criticalTask','scopeBoundaryClear'])if(typeof tr[k]!=='boolean')throw new Error(rev.reviewerId+': '+k+' must be boolean');
    if(!['keep','adapt','remove'].includes(tr.disposition))throw new Error(rev.reviewerId+': invalid disposition');
    byTask.get(tr.taskFamilyId).push(tr);
  }
}

const round=n=>Math.round(n*100)/100;
const taskFamilyReviews=[...expected.keys()].map(id=>{
  const rs=byTask.get(id);
  if(!rs.length)return{taskFamilyId:id,ratingsCount:0,credentialLevelFitRate:null,criticalTaskRate:null,scopeBoundaryClearRate:null,dispositionCounts:{keep:0,adapt:0,remove:0},consensusDisposition:'mixed',notes:'No usable ratings supplied.'};
  const counts={keep:0,adapt:0,remove:0};for(const r of rs)counts[r.disposition]++;
  const max=Math.max(counts.keep,counts.adapt,counts.remove),wins=Object.entries(counts).filter(([,v])=>v===max).map(([k])=>k);
  return{
    taskFamilyId:id,ratingsCount:rs.length,
    credentialLevelFitRate:round(rs.filter(x=>x.credentialLevelFit).length/rs.length),
    criticalTaskRate:round(rs.filter(x=>x.criticalTask).length/rs.length),
    scopeBoundaryClearRate:round(rs.filter(x=>x.scopeBoundaryClear).length/rs.length),
    dispositionCounts:counts,consensusDisposition:wins.length===1?wins[0]:'mixed',notes:null
  };
});

const boundary=payload.scopeBoundaryReview??{};
const boundaryKeys=['pesticideAuthorityExplicit','maintenanceAuthorityExplicit','medicalDiagnosisExcluded','finalProductDispositionExcluded','personnelManagementExcludedWhereNotClaimed','legalJurisdictionBoundaryExplicit'];
for(const k of boundaryKeys)if(typeof boundary[k]!=='boolean')throw new Error('scopeBoundaryReview.'+k+' must be boolean');

const coverage=taskFamilyReviews.every(x=>x.ratingsCount>=min);
const perspectives=employerCount>0&&currentRoleCount>0;
const complete=requestComplete&&coverage&&perspectives&&boundaryKeys.every(k=>boundary[k]===true);
const now=payload.completedAt??new Date().toISOString();
const safe=v=>String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const n=payload.reviewers.length;
const record={
  id:'SMEVAL-'+safe(program.id.replace(/^CREDPROG-/,''))+'-'+safe(payload.panelId),
  credentialProgramId:program.id,credentialProgramVersion:String(program.version),
  status:complete?'complete':'preliminary',jtaEvidenceId:jta.id,jtaEvidenceRecordedAt:jta.recordedAt,
  panel:{panelId:payload.panelId,respondentCount:n,employerPerspectiveCount:employerCount,currentCultivationRoleCount:currentRoleCount,minimumRatingsPerTask:min},
  occupationalClaimReview:{
    ratingsCount:n,representativeCount:claimCounts.representative,tooBroadCount:claimCounts['too-broad'],tooNarrowCount:claimCounts['too-narrow'],unclearCount:claimCounts.unclear,
    representativeRate:n?round(claimCounts.representative/n):null
  },
  taskFamilyReviews,scopeBoundaryReview:boundary,analystId:payload.analystId,recordedAt:now,
  summary:'Aggregate SME/employer validation evidence for '+program.id+'@'+program.version+' using complete JTA '+jta.id+'.',
  limitations:[
    'Reviewer identities and response-level ratings are excluded from repository evidence.',
    'Complete evidence means the defined review was collected; it does not independently approve the occupational program or credential.',
    'Jurisdiction-specific regulated activities still require applicable legal and organizational review.'
  ]
};
if(requestComplete&&!complete)record.limitations.push('Completion requested but minimum task ratings, panel perspective coverage, or explicit scope-boundary confirmations were incomplete; status remains preliminary.');
if(write){const d=path.join(root,'content/sme-employer-validation-evidence');fs.mkdirSync(d,{recursive:true});const f=path.join(d,record.id+'.json');if(fs.existsSync(f))throw new Error('Refusing to overwrite '+f);fs.writeFileSync(f,JSON.stringify(record,null,2)+'\n');}
console.log(JSON.stringify({wroteFile:write,responseLevelDataCommitted:false,coverageComplete:coverage,perspectiveCoverageComplete:perspectives,record},null,2));