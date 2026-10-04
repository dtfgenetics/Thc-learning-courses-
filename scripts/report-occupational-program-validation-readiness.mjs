import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const readDir=(rel)=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const programs=readDir('content/credential-programs').filter(x=>['CREDPROG-CULT-TECH-I-001','CREDPROG-CULT-TECH-II-001'].includes(x.id));
const evidence=readDir('content/occupational-program-validation-evidence');
const rows=programs.map(p=>{
  const latest=evidence.filter(e=>e.credentialProgramId===p.id&&String(e.credentialProgramVersion)===String(p.version)&&e.status!=='invalidated').sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0]??null;
  return {credentialProgramId:p.id,credentialProgramVersion:p.version,requiredCourses:(p.requiredCourses??[]).length,occupationalValidation:latest?{
    id:latest.id,status:latest.status,recordedAt:latest.recordedAt,
    jtaValidated:latest.jobTaskAnalysis?.validated??false,
    smeEmployerValidated:latest.smeEmployerValidation?.completed??false,
    blueprintWeightsFinalized:latest.assessmentBlueprint?.weightsFinalized??false,
    practicalsValidated:latest.performanceValidation?.practicalsValidated??0,
    practicalsExpected:latest.performanceValidation?.practicalsExpected??0,
    capstoneValidated:latest.performanceValidation?.capstoneValidated??false
  }:{status:'missing'}};
});
console.log(JSON.stringify({summary:{programs:rows.length,approved:rows.filter(r=>r.occupationalValidation.status==='approved').length},programs:rows},null,2));
