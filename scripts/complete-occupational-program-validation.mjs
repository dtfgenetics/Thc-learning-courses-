import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;},has=x=>args.includes(x),write=has('--write');
const sourceId=get('--source'),sourceFile=get('--source-file'),authority=get('--authority');
const reviewerCount=Number(get('--reviewer-count')),panelistCount=Number(get('--panelist-count')),blueprintVersion=get('--blueprint-version');
if((!sourceId&&!sourceFile)||!authority||!Number.isInteger(reviewerCount)||reviewerCount<1||!Number.isInteger(panelistCount)||panelistCount<1||!blueprintVersion) throw new Error('Usage requires source, authority, reviewer-count>=1, panelist-count>=1, blueprint-version and all completion confirmations');
const flags=['--confirm-current-courses','--confirm-source-review','--confirm-public-occupational-baseline','--confirm-role-boundaries','--confirm-technical-disposition','--confirm-jta','--confirm-population','--confirm-task-coverage','--confirm-currency','--confirm-sme','--confirm-role-representativeness','--confirm-critical-tasks','--confirm-scope','--confirm-blueprint-weights','--confirm-competency-coverage','--confirm-critical-content','--confirm-cognitive-demand','--confirm-performance-validation','--confirm-critical-decision-coverage'];
for(const f of flags) if(!has(f)) throw new Error(f+' is required');
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const source=sourceFile?JSON.parse(fs.readFileSync(path.resolve(root,sourceFile),'utf8')):readDir('content/occupational-program-validation-evidence').find(x=>x.id===sourceId);
if(!source) throw new Error('Occupational validation source not found');
if(!['draft','in-progress'].includes(source.status)) throw new Error('Source must be draft/in-progress');
const programs=new Map(readDir('content/credential-programs').filter(x=>x.id).map(x=>[x.id,x])),courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const sourceRegistry=JSON.parse(fs.readFileSync(path.join(root,'registry/public-authoritative-source-supplements.json'),'utf8'));
const occupationalBaseline=JSON.parse(fs.readFileSync(path.join(root,'registry/public-occupational-source-baseline.json'),'utf8'));
const program=programs.get(source.credentialProgramId);if(!program||String(program.version)!==String(source.credentialProgramVersion))throw new Error('Stale credential program version');
const jtaRows=readDir('content/job-task-analysis-evidence')
  .filter(x=>x.credentialProgramId===program.id&&String(x.credentialProgramVersion)===String(program.version)&&x.status==='complete'&&x.baselineId===occupationalBaseline.id&&String(x.baselineAsOf)===String(occupationalBaseline.asOf))
  .sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt));
const currentJta=jtaRows[0]??null;
if(!currentJta) throw new Error('No complete current job-task-analysis evidence exists for '+program.id+'@'+program.version+' and '+occupationalBaseline.id);
for(const lock of source.authorizedCourses??[]){const c=courses.get(lock.courseId);if(!c||String(c.version)!==String(lock.courseVersion))throw new Error('Stale course lock '+lock.courseId);}
const expected=source.performanceValidation?.practicalsExpected??0;
const now=new Date().toISOString(),record=structuredClone(source);
record.id=source.id+'-COMPLETE-'+now.replace(/[-:.TZ]/g,'').slice(0,14);record.status='evidence-complete';record.authorityId=authority;record.recordedAt=now;
record.technicalCurriculumReview={
  ...record.technicalCurriculumReview,
  allCurrentCourseVersionsReviewed:true,
  contentScopeAndRoleBoundariesReviewed:true,
  scientificTechnicalConcernsResolvedOrDispositioned:true,
  publicSourceReviewCompleted:true,
  sourceReviewRegistryId:sourceRegistry.id,
  sourceReviewRegistryAsOf:sourceRegistry.asOf,
  reviewerCount
};
record.jobTaskAnalysis={
  ...record.jobTaskAnalysis,
  validated:true,
  populationDefined:true,
  taskDomainCoverageReviewed:true,
  currencyReviewed:true,
  publicOccupationalSourceReviewCompleted:true,
  occupationalSourceBaselineId:occupationalBaseline.id,
  occupationalSourceBaselineAsOf:occupationalBaseline.asOf,
  notes:'Validated against aggregate JTA evidence '+currentJta.id+'; '+(record.jobTaskAnalysis?.notes??'')
};
record.smeEmployerValidation={...record.smeEmployerValidation,completed:true,roleRepresentativenessReviewed:true,criticalTasksReviewed:true,scopeOfPracticeReviewed:true,panelistCount};
record.assessmentBlueprint={...record.assessmentBlueprint,weightsFinalized:true,competencyCoverageApproved:true,criticalContentRepresentationApproved:true,cognitiveDemandApproved:true,blueprintVersion};
record.performanceValidation={...record.performanceValidation,practicalsValidated:expected,capstoneValidated:record.performanceValidation?.capstoneRequired===true?true:record.performanceValidation?.capstoneValidated,criticalDecisionCoverageApproved:true,unresolvedCriticalIssues:0};
record.summary='Evidence-complete occupational program validation derived from '+source.id+' for '+source.credentialProgramId+'@'+source.credentialProgramVersion+'.';
record.evidenceRefs=[...new Set([...(source.evidenceRefs??[]),source.id,sourceRegistry.id,occupationalBaseline.id,currentJta.id])];record.limitations=[...(source.limitations??[]),'Evidence-complete does not itself constitute final program approval or credential authorization.'];
if(write){const d=path.join(root,'content/occupational-program-validation-evidence');const f=path.join(d,record.id+'.json');if(fs.existsSync(f))throw new Error('Refusing overwrite');fs.writeFileSync(f,JSON.stringify(record,null,2)+'\n');}
console.log(JSON.stringify({wroteFile:write,record},null,2));