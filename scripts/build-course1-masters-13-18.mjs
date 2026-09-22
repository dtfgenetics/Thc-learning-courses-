import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const outDir=path.join(root,'visuals/review-candidates/course1/production-masters');
fs.mkdirSync(outDir,{recursive:true});

const posters=[
  {n:13,slug:'EQUIPMENT-PREUSE',module:5,title:'Equipment Pre-Use and Readiness Checks',kicker:'VERIFY BEFORE USE',steps:['Confirm exact asset and controlled status','Inspect assigned external readiness points','Check permitted indicators and connections','Classify: ready, routine correction, escalate, or emergency'],boundary:'A failed readiness check means stop use, preserve controlled status, and follow the site-defined escalation process. It is not permission to diagnose or repair.'},
  {n:14,slug:'OPERATOR-VS-MAINTENANCE',module:5,title:'Routine Operator Care versus Skilled Maintenance',kicker:'KNOW THE WORK BOUNDARY',steps:['Operator care: external cleaning, observation, setup','Simple checks or reset only when explicitly permitted','Servicing cues: protected access, stored energy, disassembly','Diagnosis, repair, electrical work, and calibration transfer'],boundary:'Routine care exists only where the current procedure explicitly assigns, trains, and authorizes the action. Preserve safe status when work crosses into servicing.'},
  {n:15,slug:'FAULT-REPORT',module:5,title:'Maintenance-Ready Fault Context',kicker:'REPORT FACTS, NOT GUESSES',steps:['Identify exact asset, location, date, and time','Record alarm, symptom, sound, or visible condition','Document permitted checks, recurrence, and process impact','Preserve safe status and use the approved notification channel'],boundary:'Separate verified observations from hypotheses. Reporting timing and channel follow the applicable emergency, fault-reporting, or escalation procedure.'},
  {n:16,slug:'RECORD-CORRECTION',module:6,title:'Controlled Record Correction',kicker:'PRESERVE THE ORIGINAL RECORD',steps:['Use the approved paper or digital correction process','Keep the original information or audit trail visible','Attribute the correction and preserve timing','Record the reason when the governing procedure requires it'],boundary:'The approved record system, facility SOP, and applicable requirements control the method. A strike-through, initials, and date are only one possible paper example.'},
  {n:17,slug:'SHIFT-HANDOFF',module:6,title:'Professional Shift Handoff',kicker:'TRANSFER STATUS AND OWNERSHIP',steps:['Use exact crop, material, room, lot, and equipment identifiers','Separate completed work from open work','State unresolved risks, notifications, timing, and next actions','Confirm ownership and read back critical open items'],boundary:'Transferred priorities must be current, controlled, and within the receiving worker’s authority. A verbal handoff does not override the SOP or controlled record.'},
  {n:18,slug:'INTEGRATED-WORKFLOW',module:6,title:'Integrated Technician I Workflow',kicker:'CONNECT THE WHOLE SHIFT',steps:['Review assigned work and current instructions','Check hazards, prerequisites, identity, and status','Execute authorized work and monitor conditions','Document facts, communicate, and follow up'],boundary:'Strong performance includes stopping, holding, preserving evidence, or escalating when evidence is incomplete or the next action exceeds Technician I authority.'}
];

const esc=(s)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function wrap(text,max=42){
  const words=text.split(/\s+/),lines=[];let line='';
  for(const word of words){const next=line?`${line} ${word}`:word;if(next.length>max&&line){lines.push(line);line=word}else line=next}
  if(line)lines.push(line);return lines;
}
function textBlock(text,x,y,size,max,widthClass='body'){
  return `<text class="${widthClass}" x="${x}" y="${y}" font-size="${size}">${wrap(text,max).map((line,i)=>`<tspan x="${x}" dy="${i?size*1.28:0}">${esc(line)}</tspan>`).join('')}</text>`;
}

for(const poster of posters){
  const cards=poster.steps.map((step,i)=>{
    const y=1080+i*360;
    return `<rect x="190" y="${y}" width="2020" height="290" rx="44" fill="#ffffff" stroke="#8eb9a7" stroke-width="8"/><circle cx="350" cy="${y+145}" r="74" fill="#6f2c91"/><text x="350" y="${y+170}" text-anchor="middle" font-size="70" font-weight="800" fill="#fff">${i+1}</text>${textBlock(step,500,y+112,54,48,'step')}`;
  }).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="3200" viewBox="0 0 2400 3200">
  <rect width="2400" height="3200" fill="#f8f4e9"/><rect width="2400" height="390" fill="#173f32"/>
  <circle cx="2140" cy="195" r="118" fill="#d5ad39"/><path d="M2100 205c-100-90-18-180 40-108 58-72 140 18 40 108-18 17-40 35-40 35s-22-18-40-35z" fill="#173f32" opacity=".9"/>
  <text x="170" y="120" font-family="DejaVu Sans" font-size="43" font-weight="700" fill="#d8c788">THC LEARNING HUB • COURSE 1 • MODULE ${poster.module}</text>
  ${textBlock(poster.title,170,235,82,43,'title')}
  <rect x="0" y="390" width="2400" height="520" fill="#eadfbd"/>
  <text x="170" y="535" font-family="DejaVu Sans" font-size="44" font-weight="800" letter-spacing="4" fill="#6f2c91">${poster.kicker}</text>
  <path d="M170 650h2060" stroke="#d5ad39" stroke-width="12"/>
  <text x="170" y="740" font-family="DejaVu Sans" font-size="52" font-weight="700" fill="#173f32">Technician I decision aid</text>
  <text x="170" y="825" font-family="DejaVu Sans" font-size="42" fill="#31483f">Use the current controlled procedure and stay within assigned authority.</text>
  ${cards}
  <rect x="150" y="2550" width="2100" height="420" rx="55" fill="#173f32"/>
  <text x="230" y="2670" font-family="DejaVu Sans" font-size="45" font-weight="800" fill="#d8c788">STOP • PRESERVE • DOCUMENT • ESCALATE</text>
  ${textBlock(poster.boundary,230,2770,43,75,'boundary')}
  <text x="170" y="3090" font-family="DejaVu Sans" font-size="34" fill="#53675f">Academic learning visual • Facility procedures and authorized roles control actual work.</text>
  <style>text{font-family:'DejaVu Sans',sans-serif}.title{font-weight:800;fill:#fff}.step{font-weight:700;fill:#173f32}.boundary{font-weight:500;fill:#fff}</style></svg>`;
  const tmp=path.join(os.tmpdir(),`course1-${poster.n}.svg`);
  const out=path.join(outDir,`VIS-LH-TECH1-001-${poster.n}-${poster.slug}-master-v1.png`);
  fs.writeFileSync(tmp,svg);
  const run=spawnSync('inkscape',[tmp,'--export-type=png','--export-width=2400',`--export-filename=${out}`],{encoding:'utf8'});
  fs.unlinkSync(tmp);
  if(run.status!==0)throw new Error(run.stderr||`Failed ${poster.n}`);
  if(fs.statSync(out).size<100000)throw new Error(`${poster.n}: output is unexpectedly small`);
  console.log(path.relative(root,out));
}
