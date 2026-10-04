import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const run=(script,args=[])=>JSON.parse(execFileSync(process.execPath,[script,...args],{encoding:'utf8'}));
const reconciled=run('scripts/report-certification-evidence-reconciliation.mjs',['--json']);
const finalization=run('scripts/report-finalization-status.mjs',['--json']);
const system=JSON.parse(fs.readFileSync('registry/system-readiness.json','utf8'));
const tech1=JSON.parse(fs.readFileSync('registry/technician-i-release-evidence.json','utf8'));
const tech2=JSON.parse(fs.readFileSync('registry/technician-ii-release-evidence.json','utf8'));
const matrix=fs.readFileSync('docs/CERTIFICATION-COMPLETION-MATRIX.md','utf8');

if(reconciled.canonicalCourses!==15) throw new Error('authoritative reconciler must cover exactly 15 canonical courses');
if(!reconciled.gateSummary?.occupationalProgramValidation) throw new Error('authoritative reconciler must include occupationalProgramValidation');
if(finalization.authoritativeCertificationReleaseReady!==reconciled.allCoursesReleaseReady) throw new Error('finalization report disagrees with authoritative reconciler');
if(finalization.courseSummary.reconciledReleaseReadyCourses!==reconciled.releaseReadyCourses) throw new Error('finalization course release-ready count disagrees with reconciler');

const boundary=String(system.readinessScope?.credentialReleaseBoundary??'');
if(!boundary.includes('certification evidence reconciler')) throw new Error('system readiness must identify certification evidence reconciler as authority');
if(/release evidence ledgers remain authoritative/i.test(boundary)) throw new Error('system readiness still falsely declares legacy release ledgers authoritative');

for(const ledger of [tech1,tech2]){
  if(ledger.authorityStatus!=='supporting-legacy-program-checklist') throw new Error(`${ledger.id} must be marked supporting-only`);
  if(ledger.authoritativeReadinessSource!=='scripts/report-certification-evidence-reconciliation.mjs') throw new Error(`${ledger.id} missing authoritative reconciler pointer`);
  if(ledger.releaseReady===true && reconciled.allCoursesReleaseReady!==true) throw new Error(`${ledger.id} cannot claim release-ready while authoritative reconciler is blocked`);
}
if(!matrix.includes('live certification evidence reconciler')) throw new Error('completion matrix must point readers to live certification evidence reconciler');

console.log('Certification readiness authority and truthfulness: PASS');
