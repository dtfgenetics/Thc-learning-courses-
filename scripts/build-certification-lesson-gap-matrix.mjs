import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const write=process.argv.includes('--write');
const json=process.argv.includes('--json')||write;
const outPath=process.env.CERTIFICATION_LESSON_GAP_MATRIX_PATH||'registry/certification-lesson-gap-matrix.json';

const readJson=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=(p)=>fs.existsSync(path.join(root,p));
const canonical=[
  ...Array.from({length:7},(_,i)=>`COURSE-LH-TECH1-${String(i+1).padStart(3,'0')}`),
  ...Array.from({length:8},(_,i)=>`COURSE-LH-TECH2-${String(i+1).padStart(3,'0')}`)
];

const questionDir=path.join(root,'content/questions');
const questions=fs.readdirSync(questionDir)
  .filter(name=>name.endsWith('.json'))
  .map(name=>readJson(`content/questions/${name}`));

const objectiveItems=new Map();
for(const item of questions){
  if(!item?.objective) continue;
  if(!objectiveItems.has(item.objective)) objectiveItems.set(item.objective,[]);
  objectiveItems.get(item.objective).push({
    id:item.id,
    status:item.status,
    purpose:item.purpose,
    courseId:item.extensions?.courseId??null,
    version:item.version??null
  });
}

const measurementRx=/\b(measur|sensor|sample|reading|record|temperature|relative humidity|\brh\b|vpd|ppfd|dli|ph\b|\bec\b|ppm|water activity|moisture|weight|mass|volume|flow|pressure|time|duration|rate|percent|percentage|count|incidence|severity|uniformity|dryback|conductivity)\b/i;
const calculationRx=/\b(calculat|formula|equation|convert|conversion|compute|ratio|percentage|percent|average|mean|difference|delta|rate|area|volume|mass balance|uniformity|dli|vpd)\b|[%×÷=]/i;

function lessonIdsForCourse(course){
  const ids=[];
  for(const moduleId of course.modules??[]){
    const p=`content/modules/${moduleId}.json`;
    if(!exists(p)) continue;
    const mod=readJson(p);
    for(const lessonId of mod.lessons??[]) if(!ids.includes(lessonId)) ids.push(lessonId);
  }
  return ids;
}

function textOf(value){
  if(value==null) return '';
  if(typeof value==='string') return value;
  if(Array.isArray(value)) return value.map(textOf).join(' ');
  if(typeof value==='object') return Object.values(value).map(textOf).join(' ');
  return String(value);
}

function inspectLesson(courseId,lesson){
  const content=lesson.content??{};
  const blocks=Array.isArray(content.blocks)?content.blocks:[];
  const sections=Array.isArray(content.sections)?content.sections:[];
  const objectives=lesson.learningObjectives??lesson.objectives??[];
  const references=lesson.references??[];
  const images=blocks.filter(b=>b?.type==='image');
  const imageAltComplete=images.filter(b=>typeof b.alt==='string'&&b.alt.trim().length>=12).length;
  const scenarios=blocks.filter(b=>b?.type==='scenario').length;
  const resources=blocks.filter(b=>b?.type==='resource').length;
  const activities=blocks.filter(b=>['activity','steps','document'].includes(b?.type)).length;
  const tables=blocks.filter(b=>['table','comparison'].includes(b?.type)).length;
  const workedExamples=Array.isArray(content.workedExamples)?content.workedExamples.length:0;
  const commonMistakes=Array.isArray(content.commonMistakes)?content.commonMistakes.length:0;
  const practicalApplication=typeof content.practicalApplication==='string'&&content.practicalApplication.trim().length>0;
  const appliedPractice=practicalApplication||workedExamples>0||scenarios>0||activities>0;
  const body=textOf(content);
  const measurementSignal=measurementRx.test(body);
  const calculationSignal=calculationRx.test(body);

  const objectiveCoverage=objectives.map(objectiveId=>{
    const items=(objectiveItems.get(objectiveId)??[]).filter(item=>item.courseId===courseId);
    return {
      objectiveId,
      itemCount:items.length,
      summativeItems:items.filter(item=>item.purpose==='summative').length,
      formativeItems:items.filter(item=>item.purpose!=='summative').length,
      items:items.map(item=>item.id)
    };
  });
  const unassessedObjectives=objectiveCoverage.filter(row=>row.itemCount===0).map(row=>row.objectiveId);

  const issues=[];
  const actions=[];
  const add=(issue,action)=>{issues.push(issue);actions.push(action);};
  if(objectives.length===0) add('no-objectives','Add measurable learning objectives tied to canonical competencies.');
  if(references.length===0) add('no-direct-references','Add direct references and applicability limits for meaningful scientific/technical claims.');
  if(!content.overview) add('no-overview','Add a concise learner orientation explaining why the lesson matters.');
  if(sections.length===0&&!blocks.some(b=>['text','callout','comparison','steps','document','table'].includes(b?.type))) add('thin-explanation','Add structured mechanism/process explanation.');
  if(!content.summary) add('no-summary','Add a bounded takeaway/verification summary.');
  if(!appliedPractice) add('no-applied-practice','Add a realistic application, activity, worked example, or scenario.');
  if(workedExamples===0) add('no-worked-examples','Add at least one worked example when the lesson includes a decision, measurement, workflow, or interpretation skill.');
  if(commonMistakes===0) add('no-common-mistakes','Add realistic mistakes, misconceptions, or interpretation traps.');
  if(scenarios===0) add('no-scenario-block','Add a realistic decision/escalation scenario where the topic involves judgment.');
  if(images.length===0) add('no-instructional-visual','Review whether a diagram, comparison plate, measurement map, workflow, or other teaching visual is warranted.');
  if(images.length>imageAltComplete) add('visual-alt-gap','Complete meaningful alt text for every instructional image.');
  if(unassessedObjectives.length) add('unassessed-objective','Map every lesson objective to at least one course-owned assessment item or explicitly document why it is practice-only.');

  let priorityScore=0;
  for(const issue of issues){
    priorityScore+=({
      'no-objectives':12,
      'no-direct-references':12,
      'no-overview':5,
      'thin-explanation':10,
      'no-summary':5,
      'no-applied-practice':10,
      'no-worked-examples':4,
      'no-common-mistakes':4,
      'no-scenario-block':3,
      'no-instructional-visual':4,
      'visual-alt-gap':8,
      'unassessed-objective':12
    })[issue]??1;
  }

  return {
    courseId,
    lessonId:lesson.id,
    title:lesson.title,
    version:String(lesson.version??''),
    status:lesson.status??null,
    estimatedMinutes:Number(lesson.estimatedMinutes??0),
    competencies:lesson.competencies??[],
    objectives,
    references:references.length,
    teaching:{
      overview:Boolean(content.overview),
      sections:sections.length,
      blocks:blocks.length,
      workedExamples,
      commonMistakes,
      practicalApplication,
      scenarios,
      activities,
      tables,
      resources
    },
    visuals:{
      images:images.length,
      imagesWithMeaningfulAlt:imageAltComplete,
      altCoverage:images.length?Number((imageAltComplete/images.length).toFixed(3)):null
    },
    applicationSignals:{
      measurement:measurementSignal,
      calculation:calculationSignal,
      appliedPractice
    },
    assessmentCoverage:objectiveCoverage,
    unassessedObjectives,
    issues:[...new Set(issues)],
    recommendedActions:[...new Set(actions)],
    priorityScore
  };
}

const rows=[];
const courseSummary=[];
for(const courseId of canonical){
  const coursePath=`content/courses/${courseId}.json`;
  if(!exists(coursePath)) continue;
  const course=readJson(coursePath);
  const lessonRows=[];
  for(const lessonId of lessonIdsForCourse(course)){
    const lessonPath=`content/lessons/${lessonId}.json`;
    if(!exists(lessonPath)) continue;
    const row=inspectLesson(courseId,readJson(lessonPath));
    rows.push(row);
    lessonRows.push(row);
  }
  courseSummary.push({
    courseId,
    title:course.title,
    lessons:lessonRows.length,
    issueCount:lessonRows.reduce((n,row)=>n+row.issues.length,0),
    lessonsWithIssues:lessonRows.filter(row=>row.issues.length).length,
    priorityScore:lessonRows.reduce((n,row)=>n+row.priorityScore,0),
    lessonsWithVisuals:lessonRows.filter(row=>row.visuals.images>0).length,
    lessonsWithWorkedExamples:lessonRows.filter(row=>row.teaching.workedExamples>0).length,
    lessonsWithScenarios:lessonRows.filter(row=>row.teaching.scenarios>0).length,
    lessonsWithCommonMistakes:lessonRows.filter(row=>row.teaching.commonMistakes>0).length,
    lessonsWithMeasurementSignals:lessonRows.filter(row=>row.applicationSignals.measurement).length,
    lessonsWithCalculationSignals:lessonRows.filter(row=>row.applicationSignals.calculation).length,
    lessonsWithUnassessedObjectives:lessonRows.filter(row=>row.unassessedObjectives.length).length
  });
}

rows.sort((a,b)=>b.priorityScore-a.priorityScore||a.courseId.localeCompare(b.courseId)||a.lessonId.localeCompare(b.lessonId));
courseSummary.sort((a,b)=>b.priorityScore-a.priorityScore||a.courseId.localeCompare(b.courseId));

const matrix={
  schemaVersion:1,
  id:'CERTIFICATION-LESSON-GAP-MATRIX-001',
  generatedAt:new Date().toISOString(),
  scope:{
    canonicalCourses:canonical,
    expectedCourseCount:15,
    expectedLessonCount:284,
    encyclopediaIncluded:false
  },
  interpretation:{
    priorityScore:'Internal production-priority signal only; it is not a credential-validity score or external quality rating.',
    measurementSignal:'Text-pattern indicator used to find measurement-heavy lessons for deeper review.',
    calculationSignal:'Text-pattern indicator used to find calculation/data lessons for deeper review.',
    releaseBoundary:'A row with no detected gaps is not automatically scientifically, accessibility, assessment, or credential approved.'
  },
  summary:{
    courses:courseSummary.length,
    lessons:rows.length,
    lessonsWithIssues:rows.filter(row=>row.issues.length).length,
    totalIssueSignals:rows.reduce((n,row)=>n+row.issues.length,0),
    lessonsWithVisuals:rows.filter(row=>row.visuals.images>0).length,
    lessonsWithWorkedExamples:rows.filter(row=>row.teaching.workedExamples>0).length,
    lessonsWithScenarios:rows.filter(row=>row.teaching.scenarios>0).length,
    lessonsWithCommonMistakes:rows.filter(row=>row.teaching.commonMistakes>0).length,
    lessonsWithUnassessedObjectives:rows.filter(row=>row.unassessedObjectives.length).length
  },
  courseSummary,
  lessons:rows
};

if(matrix.summary.courses!==15) throw new Error(`Expected 15 canonical courses, found ${matrix.summary.courses}`);
if(matrix.summary.lessons!==284) throw new Error(`Expected 284 canonical lessons, found ${matrix.summary.lessons}`);

if(write){
  fs.writeFileSync(path.join(root,outPath),JSON.stringify(matrix,null,2)+'\n');
  console.error(`Wrote ${outPath}`);
}

if(json){
  console.log(JSON.stringify(matrix,null,2));
}else{
  console.log('# Certification Lesson Gap Matrix\n');
  console.log(`Scope: ${matrix.summary.courses} canonical courses / ${matrix.summary.lessons} lessons. Encyclopedia excluded.\n`);
  console.log('| Course | Lessons | Lessons with gaps | Priority | Visuals | Worked examples | Scenarios | Mistakes | Unassessed objectives |');
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for(const row of courseSummary){
    console.log(`| ${row.courseId} | ${row.lessons} | ${row.lessonsWithIssues} | ${row.priorityScore} | ${row.lessonsWithVisuals} | ${row.lessonsWithWorkedExamples} | ${row.lessonsWithScenarios} | ${row.lessonsWithCommonMistakes} | ${row.lessonsWithUnassessedObjectives} |`);
  }
  console.log('\nHighest-priority lesson rows:\n');
  for(const row of rows.slice(0,40)){
    console.log(`- ${row.lessonId} (priority ${row.priorityScore}): ${row.issues.join(', ')||'no detected production gaps'}`);
  }
}
