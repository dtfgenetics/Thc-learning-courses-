const graphNodes=document.querySelector('#graph-nodes');
const graphFilter=document.querySelector('#graph-filter');
let graphData=null;

function renderGraph(){
  if(!graphData) return;
  const q=graphFilter.value.trim().toLowerCase();
  const rows=graphData.nodes.filter(node=>!q||[node.canonicalId,node.canonicalType,node.kind].filter(Boolean).some(value=>String(value).toLowerCase().includes(q)));
  graphNodes.replaceChildren(...rows.map(node=>{
    const li=document.createElement('li');
    const strong=document.createElement('strong');
    strong.textContent=node.canonicalId;
    const span=document.createElement('span');
    span.textContent=node.canonicalType;
    li.append(strong,span);
    return li;
  }));
  document.querySelector('#graph-stats').textContent=`${rows.length} of ${graphData.nodes.length} canonical nodes shown · ${graphData.edges.length} typed relationship(s)`;
}

async function loadGraph(){
  const response=await fetch('/api/applied-learning/graphs/ALGRAPH-ACADEMY-SEED-001');
  if(!response.ok) throw new Error('Knowledge Graph unavailable');
  graphData=await response.json();
  document.querySelector('#graph-summary').textContent=graphData.summary;
  document.querySelector('#graph-edges').textContent=graphData.edges.map(edge=>`${edge.source} → ${edge.relationship} → ${edge.target}`).join('\n')||'Relationship expansion is still in progress.';
  renderGraph();
}
graphFilter.addEventListener('input',renderGraph);

async function loadMeasurement(){
  const response=await fetch('/api/applied-learning/measurements/ALMEAS-SENSOR-PLACEMENT-001');
  if(!response.ok) throw new Error('Measurement activity unavailable');
  const activity=await response.json();
  document.querySelector('#measurement-summary').textContent=activity.summary;
  document.querySelector('#measurement-boundary').textContent=activity.safetyBoundary;

  const steps=document.querySelector('#measurement-steps');
  steps.replaceChildren(...activity.steps.map(step=>{
    const li=document.createElement('li');
    li.textContent=step.instruction;
    return li;
  }));

  const fields=document.querySelector('#measurement-fields');
  fields.replaceChildren(...activity.evidenceFields.map(field=>{
    const label=document.createElement('label');
    label.textContent=field.label+(field.unit?` (${field.unit})`:'');
    const input=document.createElement('input');
    input.name=field.id;
    input.required=field.required;
    input.type=field.type==='number'?'number':field.type==='timestamp'?'datetime-local':'text';
    if(input.type==='number') input.step='any';
    label.append(input);
    return label;
  }));

  document.querySelector('#measurement-form').addEventListener('submit',event=>{
    event.preventDefault();
    const values=Object.fromEntries(new FormData(event.currentTarget).entries());
    document.querySelector('#measurement-output').textContent=JSON.stringify({
      activityId:activity.id,
      status:'learner-draft-evidence',
      values,
      note:'Local review only; this page does not submit credential evidence.'
    },null,2);
  },{once:false});
}



async function loadCropMath(){
  const response=await fetch('/api/applied-learning/calculators/ALCALC-DLI-001');
  if(!response.ok) throw new Error('Crop Math unavailable');
  const calculator=await response.json();
  document.querySelector('#crop-math-summary').textContent=calculator.summary;
  const fields=document.querySelector('#crop-math-fields');
  fields.replaceChildren(...calculator.inputFields.map(field=>{
    const label=document.createElement('label');
    label.textContent=`${field.label} (${field.unit})`;
    const input=document.createElement('input');
    input.name=field.id;
    input.type='number';
    input.step='any';
    input.min=String(field.min);
    input.max=String(field.max);
    input.required=true;
    label.append(input);
    return label;
  }));
  document.querySelector('#crop-math-limitations').replaceChildren(...calculator.limitations.map(text=>{
    const li=document.createElement('li'); li.textContent=text; return li;
  }));
  document.querySelector('#crop-math-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const values=Object.fromEntries(new FormData(event.currentTarget).entries());
    const result=await fetch(`/api/applied-learning/calculators/${calculator.id}/calculate`,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(values)
    });
    const payload=await result.json();
    const target=document.querySelector('#crop-math-result');
    target.textContent=result.ok
      ? `${Number(payload.value).toFixed(2)} ${payload.unit}`
      : (payload.message??'Unable to calculate with those inputs.');
  });
}

async function loadDifferential(){
  const response=await fetch('/api/applied-learning/differentials/ALDIFF-YELLOWING-001');
  if(!response.ok) throw new Error('Differential activity unavailable');
  const differential=await response.json();
  document.querySelector('#differential-summary').textContent=differential.summary;
  document.querySelector('#differential-pattern').textContent=differential.observedPattern;
  document.querySelector('#differential-boundary').textContent=differential.boundary;
  document.querySelector('#differential-evidence').replaceChildren(...differential.discriminatingEvidence.map(text=>{
    const li=document.createElement('li'); li.textContent=text; return li;
  }));
  document.querySelector('#differential-hypotheses').replaceChildren(...differential.hypotheses.map(hypothesis=>{
    const article=document.createElement('article');
    const heading=document.createElement('h3'); heading.textContent=hypothesis.label;
    const why=document.createElement('p'); why.textContent=hypothesis.whyPlausible;
    const up=document.createElement('p'); up.innerHTML='<strong>Raises confidence</strong>';
    const upList=document.createElement('ul');
    upList.replaceChildren(...hypothesis.evidenceThatRaisesConfidence.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    const down=document.createElement('p'); down.innerHTML='<strong>Lowers confidence</strong>';
    const downList=document.createElement('ul');
    downList.replaceChildren(...hypothesis.evidenceThatLowersConfidence.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    article.append(heading,why,up,upList,down,downList);
    return article;
  }));
}


let systemsTools=[];
let currentSystemsTool=null;

function makeToolInput(field){
  const label=document.createElement('label');
  label.textContent=field.label+(field.unit?` (${field.unit})`:'');
  let input;
  if(field.type==='choice'){
    input=document.createElement('select');
    input.append(new Option('Select…',''));
    for(const option of field.options??[]) input.append(new Option(option,option));
  } else {
    input=document.createElement('input');
    input.type=field.type==='number'?'number':field.type==='timestamp'?'datetime-local':'text';
    if(input.type==='number') input.step='any';
  }
  input.name=field.id;
  input.required=field.required;
  label.append(input);
  return label;
}

function renderSystemsTool(tool){
  currentSystemsTool=tool;
  document.querySelector('#systems-tool-title').textContent=tool.title;
  document.querySelector('#systems-tool-summary').textContent=tool.summary;
  document.querySelector('#systems-tool-boundary').textContent=tool.boundary;
  document.querySelector('#systems-tool-output').textContent='';
  document.querySelector('#systems-tool-steps').replaceChildren(...tool.steps.map(step=>{
    const li=document.createElement('li'); li.textContent=step.instruction; return li;
  }));
  document.querySelector('#systems-tool-fields').replaceChildren(...tool.fields.map(makeToolInput));
}

async function loadSystemsTools(){
  const response=await fetch('/api/applied-learning/tools');
  if(!response.ok) throw new Error('Applied systems tools unavailable');
  const payload=await response.json();
  systemsTools=payload.tools??[];
  const select=document.querySelector('#systems-tool-select');
  select.replaceChildren(...systemsTools.map(tool=>new Option(tool.title,tool.id)));
  if(!systemsTools.length){
    document.querySelector('#systems-tool-title').textContent='No reviewed tools are published in this mode.';
    return;
  }
  renderSystemsTool(systemsTools[0]);
  select.addEventListener('change',()=>{
    const tool=systemsTools.find(row=>row.id===select.value);
    if(tool) renderSystemsTool(tool);
  });
  document.querySelector('#systems-tool-form').addEventListener('submit',async event=>{
    event.preventDefault();
    if(!currentSystemsTool) return;
    const values=Object.fromEntries(new FormData(event.currentTarget).entries());
    const result=await fetch(`/api/applied-learning/tools/${currentSystemsTool.id}/evaluate`,{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(values)
    });
    const body=await result.json();
    document.querySelector('#systems-tool-output').textContent=JSON.stringify(body,null,2);
  });
}

Promise.all([loadGraph(),loadMeasurement(),loadCropMath(),loadDifferential(),loadSystemsTools()]).catch(error=>{
  document.querySelector('#graph-summary').textContent=error.message;
  document.querySelector('#measurement-summary').textContent=error.message;
});
