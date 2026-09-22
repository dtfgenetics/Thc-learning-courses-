import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

const courseStatusPaths=[
  ...Array.from({length:7},(_,i)=>`registry/course${i+1}-completion-status.json`),
  ...Array.from({length:8},(_,i)=>`registry/tech2-course${i+1}-completion-status.json`)
];

const courses=courseStatusPaths.map((file)=>{
  const row=read(file);
  return {
    file,
    courseId:row.courseId,
    academicPublication:row.academicPublication??row.publicAcademicPackage??null,
    machineResolvableWorkComplete:row.machineResolvableWorkComplete===true,
    goldStandardPackageComplete:row.goldStandardPackageComplete===true,
    certificationEvidenceValidated:row.certificationEvidenceValidated===true,
    machineActions:row.nextMachineActions??[],
    humanActions:row.nextHumanActions??[]
  };
});

const readiness=read('registry/system-readiness.json');
const tech1=read('registry/technician-i-release-evidence.json');
const tech2=read('registry/technician-ii-release-evidence.json');\nconst programRegistry=read('content/credential-programs/registry.json');

const falseSystemGates=[];
for(const [areaName,area] of Object.entries(readiness.areas??{})){
  for(const [gate,value] of Object.entries(area.gates??{})){
    if(value===false) falseSystemGates.push({area:areaName,gate});
  }
}

const unresolvedCredentialGates=(record)=>Object.entries(record.gates??{})
  .filter(([,state])=>!['approved','complete','completed','validated','ready','active'].includes(String(state).toLowerCase()))
  .map(([gate,state])=>({gate,state}));

const machineActions=courses.flatMap((c)=>c.machineActions.map((action)=>({courseId:c.courseId,action})));
const humanActions=courses.flatMap((c)=>c.humanActions.map((action)=>({courseId:c.courseId,action})));

const dedupe=(rows,key)=>[...new Map(rows.map((row)=>[key(row),row])).values()];
const machineUnique=dedupe(machineActions,(x)=>x.action);
const humanUnique=dedupe(humanActions,(x)=>x.action);

const output={
  generatedFrom:'canonical repository state',
  productionReady:readiness.productionReady===true,
  courseSummary:{
    total:courses.length,
    machineComplete:courses.filter((c)=>c.machineResolvableWorkComplete).length,
    machineOpen:courses.filter((c)=>!c.machineResolvableWorkComplete).length,
    goldStandardComplete:courses.filter((c)=>c.goldStandardPackageComplete).length,
    certificationEvidenceValidated:courses.filter((c)=>c.certificationEvidenceValidated).length
  },
  openMachineActions:machineUnique,
  openHumanActions:humanUnique,
  openSystemGates:falseSystemGates,
  technicianI:{
    releaseReady:tech1.releaseReady===true,
    unresolvedGates:unresolvedCredentialGates(tech1)
  },
  technicianII:{
    releaseReady:tech2.releaseReady===true,
    unresolvedGates:unresolvedCredentialGates(tech2)
  },
  priorities:[
    'produce and release-QA governed raster replacements',
    'complete deployed responsive/manual accessibility and learner-surface QA',
    'repair defects exposed by deployed QA',
    'complete real version-specific technical, assessment and accessibility review evidence',
    'collect controlled pilot, practical, capstone, calibration and inter-rater evidence',
    'perform formal standard setting and finalize decision rules',
    'deploy and validate production persistence, authorization, issuer/signing, revocation, backup/restore and monitoring controls',
    'record explicit versioned final program release approval only after prerequisite evidence closes'
  ]
};

if(process.argv.includes('--json')) process.stdout.write(JSON.stringify(output,null,2)+'\n');
else{
  console.log('THC Academy finalization status');
  console.log(`Courses: ${output.courseSummary.total}; machine-complete ${output.courseSummary.machineComplete}; machine-open ${output.courseSummary.machineOpen}`);
  console.log(`Open system gates: ${output.openSystemGates.length}`);
  console.log(`Technician I unresolved release gates: ${output.technicianI.unresolvedGates.length}`);
  console.log(`Technician II unresolved release gates: ${output.technicianII.unresolvedGates.length}`);
  console.log('');
  console.log('Machine priorities:');
  output.priorities.slice(0,3).forEach((x,i)=>console.log(`${i+1}. ${x}`));
  console.log('');
  console.log('Use --json for the complete live queue.');
}
