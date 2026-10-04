import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadSecureAssessmentStore } from '../apps/api/src/secure-assessment-store-adapter.mjs';

function value(args,name,{required=false}={}){
  const prefix='--'+name+'=';
  const raw=args.find((arg)=>arg.startsWith(prefix));
  const out=raw?raw.slice(prefix.length).trim():'';
  if(required&&!out) throw new Error('--'+name+' is required');
  return out;
}
function actorId(env=process.env){
  const id=String(env.THC_SECURE_ASSESSMENT_OPERATOR_ID??'').trim();
  if(!id) throw new Error('THC_SECURE_ASSESSMENT_OPERATOR_ID is required');
  return id;
}
function operatorMethods(store){
  for(const method of ['createDraftBank','createDraftItem','transitionItem','bankSummary','activateBank','quarantineItem']){
    if(typeof store?.[method]!=='function') throw new Error('secure assessment store operator requires '+method+'()');
  }
  return store;
}
async function readPrivateJson(inputPath,stdin=process.stdin){
  if(!inputPath||inputPath==='-'){
    let text='';
    for await (const chunk of stdin) text+=chunk;
    if(!text.trim()) throw new Error('private item JSON required on stdin');
    return JSON.parse(text);
  }
  const resolved=String(inputPath);
  if(!fs.existsSync(resolved)) throw new Error('private item input file not found');
  return JSON.parse(fs.readFileSync(resolved,'utf8'));
}
function safeResult(result){
  if(!result||typeof result!=='object') return result;
  const allowed=['bankVersion','credentialProgramId','status','auditId','secureItemId','revision','competency','activatedAt','retiredAt','counts'];
  return Object.fromEntries(allowed.filter((key)=>Object.hasOwn(result,key)).map((key)=>[key,result[key]]));
}

export async function executeSecureAssessmentOperator({args=process.argv.slice(2),env=process.env,store=null,stdin=process.stdin}={}){
  const [command]=args;
  if(!command||['help','--help','-h'].includes(command)){
    return {help:[
      'create-bank --bank=<version> --program=<CREDPROG-...> [--metadata=<json>]',
      'add-item --bank=<version> [--input=-|/private/path/item.json]',
      'transition-item --item=<SECITEM-...> --revision=<n> --status=<pilot|approved-operational|quarantined|retired> [--evidence=<ref>] [--reason=<text>]',
      'activate-bank --bank=<version> --approval=<evidence-ref>',
      'summary --bank=<version>',
      'quarantine-item --item=<SECITEM-...> --revision=<n> --reason=<text>'
    ]};
  }
  const resolved=operatorMethods(store??await loadSecureAssessmentStore(env));
  const actor=actorId(env);

  if(command==='create-bank'){
    let metadata={};
    const metadataRaw=value(args,'metadata');
    if(metadataRaw) metadata=JSON.parse(metadataRaw);
    const result=await resolved.createDraftBank({
      bankVersion:value(args,'bank',{required:true}),
      credentialProgramId:value(args,'program',{required:true}),
      metadata,
      actorId:actor
    });
    return safeResult(result);
  }
  if(command==='add-item'){
    const item=await readPrivateJson(value(args,'input')||'-',stdin);
    const result=await resolved.createDraftItem({
      bankVersion:value(args,'bank',{required:true}),
      item,
      actorId:actor
    });
    return safeResult(result);
  }
  if(command==='transition-item'){
    const revision=Number(value(args,'revision',{required:true}));
    const result=await resolved.transitionItem({
      secureItemId:value(args,'item',{required:true}),
      revision,
      nextStatus:value(args,'status',{required:true}),
      evidenceRef:value(args,'evidence')||null,
      reason:value(args,'reason')||null,
      actorId:actor
    });
    return safeResult(result);
  }
  if(command==='activate-bank'){
    const result=await resolved.activateBank({
      bankVersion:value(args,'bank',{required:true}),
      approvalRef:value(args,'approval',{required:true}),
      actorId:actor
    });
    return safeResult(result);
  }
  if(command==='summary'){
    return safeResult(await resolved.bankSummary({bankVersion:value(args,'bank',{required:true})}));
  }
  if(command==='quarantine-item'){
    return safeResult(await resolved.quarantineItem({
      secureItemId:value(args,'item',{required:true}),
      revision:Number(value(args,'revision',{required:true})),
      reason:value(args,'reason',{required:true})
    }));
  }
  throw new Error('unknown secure assessment operator command: '+command);
}

async function main(){
  try{
    const result=await executeSecureAssessmentOperator();
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
  }catch(error){
    process.stderr.write('secure-assessment-operator: '+error.message+'\n');
    process.exitCode=1;
  }
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath(pathToFileURL(path.resolve(process.argv[1])))){
  await main();
}
