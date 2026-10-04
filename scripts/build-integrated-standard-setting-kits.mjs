import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const args=process.argv.slice(2);
const has=x=>args.includes(x);
const value=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=has('--write');
const asJson=has('--json');
const outDir=path.resolve(root,value('--out')??'generated/integrated-standard-setting-kits');

const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>read(path.join(rel,n)));};
const queue=JSON.parse(execFileSync(process.execPath,['scripts/report-certification-execution-work-queue.mjs','--json'],{cwd:root,encoding:'utf8'}));
const courses=readDir('content/courses').filter(c=>!c.finalAssessment&&c.extensions?.standardSettingRequired===true);
const performance=new Map(readDir('content/performance-assessments').map(x=>[x.id,x]));
const existing=readDir('content/integrated-performance-standard-setting-evidence');

function idsFor(c){
  const e=c.extensions??{};
  return [...new Set([...(e.credentialPracticalSetRequired??[]),...(e.mappedPerformanceAssessments??[]),...(e.capstoneRequired?[e.capstoneRequired]:[])])];
}
const kits=courses.map(c=>{
  const ids=idsFor(c);
  const components=ids.map(id=>{const a=performance.get(id);if(!a)throw new Error('Missing performance assessment '+id);return {id,version:String(a.version),assessmentType:a.assessmentType,currentProvisionalMinimumPercent:a.passingStandard?.minimumPercent??null};});
  const work=queue.all.find(x=>x.courseId===c.id&&x.gate==='standardSetting')??null;
  const latest=existing.filter(x=>x.courseId===c.id&&String(x.courseVersion)===String(c.version)&&x.status!=='invalidated').sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0]??null;
  return {
    id:'KIT-IPSTD-'+c.id.replace(/^COURSE-/,''),
    courseId:c.id,courseVersion:String(c.version),
    executionState:work?.executionState??'closed',
    dependencies:work?.dependencies??[],
    latestEvidence:latest?{id:latest.id,status:latest.status,method:latest.method,panelistCount:latest.panelistCount}:{status:'missing'},
    components,
    panelIntakeCommand:'npm run evidence:intake:integrated-standard-setting -- --course '+c.id+' --panelists <N> --authority <PANEL-LEAD> '+components.map(x=>'--component "'+x.id+'|<PANEL-RECOMMENDED-PERCENT>"').join(' ')+' --write',
    approvalCommand:'npm run evidence:approve:integrated-standard-setting -- --source <IPSTDSET-ID> --decision-authority <GOVERNANCE-AUTHORITY> --rationale "<RATIONALE>" '+components.map(x=>'--component "'+x.id+'|<ADOPTED-PERCENT>"').join(' ')+' --confirm-all-components-pass --confirm-no-critical-errors --confirm-noncompensatory --confirm-adopt --write',
    actions:[
      'Do not begin panel recommendation until the dependency-aware queue marks standard setting ready.',
      'Use the exact current practical/capstone versions listed in this kit.',
      'Panel-recommended thresholds must come from real standard-setting work; do not copy provisional thresholds by default.',
      'Governance must explicitly adopt every component threshold and the non-compensatory/no-critical-error decision rule.',
      'Any later component version change invalidates the exact-version standard-setting evidence.'
    ]
  };
});

function md(k){
  const lines=[
    '# Integrated Performance Standard-Setting Kit — '+k.courseId,'',
    'Course: '+k.courseId+'@'+k.courseVersion,
    'Execution state: '+k.executionState,
    'Latest evidence: '+(k.latestEvidence.id?(k.latestEvidence.id+' / '+k.latestEvidence.status):k.latestEvidence.status),'',
    '## Dependencies','',
    ...(k.dependencies.length?k.dependencies.map(d=>'- '+d.gate+' = '+d.status):['- none']),'',
    '## Exact performance components','',
    ...k.components.map(x=>'- '+x.id+'@'+x.version+' — '+x.assessmentType+' (current provisional file threshold: '+String(x.currentProvisionalMinimumPercent)+')'),'',
    '## Panel intake command','',
    '    '+k.panelIntakeCommand,'',
    '## Governance approval command','',
    '    '+k.approvalCommand,'',
    '## Required actions','',
    ...k.actions.map(x=>'- [ ] '+x),'',
    '## Boundary','',
    'Provisional thresholds shown above are context only and are not panel recommendations or adopted credential standards. Real panel and governance decisions must be supplied explicitly.'
  ];
  return lines.join('\n')+'\n';
}
if(write){
  fs.mkdirSync(outDir,{recursive:true});
  for(const k of kits){
    fs.writeFileSync(path.join(outDir,k.id+'.json'),JSON.stringify(k,null,2)+'\n');
    fs.writeFileSync(path.join(outDir,k.id+'.md'),md(k));
  }
}
const out={kitCount:kits.length,wroteFiles:write,outputDirectory:path.relative(root,outDir),kits:kits.map(k=>({id:k.id,courseId:k.courseId,executionState:k.executionState,componentCount:k.components.length,latestEvidenceStatus:k.latestEvidence.status}))};
if(asJson) console.log(JSON.stringify(out,null,2));else console.log('Integrated performance standard-setting kits: '+kits.length);
