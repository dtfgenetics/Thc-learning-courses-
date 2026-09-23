import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const args=process.argv.slice(2);
const has=x=>args.includes(x);
const value=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=has('--write');
const asJson=has('--json');
const outDir=path.resolve(root,value('--out')??'generated/standard-secure-operator-kits');

const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>read(path.join(rel,n)));};
const runJson=(script,args=[])=>JSON.parse(execFileSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'}));

const registry=read('registry/certification-validation-execution.json');
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const assessments=new Map(readDir('content/assessments').map(x=>[x.id,x]));
const programs=readDir('content/credential-programs').filter(x=>x.id);
const queue=runJson('scripts/report-certification-execution-work-queue.mjs',['--json']);

function programFor(courseId){return programs.find(p=>(p.requiredCourses??[]).includes(courseId))??null;}
function queueItem(courseId,gate){return queue.all.find(x=>x.scope==='course'&&x.courseId===courseId&&x.gate===gate)??null;}

const kits=[];
for(const row of registry.courses.filter(x=>x.conventionalFinal)){
  const course=courses.get(row.courseId);
  const assessment=assessments.get(row.finalAssessmentId);
  const program=programFor(row.courseId);
  if(!course||!assessment||!program) throw new Error('Missing canonical mapping for '+row.courseId);

  const standardQueue=queueItem(row.courseId,'standardSetting');
  const secureQueue=queueItem(row.courseId,'secureOperationalFormReadiness');

  kits.push({
    id:'KIT-STDSEC-'+course.id.replace(/^COURSE-/,''),
    courseId:course.id,
    courseVersion:String(course.version),
    assessmentId:assessment.id,
    assessmentVersion:String(assessment.version),
    credentialProgramId:program.id,
    credentialProgramVersion:String(program.version),
    itemCount:(assessment.items??[]).length,
    standardSetting:{
      executionState:standardQueue?.executionState??'closed',
      dependencies:standardQueue?.dependencies??[],
      startCommand:'npm run evidence:intake:standard-setting -- --course '+course.id+' --method modified-angoff --panelists <N> --raw-score <N> --percent <0-100> --authority <PANEL-LEAD> [--pld-approved] [--sensitivity-reviewed] [--pilot-sample-size N] [--estimated-pass-rate 0-1] [--rounding-rule text] --write',
      requiredActions:[
        'Confirm the exact current final and item versions are stable before panel work begins.',
        'Use an approved minimally-qualified-performance/performance-level description.',
        'Train panelists on the selected standard-setting method and record panel composition.',
        'Collect independent item judgments before discussion and controlled rounds.',
        'Document the recommended raw/percent cut score plus rounding rule.',
        'Review pilot impact/sensitivity where usable data exist.',
        'Keep panel recommendation separate from governance adoption.'
      ]
    },
    secureForms:{
      executionState:secureQueue?.executionState??'closed',
      dependencies:secureQueue?.dependencies??[],
      startCommand:'npm run evidence:intake:secure-form -- --course '+course.id+' --authority <ASSESSMENT-SECURITY-LEAD> --blueprint-version <VERSION> --form "<OPAQUE-ID>|<REV>|<COUNT>|<FINGERPRINT>" --form "<OPAQUE-ID>|<REV>|<COUNT>|<FINGERPRINT>" --write',
      requiredActions:[
        'Use only approved private operational items from the secure item store.',
        'Never commit secure items, answer keys, raw private manifests, or store credentials.',
        'Record only opaque form IDs/revisions, item counts and manifest fingerprints in this repository.',
        'Compare blueprint coverage, cognitive demand, critical content and scored opportunity.',
        'Review retest overlap and quantitative equivalence only when sufficient data exist.',
        'Verify private-store, answer-material exclusion, exposure tracking and quarantine workflows before approval.'
      ]
    }
  });
}

function md(k){
  const lines=[
    '# Standard Setting & Secure Form Operator Kit — '+k.courseId,'',
    'Course: '+k.courseId+'@'+k.courseVersion,
    'Final: '+k.assessmentId+'@'+k.assessmentVersion+' ('+k.itemCount+' items)',
    'Credential program: '+k.credentialProgramId+'@'+k.credentialProgramVersion,'',
    '## Standard setting','',
    'Execution state: '+k.standardSetting.executionState,'',
    'Blocked dependencies:'
  ];
  if(k.standardSetting.dependencies.length) lines.push(...k.standardSetting.dependencies.map(d=>'- '+d.gate+' = '+d.status));
  else lines.push('- none');
  lines.push('','Start after panel recommendation exists:','', '    '+k.standardSetting.startCommand,'','Required actions:','',...k.standardSetting.requiredActions.map(x=>'- [ ] '+x),'','## Secure operational form equivalence','',
    'Execution state: '+k.secureForms.executionState,'','Blocked dependencies:');
  if(k.secureForms.dependencies.length) lines.push(...k.secureForms.dependencies.map(d=>'- '+d.gate+' = '+d.status));
  else lines.push('- none');
  lines.push('','Start when at least two real private forms exist:','', '    '+k.secureForms.startCommand,'','Required actions:','',...k.secureForms.requiredActions.map(x=>'- [ ] '+x),'','## Integrity boundary','',
    'This kit follows the live dependency-aware queue. A blocked state means evidence should not be promoted. The intake commands create panel-complete or draft evidence only; they do not approve a production cut score or secure operational forms.','');
  return lines.join('\n');
}

const counts={
  kits:kits.length,
  standardReady:kits.filter(k=>['ready','ready-for-approval'].includes(k.standardSetting.executionState)).length,
  standardBlocked:kits.filter(k=>k.standardSetting.executionState==='blocked').length,
  secureReady:kits.filter(k=>['ready','ready-for-approval'].includes(k.secureForms.executionState)).length,
  secureBlocked:kits.filter(k=>k.secureForms.executionState==='blocked').length
};
if(write){
  fs.mkdirSync(outDir,{recursive:true});
  for(const k of kits){
    fs.writeFileSync(path.join(outDir,k.id+'.json'),JSON.stringify(k,null,2)+'\n');
    fs.writeFileSync(path.join(outDir,k.id+'.md'),md(k));
  }
}
const out={summary:counts,wroteFiles:write,outputDirectory:path.relative(root,outDir),kits:kits.map(k=>({id:k.id,courseId:k.courseId,standardSettingState:k.standardSetting.executionState,secureFormState:k.secureForms.executionState}))};
if(asJson) console.log(JSON.stringify(out,null,2)); else console.log('Standard/secure operator kits: '+kits.length);
