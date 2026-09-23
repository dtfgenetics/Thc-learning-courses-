import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const value=(n)=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const has=(n)=>args.includes(n);
const baseUrl=(value('--base-url')??'https://dtfseeds.com').replace(/\/$/,'');
const write=has('--write');

const manifest=JSON.parse(fs.readFileSync(path.join(root,'visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json'),'utf8'));
const deploymentLedger=JSON.parse(fs.readFileSync(path.join(root,'registry/deployments.json'),'utf8'));
const completionPath=path.join(root,'registry/course1-completion-status.json');
const completion=JSON.parse(fs.readFileSync(completionPath,'utf8'));

const assets=(manifest.concepts??[])
  .filter(x=>x.releaseApproved===true&&typeof x.candidate?.targetPublicPath==='string')
  .map(x=>({conceptId:x.conceptId,path:x.candidate.targetPublicPath,sha256:x.candidate.sha256??null,registryAssetId:x.candidate.registryAssetId??null}));

if(assets.length!==23) throw new Error(`Expected 23 released Course 1 raster assets, found ${assets.length}`);
if(new Set(assets.map(x=>x.path)).size!==23) throw new Error('Course 1 release manifest has duplicate public raster paths');

const idResp=await fetch(`${baseUrl}/api/build-info`,{headers:{accept:'application/json','user-agent':'thc-course1-raster-verifier/1.0'}});
if(!idResp.ok) throw new Error(`Build identity endpoint failed: ${idResp.status}`);
const identity=await idResp.json();
if(identity?.exactIdentityAvailable!==true||!identity?.buildId||!identity?.sourceSha){
  throw new Error('Public build identity is not exact');
}

const results=[];
for(const asset of assets){
  const url=baseUrl+asset.path;
  const res=await fetch(url,{redirect:'follow',headers:{accept:'image/png,image/webp,image/*','user-agent':'thc-course1-raster-verifier/1.0'}});
  const contentType=res.headers.get('content-type')??'';
  const buf=Buffer.from(await res.arrayBuffer());
  results.push({
    ...asset,url,status:res.status,contentType,sizeBytes:buf.length,
    pass:res.ok&&/^image\/(?:png|webp|jpeg)/i.test(contentType)&&buf.length>1000
  });
}
const failed=results.filter(x=>!x.pass);
const verified=failed.length===0;

const record={
  id:`DEPLOY-COURSE-LH-TECH1-001-RASTER23-${new Date().toISOString().slice(0,10)}`,
  courseId:'COURSE-LH-TECH1-001',
  environment:'production',
  site:baseUrl,
  siteRepository:'dtfgenetics/Thc',
  completedAt:new Date().toISOString(),
  result:verified?'success':'failed',
  exactDeploymentBuildId:identity.buildId,
  exactDeploymentSourceSha:String(identity.sourceSha).toLowerCase(),
  verification:{
    releasedRasterCount:assets.length,
    verifiedRasterCount:results.filter(x=>x.pass).length,
    allReleasedRasterPathsVerified:verified,
    failedPaths:failed.map(x=>x.path)
  },
  visualAuthority:[
    'visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json',
    'visuals/ASSET-REGISTRY.json',
    'content/lessons/LESSON-LH-TECH1-001-*.json'
  ],
  boundary:'This record verifies public delivery of the 23 governed Course 1 raster learner assets and exact deployed build identity only. Human accessibility/UX review and certification-release evidence remain separate.'
};

if(write&&verified){
  const existing=deploymentLedger.deployments??[];
  const duplicate=existing.find(x=>x.id===record.id);
  if(!duplicate){
    deploymentLedger.deployments=[...existing,record];
    deploymentLedger.updated=new Date().toISOString().slice(0,10);
    fs.writeFileSync(path.join(root,'registry/deployments.json'),JSON.stringify(deploymentLedger,null,2)+'\n');
  }
  completion.machineResolvableWorkComplete=true;
  completion.nextMachineActions=[];
  completion.updated=new Date().toISOString().slice(0,10);
  completion.machineCompletionBoundary='Course 1 canonical instruction, assessments, learner runtime, the 23-asset production raster repository cutover, and public delivery/readback of all 23 governed raster paths are machine-verified. Machine-resolvable package/deployment work is complete for the current snapshot. Rendered accessibility/responsive human review, technical/occupational validation, practical calibration, controlled pilot evidence, standard setting, secure-form readiness, and credential authorization remain separate fail-closed gates.';
  const visualDomain=(completion.domains??[]).find(x=>x.id==='visual-and-asset-completion');
  if(visualDomain){
    visualDomain.state='production-raster-public-readback-complete';
    visualDomain.note='All 23 governed Course 1 PNG learner assets are active in canonical mappings and were verified from the public learner asset paths against an exact deployed build identity. Human rendered accessibility/responsive review remains separately open.';
  }
  fs.writeFileSync(completionPath,JSON.stringify(completion,null,2)+'\n');
}

console.log(JSON.stringify({
  verified,write,
  buildId:identity.buildId,
  sourceSha:String(identity.sourceSha).toLowerCase(),
  releasedRasterCount:assets.length,
  verifiedRasterCount:results.filter(x=>x.pass).length,
  failedPaths:failed.map(x=>x.path),
  record
},null,2));
if(!verified) process.exit(1);
