import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const has=x=>args.includes(x);
const write=has('--write');
const confirm=has('--confirm-adopt');

const sourceId=get('--source');
const sourceFile=get('--source-file');
const decisionAuthority=get('--decision-authority');
const rationale=get('--rationale');
const productionCut=Number(get('--production-cut-percent'));
const evidenceRefs=(get('--evidence-ref')??'').split(',').map(x=>x.trim()).filter(Boolean);

if((!sourceId&&!sourceFile)||!decisionAuthority||!rationale||!Number.isFinite(productionCut)||productionCut<0||productionCut>100){
  throw new Error('Usage: --source <STDSET-ID> or --source-file <path> --production-cut-percent <0-100> --decision-authority <id> --rationale <text> --confirm-adopt [--evidence-ref id,id] [--write]');
}
if(!confirm) throw new Error('--confirm-adopt is required');

const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const source=sourceFile
  ? JSON.parse(fs.readFileSync(path.resolve(root,sourceFile),'utf8'))
  : readDir('content/standard-setting-evidence').find(x=>x.id===sourceId);
if(!source) throw new Error('Standard-setting source record not found');
if(source.status!=='panel-complete') throw new Error('Standard-setting source must have status=panel-complete');
if(source.performanceLevelDescriptionApproved!==true) throw new Error('Cannot adopt standard setting without approved performance-level description');
if(source.impactReview?.sensitivityReviewed!==true) throw new Error('Cannot adopt standard setting before sensitivity/impact review is completed');

const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const assessments=new Map(readDir('content/assessments').map(x=>[x.id,x]));
const course=courses.get(source.courseId); const assessment=assessments.get(source.assessmentId);
if(!course||String(course.version)!==String(source.courseVersion)) throw new Error('Standard-setting source is not current course version');
if(!assessment||String(assessment.version)!==String(source.assessmentVersion)) throw new Error('Standard-setting source is not current assessment version');
if((assessment.items??[]).length!==source.stableItemCount) throw new Error('Standard-setting source stable item count does not match current assessment');

const now=new Date().toISOString();
const record=structuredClone(source);
record.id=source.id+'-APPROVED-'+now.replace(/[-:.TZ]/g,'').slice(0,14);
record.status='approved';
record.governanceDecision={
  decision:'adopt',
  productionCutScorePercent:productionCut,
  decisionAuthority,
  decisionDate:now,
  rationale
};
record.recordedAt=now;
record.summary='Approved standard-setting decision derived from '+source.id+' for '+source.courseId+'@'+source.courseVersion+'; production cut score formally adopted.';
record.evidenceRefs=[...new Set([...(source.evidenceRefs??[]),...evidenceRefs,source.id])];
record.limitations=[...(source.limitations??[]),'Approval applies only to the exact course/assessment versions recorded here; later version changes require renewed review.'];

if(write){
  const dir=path.join(root,'content/standard-setting-evidence');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,record.id+'.json');if(fs.existsSync(file))throw new Error('Refusing to overwrite '+file);
  fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record},null,2));
