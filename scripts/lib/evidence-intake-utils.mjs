import fs from 'node:fs';
import path from 'node:path';

export const root=process.cwd();
export function argsMap(argv=process.argv.slice(2)){
  const out={};
  for(let i=0;i<argv.length;i++){
    const a=argv[i];
    if(!a.startsWith('--')) continue;
    const k=a.slice(2);
    if(k==='write') out[k]=true;
    else out[k]=argv[++i];
  }
  return out;
}
export function read(rel){return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));}
export function readDir(rel){
  const d=path.join(root,rel); if(!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>read(path.join(rel,n)));
}
export function bool(v,name){
  if(v==='true') return true; if(v==='false') return false;
  throw new Error(`${name} must be true or false`);
}
export function int(v,name,min=0){
  const n=Number(v); if(!Number.isInteger(n)||n<min) throw new Error(`${name} must be an integer >= ${min}`); return n;
}
export function safe(v){return String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);}
export function writeRecord(dir,record,write){
  const text=JSON.stringify(record,null,2)+'\n';
  if(write){
    const abs=path.join(root,dir); fs.mkdirSync(abs,{recursive:true});
    const target=path.join(abs,`${record.id}.json`);
    if(fs.existsSync(target)) throw new Error(`Refusing to overwrite ${path.relative(root,target)}`);
    fs.writeFileSync(target,text);
    console.error(`Created ${path.relative(root,target)}`);
  }
  process.stdout.write(text);
}
