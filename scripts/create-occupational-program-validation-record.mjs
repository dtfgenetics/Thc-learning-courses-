import {argsMap,readDir,safe,writeRecord} from './lib/evidence-intake-utils.mjs';

const a=argsMap();
for(const k of ['program','authority']) if(!a[k]) throw new Error(`--${k} is required`);
const programs=new Map(readDir('content/credential-programs').filter(x=>x.id).map(x=>[x.id,x]));
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const performance=readDir('content/performance-assessments');
const program=programs.get(a.program); if(!program) throw new Error(`Unknown credential program ${a.program}`);
const requiredCourses=(program.requiredCourses??[]).map(id=>{const c=courses.get(id);if(!c)throw new Error(`Missing required course ${id}`);return c;});
const courseSet=new Set(requiredCourses.map(x=>x.id));
const performanceIds=new Set();
for(const c of requiredCourses){
  const ext=c.extensions??{};
  if(ext.mappedPractical) performanceIds.add(ext.mappedPractical);
  for(const x of ext.credentialPracticalSetRequired??[]) performanceIds.add(x);
  for(const x of ext.mappedPerformanceAssessments??[]) performanceIds.add(x);
  if(ext.capstoneRequired) performanceIds.add(ext.capstoneRequired);
}
for(const p of performance){
  const ext=p.extensions??{};
  const mappings=[...(ext.courseMappings??[]),...(ext.course?[ext.course]:[]),...(ext.integratedCourseId?[ext.integratedCourseId]:[]),...(p.integratedCourseId?[p.integratedCourseId]:[])];
  if(mappings.some(id=>courseSet.has(id))) performanceIds.add(p.id);
}
const mapped=performance.filter(x=>performanceIds.has(x.id));
const capstones=mapped.filter(x=>x.assessmentType==='capstone'||/^CAPSTONE-/.test(x.id));
const practicals=mapped.filter(x=>!capstones.includes(x));
const now=new Date().toISOString();
const record={
  id:`OCCVAL-${safe(program.id.replace(/^CREDPROG-/,''))}-${safe(program.version)}`,
  credentialProgramId:program.id,
  credentialProgramVersion:String(program.version),
  status:'in-progress',
  authorizedCourses:requiredCourses.map(c=>({courseId:c.id,courseVersion:String(c.version)})),
  technicalCurriculumReview:{
    allCurrentCourseVersionsReviewed:false,
    contentScopeAndRoleBoundariesReviewed:false,
    scientificTechnicalConcernsResolvedOrDispositioned:false,
    publicSourceReviewCompleted:false,
    sourceReviewRegistryId:null,
    sourceReviewRegistryAsOf:null,
    reviewerCount:null,
    notes:null
  },
  jobTaskAnalysis:{validated:false,populationDefined:false,taskDomainCoverageReviewed:false,currencyReviewed:false,notes:null},
  smeEmployerValidation:{completed:false,roleRepresentativenessReviewed:false,criticalTasksReviewed:false,scopeOfPracticeReviewed:false,panelistCount:null,notes:null},
  assessmentBlueprint:{weightsFinalized:false,competencyCoverageApproved:false,criticalContentRepresentationApproved:false,cognitiveDemandApproved:false,blueprintVersion:null,notes:null},
  performanceValidation:{
    required:mapped.length>0,
    practicalsExpected:practicals.length,
    practicalsValidated:0,
    capstoneRequired:capstones.length>0,
    capstoneValidated:false,
    criticalDecisionCoverageApproved:false,
    unresolvedCriticalIssues:0,
    notes:`Mapped current performance assessments: ${mapped.map(x=>x.id+'@'+x.version).join(', ')}`
  },
  authorityId:a.authority,
  recordedAt:now,
  summary:`Occupational program validation opened for ${program.id}@${program.version}; technical, JTA, SME/employer, blueprint and performance validation remain pending.`,
  evidenceRefs:[],
  limitations:['In-progress record only; no occupational validation approval is implied.']
};
writeRecord('content/occupational-program-validation-evidence',record,Boolean(a.write));
