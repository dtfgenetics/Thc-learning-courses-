import fs from 'node:fs';

const args=process.argv.slice(2);
const file=args.find((x)=>!x.startsWith('--'));
if(!file) throw new Error('Usage: node scripts/analyze-occupational-validation-ratings.mjs <completed-ratings.csv> [--json]');
const asJson=args.includes('--json');

function parseCsv(text){
  const rows=[]; let row=[]; let cell=''; let quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){
      if(c==='"' && text[i+1]==='"'){cell+='"';i++;}
      else if(c==='"') quoted=false;
      else cell+=c;
    } else {
      if(c==='"') quoted=true;
      else if(c===','){row.push(cell);cell='';}
      else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
      else cell+=c;
    }
  }
  if(cell.length||row.length){row.push(cell);rows.push(row);}
  const header=rows.shift();
  return rows.filter((r)=>r.some((x)=>String(x).trim())).map((r)=>Object.fromEntries(header.map((h,i)=>[h,r[i]??''])));
}

const num=(v)=>v===''?null:Number(v);
const yes=(v)=>String(v).trim().toLowerCase()==='yes';
const mean=(xs)=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const median=(xs)=>{if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y);const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
const pct=(n,d)=>d?Math.round((n/d)*1000)/10:null;

const rows=parseCsv(fs.readFileSync(file,'utf8'));
const completed=rows.filter((r)=>r.panelist_id&&r.task_number&&r.relevance);
const taskMap=new Map();
for(const r of completed){const key=r.task_number+'|'+r.task_title;if(!taskMap.has(key))taskMap.set(key,[]);taskMap.get(key).push(r);}

const tasks=[...taskMap.values()].map((rs)=>{
  const rel=rs.filter((r)=>yes(r.relevance));
  const vals=(field,source=rel)=>source.map((r)=>num(r[field])).filter(Number.isFinite);
  return {
    taskNumber:Number(rs[0].task_number),
    taskTitle:rs[0].task_title,
    raters:rs.length,
    relevanceYesPct:pct(rel.length,rs.length),
    meanImportance:mean(vals('importance_0_5')),
    meanFrequency:mean(vals('frequency_0_5')),
    medianConsequence:median(vals('consequence_1_5')),
    expectedAtEntryYesPct:pct(rel.filter((r)=>yes(r.expected_at_entry)).length,rel.length),
    assessInCredentialYesPct:pct(rel.filter((r)=>yes(r.assess_in_credential)).length,rel.length),
    facilityVariationNotes:[...new Set(rs.map((r)=>r.facility_variation_note).filter(Boolean))],
    roleBoundaryNotes:[...new Set(rs.map((r)=>r.role_boundary_note).filter(Boolean))]
  };
}).sort((a,b)=>a.taskNumber-b.taskNumber);

const output={
  sourceFile:file,
  panelists:new Set(completed.map((r)=>r.panelist_id)).size,
  completedRatings:completed.length,
  tasks,
  caution:'Descriptive aggregation only. No statistic automatically approves or removes a task or determines exam weight. Use results in documented panel reconciliation.'
};

if(asJson) console.log(JSON.stringify(output,null,2));
else {
  console.log('Panelists: '+output.panelists+'; completed ratings: '+output.completedRatings);
  for(const t of tasks){
    console.log(t.taskNumber+'. '+t.taskTitle+' | relevance='+t.relevanceYesPct+'% | importance='+(t.meanImportance===null?'n/a':t.meanImportance.toFixed(2))+' | frequency='+(t.meanFrequency===null?'n/a':t.meanFrequency.toFixed(2))+' | consequence median='+(t.medianConsequence??'n/a')+' | entry='+t.expectedAtEntryYesPct+'% | assess='+t.assessInCredentialYesPct+'%');
  }
  console.log(output.caution);
}
