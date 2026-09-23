import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const files=[
  ...Array.from({length:7},(_,i)=>`registry/course${i+1}-completion-status.json`),
  ...Array.from({length:8},(_,i)=>`registry/tech2-course${i+1}-completion-status.json`)
];
const deployments=read('registry/deployments.json').deployments??[];
const problems=[];
const rows=[];

for(const file of files){
  const d=read(file);
  const machine=d.nextMachineActions??[];
  if(d.machineResolvableWorkComplete===true && machine.length){
    problems.push(`${file}: machineResolvableWorkComplete=true but nextMachineActions is non-empty`);
  }
  if(d.machineResolvableWorkComplete===false && machine.length===0){
    problems.push(`${file}: machineResolvableWorkComplete=false but no nextMachineActions are recorded`);
  }
  const publicDeployment=deployments.some(x=>x.result==='success'&&(x.courseId===d.courseId||(x.courseIds??[]).includes(d.courseId)));
  rows.push({file,courseId:d.courseId,machineResolvableWorkComplete:d.machineResolvableWorkComplete,nextMachineActionCount:machine.length,publicDeploymentRecorded:publicDeployment});
}

const course1=rows.find(x=>x.courseId==='COURSE-LH-TECH1-001');
if(course1?.machineResolvableWorkComplete===false){
  const ledger=read(course1.file);
  const text=(ledger.nextMachineActions??[]).join(' ').toLowerCase();
  if(!text.includes('raster')&&!text.includes('deployment')&&!text.includes('route')){
    problems.push(`${course1.file}: open Course 1 machine work is not tied to deployment/raster/runtime verification`);
  }
}

const summary={
  ledgers:rows.length,
  machineComplete:rows.filter(x=>x.machineResolvableWorkComplete).length,
  machineOpen:rows.filter(x=>!x.machineResolvableWorkComplete).length,
  structuralProblems:problems,
  rows
};
console.log(JSON.stringify(summary,null,2));
if(process.argv.includes('--check')&&problems.length) process.exitCode=1;
