import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const dir=path.join(root,'content','references');
const refs=fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>({file:n,data:JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))}));
const failures=[];
const placeholder=/\b(authors?|research authors?|review authors?)\s+as\s+indexed\s+in\s+(pubmed|pubmed central|pmc)\b/i;
for(const {file,data} of refs){
  if(['reviewed','reviewed-source'].includes(data.status)){
    for(const author of data.authors??[]){
      if(placeholder.test(String(author))) failures.push(`${file}: reviewed source contains placeholder author text: ${author}`);
    }
  }
  const pubmed=String(data.url??'').match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
  if(pubmed && data.status==='reviewed-source'){
    if(String(data.pmid??'')!==pubmed[1]) failures.push(`${file}: reviewed PubMed source must record PMID ${pubmed[1]}`);
    if(!(data.authors?.length>0)) failures.push(`${file}: reviewed PubMed source must record authors`);
  }
  if(data.evidenceLevel==='peer-reviewed' && ['reviewed','reviewed-source'].includes(data.status)){
    if(!(data.authors?.length>0)) failures.push(`${file}: reviewed peer-reviewed source must record authors`);
  }
}
if(failures.length){
  console.error(`Reference bibliographic integrity failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log(`Reference bibliographic integrity: PASS (${refs.length} controlled references checked; no reviewed-source author placeholders).`);
