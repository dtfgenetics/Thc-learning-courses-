import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { candidateFingerprint, findVisual, reviewTypes, reviewStatuses, root } from './lib/tech2-visual-review.mjs';

function parseArgs(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(!arg.startsWith('--')) continue;
    const key=arg.slice(2);
    if(['write','confirm-approved'].includes(key)) out[key]=true;
    else out[key]=argv[++i];
  }
  return out;
}
function token(value){return String(value).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'REVIEWER';}
function usage(){
  console.error('Usage: node scripts/create-tech2-visual-review-record.mjs --visual VIS-LH-TECH2-... --type visual-technical|visual-instructional|visual-accessibility --reviewer ID --status approved|changes-requested|rejected [--notes TEXT] [--confirm-approved] [--write]');
}
const isDirect=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isDirect){
  try{
    const args=parseArgs(process.argv.slice(2));
    if(!args.visual||!args.type||!args.reviewer||!args.status){usage();process.exit(64);}
    if(!reviewTypes.includes(args.type)) throw new Error(`invalid visual review type: ${args.type}`);
    if(!reviewStatuses.includes(args.status)) throw new Error(`invalid status: ${args.status}`);
    if(String(args.reviewer).length<3) throw new Error('reviewer id must be at least 3 characters');
    if(args.status==='approved'&&!args['confirm-approved']) throw new Error('approved visual reviews require --confirm-approved');
    const hit=findVisual(args.visual);
    if(!hit) throw new Error(`visual candidate not found: ${args.visual}`);
    const objectVersion=candidateFingerprint(args.visual);
    const reviewedAt=new Date().toISOString();
    const stamp=reviewedAt.replace(/[-:.TZ]/g,'').slice(0,14);
    const record={
      id:`REVIEW-${token(args.visual)}-${token(args.type)}-${stamp}`,
      objectId:args.visual,
      targetId:args.visual,
      objectVersion,
      reviewType:args.type,
      status:args.status,
      reviewerId:String(args.reviewer),
      reviewedAt,
      notes:String(args.notes??''),
      sourcePath:hit.concept.sourcePath,
      lessonIds:hit.concept.lessonIds,
      referencesChecked:hit.concept.references
    };
    const serialized=JSON.stringify(record,null,2)+'\n';
    if(args.write){
      const out=path.join(root,'content/reviews',record.id+'.json');
      if(fs.existsSync(out)) throw new Error(`review record already exists: ${out}`);
      fs.writeFileSync(out,serialized,'utf8');
      console.log(`Created ${path.relative(root,out)}`);
    } else process.stdout.write(serialized);
  }catch(error){console.error(error.message);process.exit(1);}
}
