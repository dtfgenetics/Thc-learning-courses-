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

Promise.all([loadGraph(),loadMeasurement()]).catch(error=>{
  document.querySelector('#graph-summary').textContent=error.message;
  document.querySelector('#measurement-summary').textContent=error.message;
});
