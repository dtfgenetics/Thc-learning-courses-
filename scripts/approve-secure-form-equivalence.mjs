import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const has=x=>args.includes(x);
const write=has('--write');
const sourceId=get('--source');
const sourceFile=get('--source-file');
const authority=get('--authority');
const quantitativeStatus=get('--quantitative-status')??'preliminary';
const overlapRaw=get('--max-overlap');
const maxOverlap=overlapRaw===null?null:Number(overlapRaw);
const evidenceRefs=(get('--evidence-ref')??'').split(',').map(x=>x.trim()).filter(Boolean);

const requiredFlags=[
  '--confirm-private-items',
  '--confirm-blueprint-equivalence',
  '--confirm-cognitive-equivalence',
  '--confirm-critical-content-equivalence',
  '--confirm-scored-opportunity-equivalence',
  '--confirm-retest-review',
  '--confirm-private-store',
  '--confirm-answer-exclusion',
  '--confirm-exposure-tracking',
  '--confirm-quarantine'
];
if((!sourceId&&!sourceFile)||!authority) throw new Error('Usage: --source <FORMEQ-ID> or --source-file <path> --authority <id> '+requiredFlags.join(' ')+' [--quantitative-status preliminary|complete] [--max-overlap 0-1] [--evidence-ref id,id] [--write]');
for(const flag of requiredFlags) if(!has(flag)) throw new Error(flag+' is required for approval');
if(!['preliminary','complete'].includes(quantitativeStatus)) throw new Error('--quantitative-status must be preliminary or complete for approval');
if(maxOverlap!==null&&(!Number.isFinite(maxOverlap)||maxOverlap<0||maxOverlap>1)) throw new Error('--max-overlap must be between 0 and 1');

const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const source=sourceFile
  ? JSON.parse(fs.readFileSync(path.resolve(root,sourceFile),'utf8'))
  : readDir('content/secure-form-equivalence-evidence').find(x=>x.id===sourceId);
if(!source) throw new Error('Secure-form source record not found');
if(!['draft','evidence-complete'].includes(source.status)) throw new Error('Secure-form source must be draft or evidence-complete');

const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const assessments=new Map(readDir('content/assessments').map(x=>[x.id,x]));
const course=courses.get(source.courseId); const assessment=assessments.get(source.assessmentId);
if(!course||String(course.version)!==String(source.courseVersion)) throw new Error('Secure-form source is not current course version');
if(!assessment||String(assessment.version)!==String(source.assessmentVersion)) throw new Error('Secure-form source is not current assessment version');
if(!Array.isArray(source.forms)||source.forms.length<2) throw new Error('At least two forms are required');

const now=new Date().toISOString();
const record=structuredClone(source);
record.id=source.id+'-APPROVED-'+now.replace(/[-:.TZ]/g,'').slice(0,14);
record.status='approved';
record.forms=record.forms.map(f=>({...f,approvedOperationalItemsOnly:true,publicItemsExcluded:true}));
record.formCount=record.forms.length;
record.equivalenceReview={
  ...record.equivalenceReview,
  blueprintCoverageEquivalent:true,
  cognitiveDemandEquivalent:true,
  criticalContentRepresentationEquivalent:true,
  scoredOpportunityEquivalent:true,
  retestDuplicationReviewed:true,
  maximumObservedItemOverlapProportion:maxOverlap,
  quantitativeEvidenceStatus:quantitativeStatus,
  notes:record.equivalenceReview?.notes??null
};
record.securityReview={
  ...record.securityReview,
  privateStoreVerified:true,
  answerMaterialExcludedFromDelivery:true,
  exposureTrackingEnabled:true,
  quarantineWorkflowEnabled:true,
  notes:record.securityReview?.notes??null
};
record.authorityId=authority;
record.recordedAt=now;
record.summary='Approved secure operational form equivalence/security review derived from '+source.id+' for '+source.courseId+'@'+source.courseVersion+'.';
record.evidenceRefs=[...new Set([...(source.evidenceRefs??[]),...evidenceRefs,source.id])];
record.limitations=[...(source.limitations??[]),'Approval covers only the opaque form revisions/fingerprints and exact assessment version recorded here. No secure item content is stored in this repository.'];

if(write){
  const dir=path.join(root,'content/secure-form-equivalence-evidence');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,record.id+'.json');if(fs.existsSync(file))throw new Error('Refusing to overwrite '+file);
  fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record},null,2));
