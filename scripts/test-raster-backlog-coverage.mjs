import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const walk=(dir)=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap((entry)=>{
  const full=path.join(dir,entry.name);
  return entry.isDirectory()?walk(full):[full];
}):[];
const rel=(p)=>path.relative(root,p).split(path.sep).join('/');

const svgFiles=walk(path.join(root,'apps/web/public/assets'))
  .filter((p)=>path.extname(p).toLowerCase()==='.svg')
  .map(rel)
  .sort();

const mappings=new Map();
const add=(sourcePath,id,courseId,replacementOpen=true)=>{
  if(!sourcePath?.toLowerCase().endsWith('.svg')) return;
  const current=mappings.get(sourcePath)??[];
  current.push({id,courseId,replacementOpen});
  mappings.set(sourcePath,current);
};

const c1Manifest=read('visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json');
for(const concept of c1Manifest.concepts??[]){
  const publicAsset=concept.baseline?.publicAsset;
  if(publicAsset) add(`apps/web/public${publicAsset}`,concept.conceptId,c1Manifest.courseId,concept.releaseApproved!==true);
}
const c1Registry=read('visuals/ASSET-REGISTRY.json');
for(const asset of c1Registry.assets??[]){
  add(asset.sourcePath,asset.id,c1Registry.courseId,asset.rasterReplacement?.status!=='released');
}
for(let n=2;n<=6;n++){
  const registry=read(`visuals/COURSE${n}-ASSET-REGISTRY.json`);
  for(const asset of registry.assets??[]){
    const legacySvg=asset.legacySource?.sourcePath ?? asset.rasterReplacement?.generatedFrom;
    add(legacySvg,asset.id,registry.courseId,!['released','owner-approved-production-release'].includes(asset.rasterReplacement?.status));
  }
}
const tech2=read('visuals/TECH2-VISUAL-PRODUCTION-PLAN.json');
for(const course of tech2.courses??[]){
  for(const concept of course.concepts??[]){
    const governedSvg=concept.rasterReplacement?.generatedFrom ?? concept.sourcePath;
    add(governedSvg,concept.conceptId,course.courseId,!['approved','produced'].includes(concept.status));
  }
}

const unmapped=svgFiles.filter((file)=>!mappings.has(file));
assert.deepEqual(unmapped,[],'Every public SVG must have an explicit governed raster-replacement mapping');

for(const [file,rows] of mappings){
  assert.ok(svgFiles.includes(file),`Mapped SVG does not exist in public tree: ${file}`);
  assert.ok(rows.length>=1,`SVG mapping must identify at least one governed concept: ${file}`);
}

for(let n=1;n<=6;n++){
  const status=read(`registry/course${n}-completion-status.json`);
  const open=[...mappings.values()].flat().some((row)=>row.courseId===status.courseId&&row.replacementOpen);
  if(open){
    assert.equal(status.machineResolvableWorkComplete,false,`${status.courseId}: machine completion cannot be true while governed raster replacements remain open`);
    assert.ok((status.nextMachineActions??[]).some((x)=>/raster/i.test(x)),`${status.courseId}: open raster work must appear in nextMachineActions`);
  }
}

for(let n=1;n<=8;n++){
  const status=read(`registry/tech2-course${n}-completion-status.json`);
  const open=[...mappings.values()].flat().some((row)=>row.courseId===status.courseId&&row.replacementOpen);
  if(open) assert.equal(status.machineResolvableWorkComplete,false,`${status.courseId}: machine completion cannot be true while Technician II raster replacements remain open`);
}

console.log(`Raster backlog coverage: PASS (${svgFiles.length} public SVG files mapped; machine completion remains fail-closed while replacements are open).`);
