import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const get=(n)=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=args.includes('--write');

const submissionId=get('--submission');
const decision=get('--decision');
const reviewerId=get('--reviewer');
const summary=get('--summary')??'Evidence submission review decision.';
const evidenceRefs=(get('--evidence-ref')??'').split(',').map(x=>x.trim()).filter(Boolean);

if(!submissionId||!reviewerId||!['accepted','returned','revision-required'].includes(decision)){
  throw new Error('Usage: --submission <EVSUB-...> --decision accepted|returned|revision-required --reviewer <id> [--summary text] [--evidence-ref id,id] [--write]');
}
const dir=path.join(root,'content/evidence-submissions');
if(!fs.existsSync(dir)) throw new Error('No evidence submissions exist');
const files=fs.readdirSync(dir).filter(n=>n.endsWith('.json'));
const submission=files.map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))).find(x=>x.id===submissionId);
if(!submission) throw new Error('Unknown submission '+submissionId);
if(!['ready-for-review','accepted'].includes(submission.status)) throw new Error('Submission must be ready-for-review before a review decision can be recorded');

const now=new Date().toISOString();
const safe=(v)=>String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
const record={
  id:'EVDEC-'+safe(submission.id)+'-'+now.replace(/[-:.TZ]/g,'').slice(0,14),
  submissionId:submission.id,
  decision,
  reviewerId,
  reviewedAt:now,
  summary,
  evidenceRefs,
  limitations:[]
};

if(write){
  const out=path.join(root,'content/evidence-submission-decisions');
  fs.mkdirSync(out,{recursive:true});
  const target=path.join(out,record.id+'.json');
  if(fs.existsSync(target)) throw new Error('Refusing to overwrite '+target);
  fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record},null,2));
