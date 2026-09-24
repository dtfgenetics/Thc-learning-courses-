import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const runJson=(script,args=[])=>JSON.parse(execFileSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'}));

const courseStatusPaths=[
  ...Array.from({length:7},(_,i)=>`registry/course${i+1}-completion-status.json`),
  ...Array.from({length:8},(_,i)=>`registry/tech2-course${i+1}-completion-status.json`)
];

const courses=courseStatusPaths.map((file)=>{
  const row=read(file);
  return {
    file,
    courseId:row.courseId,
    academicPublication:row.academicPublication??row.publicAcademicPackage??row.publicAcademicRelease??null,
    machineResolvableWorkComplete:row.machineResolvableWorkComplete===true,
    goldStandardPackageComplete:row.goldStandardPackageComplete===true,
    certificationEvidenceValidated:row.certificationEvidenceValidated===true,
    machineActions:row.nextMachineActions??[],
    humanActions:row.nextHumanActions??[]
  };
});

const readiness=read('registry/system-readiness.json');
const reconciled=runJson('scripts/report-certification-evidence-reconciliation.mjs',['--json']);
const occupational=runJson('scripts/report-occupational-program-validation-readiness.mjs');
const humanEvidence=runJson('scripts/report-human-evidence-readiness.mjs');
const standardSecure=runJson('scripts/report-standard-secure-readiness.mjs');
const credentialAuth=runJson('scripts/report-credential-authorization-readiness.mjs');
const productionEvidence=runJson('scripts/report-production-evidence-reconciliation.mjs');
const releaseDependencies=runJson('scripts/report-certification-release-dependencies.mjs',['--json']);
const executionQueue=runJson('scripts/report-certification-execution-work-queue.mjs',['--json']);
const executionReadiness=read('registry/certification-validation-execution-readiness.json');
const sourceHealth=runJson('scripts/report-certification-source-health.mjs',['--json']);
const occupationalSourceBaseline=runJson('scripts/build-public-occupational-source-baseline.mjs',['--json']);

const falseSystemGates=[];
for(const [areaName,area] of Object.entries(readiness.areas??{})){
  for(const [gate,value] of Object.entries(area.gates??{})){
    if(value===false) falseSystemGates.push({area:areaName,gate});
  }
}

const machineActions=courses.flatMap((c)=>c.machineActions.map((action)=>({courseId:c.courseId,action})));
const humanActions=courses.flatMap((c)=>c.humanActions.map((action)=>({courseId:c.courseId,action})));
const dedupe=(rows,key)=>[...new Map(rows.map((row)=>[key(row),row])).values()];

const gateStates={};
for(const [gate,counts] of Object.entries(reconciled.gateSummary??{})){
  gateStates[gate]=counts;
}
const openEvidenceGates=Object.entries(gateStates)
  .filter(([,counts])=>Object.entries(counts).some(([state,count])=>state!=='approved'&&state!=='not-applicable'&&count>0))
  .map(([gate,counts])=>({gate,counts}));

const output={
  generatedFrom:'live certification evidence reconciliation plus canonical repository state',
  productionReady:readiness.productionReady===true,
  authoritativeCertificationReleaseReady:reconciled.allCoursesReleaseReady===true,
  courseSummary:{
    total:courses.length,
    machineComplete:courses.filter((c)=>c.machineResolvableWorkComplete).length,
    machineOpen:courses.filter((c)=>!c.machineResolvableWorkComplete).length,
    goldStandardPackageComplete:courses.filter((c)=>c.goldStandardPackageComplete).length,
    legacyCertificationEvidenceValidatedFlags:courses.filter((c)=>c.certificationEvidenceValidated).length,
    reconciledReleaseReadyCourses:reconciled.releaseReadyCourses,
    canonicalCourses:reconciled.canonicalCourses
  },
  openMachineActions:dedupe(machineActions,(x)=>x.action),
  openHumanActions:dedupe(humanActions,(x)=>x.action),
  openSystemGates:falseSystemGates,
  certificationEvidence:{
    structuralProblems:reconciled.structuralProblems,
    gateSummary:gateStates,
    openEvidenceGates
  },
  programEvidence:{
    occupationalProgramValidation:occupational.summary,
    pilotAndAccessibility:humanEvidence.summary,
    standardSettingAndSecureForms:standardSecure.summary,
    credentialAuthorization:credentialAuth.summary,
    productionControls:productionEvidence.summary,
    releaseDependencies:releaseDependencies.summary,
    executionWorkQueue:executionQueue.summary,
    validationCampaignPreparation:executionReadiness.summary,
    sourceProvenance:sourceHealth.summary,
    occupationalSourceBaseline:{
      baselineId:occupationalSourceBaseline.baselineId,
      baselineAsOf:occupationalSourceBaseline.baselineAsOf,
      programPackets:occupationalSourceBaseline.packetCount,
      programs:occupationalSourceBaseline.programs
    }
  },
  sourceProvenance:{
    structuralProblems:sourceHealth.structuralProblems,
    sourceReviewQueue:sourceHealth.sourceReviewQueue,
    refreshQueue:sourceHealth.refreshQueue
  },
  priorities:[
    'close any remaining repository structural/evidence/source-integrity defects reported by the certification, production and source-provenance reconcilers',
    'use the public occupational-source baseline plus exact-version course source packets during real cannabis-specific JTA/SME technical review',
    'complete real exact-version human assessment, technical/occupational and accessibility review evidence in dependency-safe order',
    'execute controlled pilots and practical/capstone validation/calibration, then analyze item and inter-rater evidence',
    'perform formal standard setting and secure operational form equivalence/security review',
    'approve candidate governance, privacy/retention, issuer/signing/revocation and production controls',
    'record explicit final credential-program authorization only after every prerequisite evidence gate is approved'
  ],
  authority:{
    certificationReleaseView:'scripts/report-certification-evidence-reconciliation.mjs',
    planningRegistry:'registry/certification-validation-execution.json',
    legacyCourseCompletionLedgers:'supporting package/work queues only; not authoritative for certification release',
    legacyTechnicianReleaseLedgers:'supporting historical/program checklists only; must not override exact-version reconciled evidence'
  }
};

if(process.argv.includes('--json')) process.stdout.write(JSON.stringify(output,null,2)+'\n');
else{
  console.log('THC Academy finalization status');
  console.log(`Canonical certification courses: ${output.courseSummary.canonicalCourses}; release-ready ${output.courseSummary.reconciledReleaseReadyCourses}`);
  console.log(`Authoritative certification release ready: ${output.authoritativeCertificationReleaseReady?'YES':'NO'}`);
  console.log(`Open certification evidence gates: ${output.certificationEvidence.openEvidenceGates.length}`);
  console.log(`Open system/infrastructure gates: ${output.openSystemGates.length}`);
  console.log(`Validation waves prepared: ${output.programEvidence.validationCampaignPreparation.wavesPrepared}/${output.programEvidence.validationCampaignPreparation.waves}; human/field evidence complete: ${output.programEvidence.validationCampaignPreparation.humanOrFieldEvidenceComplete}`);
  console.log(`Source structural problems: ${output.sourceProvenance.structuralProblems.length}; source-review queue: ${output.sourceProvenance.sourceReviewQueue.length}; verification refresh queue: ${output.sourceProvenance.refreshQueue.length}`);
  if(output.certificationEvidence.structuralProblems.length){
    console.log('Structural evidence problems:');
    for(const p of output.certificationEvidence.structuralProblems) console.log(`- ${p}`);
  }
  console.log('');
  console.log('Current priorities:');
  output.priorities.slice(0,4).forEach((x,i)=>console.log(`${i+1}. ${x}`));
  console.log('');
  console.log('Use --json for the complete evidence-derived queue.');
}
