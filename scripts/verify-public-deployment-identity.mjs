const args=process.argv.slice(2);
const value=(name)=>{
  const index=args.indexOf(name);
  return index>=0 ? args[index+1] : null;
};
const baseUrl=(value('--base-url')??'https://dtfseeds.com').replace(/\/$/,'');
const expectedSha=value('--expected-sha');
if(!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(expectedSha??'')){
  console.error('A full 40- or 64-character --expected-sha is required.');
  process.exit(2);
}

const response=await fetch(`${baseUrl}/api/build-info`,{
  headers:{accept:'application/json','user-agent':'thc-academy-deployment-verifier/1.0'}
});
if(!response.ok){
  console.error(JSON.stringify({verified:false,status:response.status,url:`${baseUrl}/api/build-info`},null,2));
  process.exit(1);
}
const identity=await response.json();
const verified=identity?.exactIdentityAvailable===true
  && typeof identity.buildId==='string'
  && identity.buildId.length>0
  && typeof identity.sourceSha==='string'
  && identity.sourceSha.toLowerCase()===expectedSha.toLowerCase();

const result={
  verified,
  checkedAt:new Date().toISOString(),
  url:`${baseUrl}/api/build-info`,
  expectedSourceSha:expectedSha.toLowerCase(),
  exactDeploymentBuildId:identity?.buildId??null,
  exactDeploymentSourceSha:identity?.sourceSha??null
};
console.log(JSON.stringify(result,null,2));
if(!verified) process.exit(1);
