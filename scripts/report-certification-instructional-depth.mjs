import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const exists=(p)=>fs.existsSync(path.join(root,p));
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

const courseIds=[
  ...Array.from({length:7},(_,i)=>`COURSE-LH-TECH1-${String(i+1).padStart(3,'0')}`),
  ...Array.from({length:8},(_,i)=>`COURSE-LH-TECH2-${String(i+1).padStart(3,'0')}`)
];

const appliedBlockTypes=new Set(['activity','scenario','steps','comparison','document','table']);
const rows=[];
const errors=[];

function lessonDepth(lesson){
  const content=lesson.content??{};
  const blocks=Array.isArray(content.blocks)?content.blocks:[];
  const sections=Array.isArray(content.sections)?content.sections:[];
  const explanationUnits=blocks.filter(b=>['text','callout','comparison','steps','document','table','scenario','activity'].includes(b?.type)).length+sections.length;
  const appliedFromBlocks=blocks.some(b=>appliedBlockTypes.has(b?.type));
  const workedExamples=Array.isArray(content.workedExamples)?content.workedExamples.length:0;
  const commonMistakes=Array.isArray(content.commonMistakes)?content.commonMistakes.length:0;
  const hasPracticalApplication=typeof content.practicalApplication==='string'&&content.practicalApplication.trim().length>0;
  return {
    objectives:(lesson.learningObjectives??lesson.objectives??[]).length,
    references:(lesson.references??[]).length,
    overview:Boolean(content.overview),
    summary:Boolean(content.summary),
    explanationUnits,
    workedExamples,
    commonMistakes,
    appliedPractice:appliedFromBlocks||workedExamples>0||hasPracticalApplication,
    troubleshootingOrMisconceptions:commonMistakes>0||blocks.some(b=>/mistake|troubleshoot|remediation|misconception/i.test(String(b?.title??''))),
    estimatedMinutes:Number(lesson.estimatedMinutes??0)
  };
}

for(const courseId of courseIds){
  const coursePath=`content/courses/${courseId}.json`;
  if(!exists(coursePath)){errors.push(`${courseId}: missing course object`);continue;}
  const course=read(coursePath);
  const moduleIds=course.modules??[];
  const lessonIds=[];
  for(const moduleId of moduleIds){
    const mp=`content/modules/${moduleId}.json`;
    if(!exists(mp)){errors.push(`${courseId}: missing module ${moduleId}`);continue;}
    const mod=read(mp);
    for(const lessonId of mod.lessons??[]) if(!lessonIds.includes(lessonId)) lessonIds.push(lessonId);
  }

  const lessonRows=[];
  for(const lessonId of lessonIds){
    const lp=`content/lessons/${lessonId}.json`;
    if(!exists(lp)){errors.push(`${courseId}: missing lesson ${lessonId}`);continue;}
    const lesson=read(lp);
    const d=lessonDepth(lesson);
    const issues=[];
    if(d.objectives===0)issues.push('no-objective');
    if(d.references===0)issues.push('no-references');
    if(!d.overview)issues.push('no-overview');
    if(!d.summary)issues.push('no-summary');
    if(d.explanationUnits===0)issues.push('no-explanatory-units');
    if(!d.appliedPractice)issues.push('no-applied-practice');
    if(issues.length)errors.push(...issues.map(issue=>`${lessonId}: ${issue}`));
    lessonRows.push({lessonId,...d,issues});
  }

  const objectiveIds=new Set(lessonRows.flatMap(r=>{
    const lesson=read(`content/lessons/${r.lessonId}.json`);
    return lesson.learningObjectives??lesson.objectives??[];
  }));

  const integrated=courseId==='COURSE-LH-TECH1-007'||courseId==='COURSE-LH-TECH2-008';
  let assessmentItems=0;
  let assessmentProvenance=false;
  if(integrated){
    const readinessId=course.extensions?.formativeReadinessAssessment;
    if(readinessId&&exists(`content/assessments/${readinessId}.json`)){
      const a=read(`content/assessments/${readinessId}.json`);
      assessmentItems=(a.items??[]).length;
      assessmentProvenance=a.extensions?.courseDerivedAssessment===true&&a.extensions?.encyclopediaSubstitutionAllowed===false&&a.extensions?.untaughtMaterialAllowed===false;
    }
  }else if(course.finalAssessment&&exists(`content/assessments/${course.finalAssessment}.json`)){
    const a=read(`content/assessments/${course.finalAssessment}.json`);
    assessmentItems=(a.items??[]).length;
    assessmentProvenance=a.extensions?.courseDerivedAssessment===true&&a.extensions?.encyclopediaSubstitutionAllowed===false&&a.extensions?.untaughtMaterialAllowed===false;
  }

  if(!assessmentProvenance)errors.push(`${courseId}: assessment provenance contract missing`);

  rows.push({
    courseId,
    title:course.title,
    status:course.status,
    modules:moduleIds.length,
    lessons:lessonRows.length,
    objectives:objectiveIds.size,
    estimatedMinutes:lessonRows.reduce((s,r)=>s+r.estimatedMinutes,0),
    lessonsWithReferences:lessonRows.filter(r=>r.references>0).length,
    lessonsWithExplanation:lessonRows.filter(r=>r.explanationUnits>0).length,
    lessonsWithAppliedPractice:lessonRows.filter(r=>r.appliedPractice).length,
    lessonsWithTroubleshootingOrMisconceptions:lessonRows.filter(r=>r.troubleshootingOrMisconceptions).length,
    lessonsWithWorkedExamples:lessonRows.filter(r=>r.workedExamples>0).length,
    assessmentItems,
    assessmentProvenance,
    lessonIssues:lessonRows.flatMap(r=>r.issues.map(issue=>({lessonId:r.lessonId,issue})))
  });
}

const summary={
  courses:rows.length,
  lessons:rows.reduce((s,r)=>s+r.lessons,0),
  estimatedMinutes:rows.reduce((s,r)=>s+r.estimatedMinutes,0),
  coursesWithAssessmentProvenance:rows.filter(r=>r.assessmentProvenance).length,
  lessonsWithAppliedPractice:rows.reduce((s,r)=>s+r.lessonsWithAppliedPractice,0),
  lessonsWithReferences:rows.reduce((s,r)=>s+r.lessonsWithReferences,0),
  structuralDepthErrors:errors.length
};

console.log(JSON.stringify({summary,rows,errors},null,2));
if(process.argv.includes('--check')&&errors.length)process.exitCode=1;
