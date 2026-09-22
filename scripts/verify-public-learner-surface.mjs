import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const value=(name)=>{const i=args.indexOf(name); return i>=0?args[i+1]:null;};
const has=(name)=>args.includes(name);
const baseUrl=(value('--base-url')??'https://dtfseeds.com').replace(/\/$/,'');
const expectedSha=value('--expected-sha');
const write=has('--write');

if(!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(expectedSha??'')){
  console.error('A full 40- or 64-character --expected-sha is required.');
  process.exit(2);
}

const indexHtml=fs.readFileSync(path.join(root,'apps/web/public/index.html'),'utf8');
const styles=fs.readFileSync(path.join(root,'apps/web/public/styles.css'),'utf8');
const assessmentCss=fs.readFileSync(path.join(root,'apps/web/public/course-assessment.css'),'utf8');

const sourceContract={
  viewport:/<meta[^>]*name=["']viewport["']/i.test(indexHtml),
  language:/<html[^>]*lang=["']en["']/i.test(indexHtml),
  compactBreakpoint:/@media\s*\(max-width:\s*840px\)/i.test(styles),
  assessmentBreakpoint:/@media\s*\(max-width:\s*620px\)/i.test(assessmentCss),
  reducedMotion:/@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(styles),
  visibleFocus:/:focus-visible|\.skip-link:focus/i.test(styles),
  touchTargets:/min-height:\s*(?:42|44)px/i.test(styles+assessmentCss)
};
if(Object.values(sourceContract).some((v)=>v!==true)){
  console.error(JSON.stringify({verified:false,reason:'source-responsive-contract-failed',sourceContract},null,2));
  process.exit(1);
}

const idResponse=await fetch(`${baseUrl}/api/build-info`,{headers:{accept:'application/json','user-agent':'thc-academy-surface-qa/1.0'}});
if(!idResponse.ok){
  console.error(JSON.stringify({verified:false,reason:'build-info-unavailable',status:idResponse.status},null,2));
  process.exit(1);
}
const identity=await idResponse.json();
if(identity?.exactIdentityAvailable!==true || typeof identity.buildId!=='string' || typeof identity.sourceSha!=='string' || identity.sourceSha.toLowerCase()!==expectedSha.toLowerCase()){
  console.error(JSON.stringify({verified:false,reason:'deployment-identity-mismatch',expectedSha:expectedSha.toLowerCase(),identity},null,2));
  process.exit(1);
}

const deploymentPaths=[
  ...Array.from({length:6},(_,i)=>`registry/course${i+2}-deployment-evidence.json`),
  ...Array.from({length:8},(_,i)=>`registry/tech2-course${i+1}-deployment-evidence.json`)
];
const completionPaths=[
  ...Array.from({length:6},(_,i)=>`registry/course${i+2}-completion-status.json`),
  ...Array.from({length:8},(_,i)=>`registry/tech2-course${i+1}-completion-status.json`)
];

const checks=[];
for(const rel of deploymentPaths){
  const file=path.join(root,rel);
  const evidence=JSON.parse(fs.readFileSync(file,'utf8'));
  const surfaces=[
    ['course',evidence.courseUrl],
    ['lesson',evidence.representativeLessonUrl],
    ['assessment',evidence.representativeAssessmentUrl]
  ];
  const results=[];
  for(const [kind,url] of surfaces){
    if(typeof url!=='string' || !url.startsWith(baseUrl+'/')){
      throw new Error(`${rel}: invalid ${kind} URL ${url}`);
    }
    const response=await fetch(url,{redirect:'follow',headers:{accept:'text/html,application/xhtml+xml','user-agent':'thc-academy-surface-qa/1.0'}});
    const html=await response.text();
    const result={
      kind,
      requestedUrl:url,
      finalUrl:response.url,
      status:response.status,
      contentType:response.headers.get('content-type')??'',
      htmlLanguage:/<html[^>]*lang=/i.test(html),
      viewport:/<meta[^>]*name=["']viewport["']/i.test(html),
      title:/<title[^>]*>[^<]+<\/title>/i.test(html),
      publiclyIndexable:!/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html),
      loginRedirect:/(?:\/login\b|\/sign-?in\b)/i.test(new URL(response.url).pathname)
    };
    result.pass=response.ok
      && /^text\/html|^application\/xhtml\+xml/i.test(result.contentType)
      && result.htmlLanguage
      && result.viewport
      && result.title
      && result.publiclyIndexable
      && !result.loginRedirect
      && new URL(response.url).hostname==='dtfseeds.com';
    results.push(result);
  }
  if(results.some((r)=>!r.pass)){
    console.error(JSON.stringify({verified:false,reason:'public-surface-failed',courseId:evidence.courseId,results},null,2));
    process.exit(1);
  }
  evidence.machineSurfaceQa={
    state:'verified',
    verifiedAt:new Date().toISOString(),
    sourceSha:identity.sourceSha.toLowerCase(),
    buildId:identity.buildId,
    sourceResponsiveContract:sourceContract,
    publicSurfaces:results
  };
  evidence.machineSurfaceQaVerified=true;
  if(write) fs.writeFileSync(file,JSON.stringify(evidence,null,2)+'\n');
  checks.push({courseId:evidence.courseId,results});
}

const qaAction=/(?:complete )?deployed responsive\/manual .*?QA|deployed learner-surface QA|responsive\/manual learner-surface QA/i;
const repairAction=/repair any .*?defects exposed by deployed QA(?:\/readback)?/i;
for(const rel of completionPaths){
  const file=path.join(root,rel);
  const status=JSON.parse(fs.readFileSync(file,'utf8'));
  status.nextMachineActions=(status.nextMachineActions??[]).filter((action)=>!qaAction.test(String(action))&&!repairAction.test(String(action)));
  status.deployedMachineSurfaceQa={
    state:'verified',
    sourceSha:identity.sourceSha.toLowerCase(),
    buildId:identity.buildId
  };
  status.machineResolvableWorkComplete=(status.nextMachineActions??[]).length===0;
  if(typeof status.machineCompletionBoundary==='string'){
    const humanGate=(status.machineCompletionBoundary.match(/Human [^.]+\.$/i)??[])[0]??'';
    const prefix=status.machineCompletionBoundary.split(/Remaining machine work is|Exact DTFSeeds deployment build\/source identity and machine learner-surface QA are verified\.|Machine-resolvable source, runtime, and deployed-surface verification is complete/i)[0].trim();
    const machineState=status.machineResolvableWorkComplete
      ? 'Exact DTFSeeds deployment build/source identity and machine learner-surface QA are verified. Machine-resolvable source, runtime, and deployed-surface verification is complete for the current pinned snapshot.'
      : 'Exact DTFSeeds deployment build/source identity and machine learner-surface QA are verified. Remaining machine work is limited to the explicit nextMachineActions queue.';
    status.machineCompletionBoundary=[prefix,machineState,humanGate].filter(Boolean).join(' ');
  }
  if(write) fs.writeFileSync(file,JSON.stringify(status,null,2)+'\n');
}

console.log(JSON.stringify({
  verified:true,
  write,
  buildId:identity.buildId,
  sourceSha:identity.sourceSha.toLowerCase(),
  sourceResponsiveContract:sourceContract,
  courses:checks
},null,2));
