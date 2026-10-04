import {argsMap,readDir,int,safe,writeRecord} from './lib/evidence-intake-utils.mjs';

const a=argsMap();
for(const k of ['course','pilot-id','cohorts','participants','authority']) if(!a[k]) throw new Error(`--${k} is required`);
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const course=courses.get(a.course); if(!course) throw new Error(`Unknown course ${a.course}`);
const conventional=Boolean(course.finalAssessment);
const perf=course.extensions??{};
const performanceRequired=Boolean(perf.mappedPractical||perf.capstoneRequired||(perf.credentialPracticalSetRequired??[]).length||(perf.mappedPerformanceAssessments??[]).length);
const now=new Date().toISOString();
const record={
  id:`PILOTEXEC-${safe(course.id.replace(/^COURSE-/,''))}-${safe(a['pilot-id'])}`,
  courseId:course.id,
  courseVersion:String(course.version),
  status:'collecting',
  pilotId:a['pilot-id'],
  cohortCount:int(a.cohorts,'--cohorts',1),
  participantCount:int(a.participants,'--participants',1),
  knowledgeEvidence:{
    required:conventional,
    itemEvidenceComplete:false,
    currentItemVersionsOnly:false,
    itemsExpected:null,
    itemsWithCompleteEvidence:null,
    notes:'Pilot opened; item-level evidence is not complete yet.'
  },
  performanceEvidence:{
    required:performanceRequired,
    executionCompleted:false,
    currentAssessmentVersionsOnly:false,
    tasksExpected:null,
    tasksExecuted:null,
    notes:'Pilot opened; performance execution evidence is not complete yet.'
  },
  fairnessAccessibilityEvidence:{
    reviewed:false,
    materialIssuesResolvedOrDispositioned:false,
    notes:'Review not yet complete.'
  },
  learnerFeedbackCollected:false,
  dataQualityReviewed:false,
  stopCriteriaTriggered:false,
  stopCriteriaDisposition:null,
  authorityId:a.authority,
  recordedAt:now,
  summary:`Controlled pilot execution opened for ${course.id}@${course.version}; completion evidence remains pending.`,
  evidenceRefs:[],
  limitations:['This collecting-state record does not establish pilot completion or approval.']
};
writeRecord('content/course-pilot-execution-evidence',record,Boolean(a.write));
