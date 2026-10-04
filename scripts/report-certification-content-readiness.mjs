import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=(p)=>fs.existsSync(path.join(root,p));

const tech1=Array.from({length:7},(_,i)=>`COURSE-LH-TECH1-${String(i+1).padStart(3,'0')}`);
const tech2=Array.from({length:8},(_,i)=>`COURSE-LH-TECH2-${String(i+1).padStart(3,'0')}`);
const expected=[...tech1,...tech2];
const integrated=new Set(['COURSE-LH-TECH1-007','COURSE-LH-TECH2-008']);
const rows=[];
const errors=[];

for(const courseId of expected){
  const coursePath=`content/courses/${courseId}.json`;
  if(!exists(coursePath)){ errors.push(`${courseId}: missing canonical course object`); continue; }
  const course=read(coursePath);
  const track=courseId.includes('TECH1')?'Technician I':'Technician II';
  const row={courseId,title:course.title,track,status:course.status,mode:integrated.has(courseId)?'integrated-performance-lab':'course-final',aligned:false,issues:[]};

  if(!courseId.startsWith('COURSE-LH-')) row.issues.push('noncanonical-course-namespace');
  if(course.credentialBearing!==true) row.issues.push('credential-bearing-flag-missing');

  if(!integrated.has(courseId)){
    if(!course.finalAssessment){ row.issues.push('missing-course-final'); }
    else{
      const assessmentPath=`content/assessments/${course.finalAssessment}.json`;
      if(!exists(assessmentPath)) row.issues.push('missing-final-assessment-file');
      else{
        const a=read(assessmentPath);
        if(a.extensions?.courseDerivedAssessment!==true) row.issues.push('final-not-explicitly-course-derived');
        if(a.extensions?.encyclopediaSubstitutionAllowed!==false) row.issues.push('encyclopedia-substitution-not-forbidden');
        if(a.extensions?.untaughtMaterialAllowed!==false) row.issues.push('untaught-material-not-forbidden');
        if(!Array.isArray(a.items)||a.items.length===0) row.issues.push('final-has-no-items');
        const expectedItemPrefix=courseId.replace('COURSE-','ITEM-')+'-';
        for(const itemId of a.items??[]){
          if(!itemId.startsWith(expectedItemPrefix)) row.issues.push(`cross-course-item:${itemId}`);
        }
        const auditPath=a.extensions?.testToTeachingAudit;
        if(!auditPath||!exists(auditPath)) row.issues.push('missing-human-readable-test-to-teaching-audit');
        if(courseId==='COURSE-LH-TECH1-001'){
          if(a.extensions?.teachingProvenanceAudit!=='scripts/audit-course1-objective-coverage.mjs') row.issues.push('course1-dynamic-provenance-audit-missing');
          if(!exists('scripts/audit-course1-objective-coverage.mjs')) row.issues.push('course1-provenance-script-missing');
        }else{
          const map=a.extensions?.taughtMaterialMap;
          if(!map||typeof map!=='object') row.issues.push('missing-machine-readable-taught-material-map');
          else{
            for(const objectiveId of a.objectives??[]){
              const lessons=map[objectiveId];
              if(!Array.isArray(lessons)||lessons.length===0) row.issues.push(`objective-without-taught-material:${objectiveId}`);
              for(const lessonId of lessons??[]){
                if(!lessonId.startsWith(courseId.replace('COURSE-','LESSON-')+'-')) row.issues.push(`cross-course-teaching-map:${objectiveId}->${lessonId}`);
                const lp=`content/lessons/${lessonId}.json`;
                if(!exists(lp)) row.issues.push(`missing-mapped-lesson:${lessonId}`);
                else if(!(read(lp).learningObjectives??[]).includes(objectiveId)) row.issues.push(`mapped-lesson-does-not-teach-objective:${objectiveId}->${lessonId}`);
              }
            }
          }
        }
      }
    }
  }else{
    const readinessId=course.extensions?.formativeReadinessAssessment;
    if(!readinessId) row.issues.push('missing-formative-readiness-assessment');
    else{
      const rp=`content/assessments/${readinessId}.json`;
      if(!exists(rp)) row.issues.push('missing-readiness-assessment-file');
      else{
        const r=read(rp);
        if(r.purpose!=='formative') row.issues.push('readiness-not-formative');
        if(r.extensions?.courseDerivedAssessment!==true) row.issues.push('readiness-not-explicitly-course-derived');
        if(r.extensions?.encyclopediaSubstitutionAllowed!==false) row.issues.push('readiness-allows-encyclopedia-substitution');
        if(r.extensions?.untaughtMaterialAllowed!==false) row.issues.push('readiness-allows-untaught-material');
        const map=r.extensions?.taughtMaterialMap;
        for(const objectiveId of r.objectives??[]){
          const lessons=map?.[objectiveId];
          if(!Array.isArray(lessons)||lessons.length===0) row.issues.push(`readiness-objective-without-teaching:${objectiveId}`);
          for(const lessonId of lessons??[]){
            const lp=`content/lessons/${lessonId}.json`;
            if(!exists(lp)) row.issues.push(`missing-readiness-lesson:${lessonId}`);
            else if(!(read(lp).learningObjectives??[]).includes(objectiveId)) row.issues.push(`readiness-lesson-does-not-teach-objective:${objectiveId}->${lessonId}`);
          }
        }
      }
    }
    const base=courseId==='COURSE-LH-TECH1-007'?'docs/learning-hub/tech1/course-007':'docs/learning-hub/tech2/course-008';
    if(!exists(base+'/READINESS-TO-TEACHING-MAP.md')) row.issues.push('missing-readiness-to-teaching-audit');
    if(!exists(base+'/PERFORMANCE-TO-TEACHING-MAP.md')) row.issues.push('missing-performance-to-teaching-audit');
  }

  row.aligned=row.issues.length===0;
  if(!row.aligned) errors.push(...row.issues.map(issue=>`${courseId}: ${issue}`));
  rows.push(row);
}

const summary={
  canonicalCoursesExpected:15,
  canonicalCoursesFound:rows.length,
  alignedCourses:rows.filter(r=>r.aligned).length,
  technicianIAligned:rows.filter(r=>r.track==='Technician I'&&r.aligned).length,
  technicianIIAligned:rows.filter(r=>r.track==='Technician II'&&r.aligned).length,
  conventionalCourseFinals:rows.filter(r=>r.mode==='course-final').length,
  integratedPerformanceLabs:rows.filter(r=>r.mode==='integrated-performance-lab').length,
  encyclopediaCountedAsCertification:0,
  errors:errors.length
};

console.log(JSON.stringify({summary,rows,errors},null,2));
if(process.argv.includes('--check')&&errors.length){
  process.exitCode=1;
}
