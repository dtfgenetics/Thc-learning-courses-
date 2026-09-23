import {argsMap,readDir,int,safe,writeRecord} from './lib/evidence-intake-utils.mjs';

const a=argsMap();
for(const k of ['course','build','reviewer','platform','browser','input','viewport']) if(!a[k]) throw new Error(`--${k} is required`);
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const course=courses.get(a.course); if(!course) throw new Error(`Unknown course ${a.course}`);
const now=new Date().toISOString();
const coverage={courseOverview:false,lessons:false,instructionalVisuals:false,assessments:false,downloads:false,progressCompletionStates:false,mobileResponsive:false,keyboard:false,assistiveTechnology:false,zoomReflow:false};
const record={
  id:`A11YREV-${safe(course.id.replace(/^COURSE-/,''))}-${safe(a.build)}-${safe(now.slice(0,10))}`,
  courseId:course.id,
  courseVersion:String(course.version),
  deployedBuildId:a.build,
  status:'in-progress',
  reviewerId:a.reviewer,
  reviewedAt:now,
  wcagTarget:'2.2-AA',
  environments:[{
    platform:a.platform,
    browser:a.browser,
    assistiveTechnology:a.at??null,
    inputMode:a.input,
    viewportOrZoom:a.viewport
  }],
  coverage,
  unresolvedFailures:int(a['known-failures']??'0','--known-failures',0),
  levelAAFailuresResolvedOrDispositioned:false,
  issueRefs:[],
  evidenceRefs:[],
  summary:`Rendered accessibility/learner-UX review opened for ${course.id}@${course.version} on deployed build ${a.build}; coverage remains incomplete.`,
  limitations:['In-progress review record; zero known failures does not mean review is complete.']
};
writeRecord('content/accessibility-review-evidence',record,Boolean(a.write));
