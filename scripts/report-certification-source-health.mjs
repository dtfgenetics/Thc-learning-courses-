import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const asJson=args.includes('--json');
const check=args.includes('--check');
const maxAgeDays=Number((()=>{const i=args.indexOf('--max-age-days');return i>=0?args[i+1]:730;})());
if(!Number.isFinite(maxAgeDays)||maxAgeDays<1) throw new Error('--max-age-days must be positive');

const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>read(path.join(rel,n)));};
const execution=read('registry/certification-validation-execution.json');
const supplements=read('registry/public-authoritative-source-supplements.json');
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const modules=new Map(readDir('content/modules').map(x=>[x.id,x]));
const lessons=new Map(readDir('content/lessons').map(x=>[x.id,x]));
const refs=new Map(readDir('content/references').map(x=>[x.id,x]));

const canonicalLessonIds=new Set();
for(const row of execution.courses??[]){
  const c=courses.get(row.courseId);
  for(const mid of c?.modules??[]){
    const mod=modules.get(mid);
    for(const lid of mod?.lessons??[]) canonicalLessonIds.add(lid);
  }
}
const used=new Set();
for(const lid of canonicalLessonIds){
  const l=lessons.get(lid);
  for(const id of l?.references??[]) used.add(id);
}
for(const m of supplements.mappings??[]) for(const id of m.sourceIds??[]) used.add(id);

const now=Date.now();
const rows=[...used].sort().map(id=>{
  const r=refs.get(id);
  if(!r) return {id,missing:true};
  const verifiedMs=r.lastVerifiedAt?Date.parse(r.lastVerifiedAt):NaN;
  const ageDays=Number.isFinite(verifiedMs)?Math.floor((now-verifiedMs)/86400000):null;
  const reviewed=['reviewed','reviewed-source'].includes(r.status);
  const https=typeof r.url==='string'&&r.url.startsWith('https://');
  return {
    id,title:r.title,status:r.status,evidenceLevel:r.evidenceLevel,type:r.type,
    publisher:r.publisher??null,url:r.url??null,lastVerifiedAt:r.lastVerifiedAt??null,
    sourceRevisionDate:r.sourceRevisionDate??null,
    verificationAgeDays:ageDays,
    reviewed,https,
    freshness:ageDays===null?'verification-not-recorded':ageDays>maxAgeDays?'refresh-due':'current'
  };
});
const structuralProblems=[];
for(const r of rows){
  if(r.missing) structuralProblems.push(r.id+': referenced source is missing');
  else{
    if(!r.reviewed) structuralProblems.push(r.id+': canonical source is not reviewed');
    if(!r.https) structuralProblems.push(r.id+': canonical source lacks HTTPS URL');
  }
}
const refreshQueue=rows.filter(r=>!r.missing&&r.freshness!=='current').map(r=>({
  id:r.id,title:r.title,lastVerifiedAt:r.lastVerifiedAt,verificationAgeDays:r.verificationAgeDays,reason:r.freshness
}));
const out={
  policy:{maxVerificationAgeDays:maxAgeDays,freshnessIsMaintenanceNotContentApproval:true},
  summary:{
    canonicalLessons:canonicalLessonIds.size,
    sourceIdsUsed:rows.length,
    reviewedSources:rows.filter(r=>r.reviewed).length,
    verifiedSources:rows.filter(r=>r.lastVerifiedAt).length,
    currentVerification:rows.filter(r=>r.freshness==='current').length,
    refreshQueue:refreshQueue.length,
    structuralProblems:structuralProblems.length
  },
  structuralProblems,
  refreshQueue,
  sources:rows
};
if(asJson) console.log(JSON.stringify(out,null,2));
else{
  console.log('Certification source provenance health');
  console.log('Canonical lessons: '+out.summary.canonicalLessons);
  console.log('Used source IDs: '+out.summary.sourceIdsUsed);
  console.log('Reviewed: '+out.summary.reviewedSources);
  console.log('Verification timestamp recorded: '+out.summary.verifiedSources);
  console.log('Refresh queue: '+out.summary.refreshQueue);
  console.log('Structural problems: '+out.summary.structuralProblems);
  if(refreshQueue.length){
    console.log('\nSource verification maintenance queue:');
    for(const r of refreshQueue) console.log('- '+r.id+': '+r.reason+(r.verificationAgeDays===null?'':' ('+r.verificationAgeDays+' days)'));
  }
}
if(check&&structuralProblems.length) process.exitCode=1;
