import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const has=x=>args.includes(x);
const value=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=has('--write');
const asJson=has('--json');
const outDir=path.resolve(root,value('--out')??'generated/occupational-source-baseline');

const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const baseline=read('registry/public-occupational-source-baseline.json');
const refsDir=path.join(root,'content/references');
const refs=new Map(fs.readdirSync(refsDir).filter(n=>n.endsWith('.json')).map(n=>{
  const r=JSON.parse(fs.readFileSync(path.join(refsDir,n),'utf8'));
  return [r.id,r];
}));

const packets=(baseline.programs??[]).map(p=>{
  const sourceDetails=(p.sourceIds??[]).map(id=>{
    const r=refs.get(id);
    if(!r) throw new Error('Missing occupational source '+id);
    return {id,title:r.title,publisher:r.publisher??null,year:r.year??null,url:r.url??null,lastVerifiedAt:r.lastVerifiedAt??null,notes:r.notes??null};
  });
  return {
    id:'OCCSRC-'+p.credentialProgramId.replace(/^CREDPROG-/,''),
    baselineId:baseline.id,
    baselineAsOf:baseline.asOf,
    status:baseline.status,
    credentialProgramId:p.credentialProgramId,
    credentialProgramVersion:p.credentialProgramVersion,
    interpretation:p.interpretation,
    sourceDetails,
    taskFamilies:p.taskFamilies
  };
});

function md(p){
  const lines=[
    '# Public Occupational Source Baseline — '+p.credentialProgramId,'',
    'Credential program: '+p.credentialProgramId+'@'+p.credentialProgramVersion,
    'Baseline: '+p.baselineId+' / '+p.baselineAsOf,
    'Status: '+p.status,'',
    '## Interpretation','',p.interpretation,'',
    '## Public occupational sources',''
  ];
  for(const s of p.sourceDetails){
    lines.push('- '+s.id+' — '+s.title+'; '+(s.publisher??'')+'; verified='+(s.lastVerifiedAt??'not-recorded'));
  }
  lines.push('','## Task-family crosswalk','');
  for(const f of p.taskFamilies){
    lines.push('### '+f.id+' — '+f.label,'',
      'Public occupational basis: '+f.publicOccupationalBasis,'',
      'Course mappings: '+f.courseMappings.join(', '),'',
      'Source support: '+f.sourceSupport.join(', '),'',
      'Cannabis-specific validation questions:','',
      ...f.cannabisAdaptationQuestions.map(x=>'- [ ] '+x),'');
  }
  lines.push('## Reviewer disposition','',
    '- Keep / adapt / reject each task family:',
    '- Missing cannabis-specific task families:',
    '- Tasks that should move to a different credential level:',
    '- Tasks that require separate legal/regulated authorization:',
    '- Role-boundary concerns:',
    '- SME/employer evidence references:',
    '- Reviewer/panel:',
    '- Date:','',
    '## Integrity boundary','',
    'This packet is a public occupational-source baseline, not a completed cannabis job-task analysis. Final task importance, frequency, criticality, level assignment and scope boundaries require cannabis cultivation SME/employer validation.','');
  return lines.join('\n');
}
if(write){
  fs.mkdirSync(outDir,{recursive:true});
  for(const p of packets){
    fs.writeFileSync(path.join(outDir,p.id+'.json'),JSON.stringify(p,null,2)+'\n');
    fs.writeFileSync(path.join(outDir,p.id+'.md'),md(p));
  }
}
const out={baselineId:baseline.id,baselineAsOf:baseline.asOf,packetCount:packets.length,wroteFiles:write,outputDirectory:path.relative(root,outDir),programs:packets.map(p=>({credentialProgramId:p.credentialProgramId,credentialProgramVersion:p.credentialProgramVersion,sourceCount:p.sourceDetails.length,taskFamilyCount:p.taskFamilies.length}))};
if(asJson) console.log(JSON.stringify(out,null,2));
else console.log('Public occupational source baseline: '+packets.length+' program packets.');
