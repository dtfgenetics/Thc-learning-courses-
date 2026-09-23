import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const assetsRoot=path.join(root,'apps','web','public','assets');
const readJson=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

const walk=(dir)=>{
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap((entry)=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
};

const rel=(p)=>path.relative(root,p).split(path.sep).join('/');
const svgFiles=walk(assetsRoot)
  .filter((p)=>path.extname(p).toLowerCase()==='.svg')
  .map(rel)
  .sort();

const groupFor=(p)=>{
  const tech2=p.match(/^apps\/web\/public\/assets\/tech2\/course([1-8])\//);
  if(tech2) return `technician-ii-course-${tech2[1]}`;
  const tech1=p.match(/^apps\/web\/public\/assets\/course([1-7])\//);
  if(tech1) return `technician-i-course-${tech1[1]}`;
  return 'other-public-assets';
};

const groups={};
for(const file of svgFiles){
  const group=groupFor(file);
  (groups[group]??=[]).push(file);
}

const governed=[];

const course1=readJson('visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json');
for(const concept of course1.concepts??[]){
  const publicAsset=concept.baseline?.publicAsset??'';
  if(!publicAsset.toLowerCase().endsWith('.svg')) continue;
  governed.push({
    program:'Technician I',
    courseId:course1.courseId,
    id:concept.conceptId,
    title:concept.accessibility?.caption??concept.conceptId,
    sourcePath:`apps/web/public${publicAsset}`,
    currentLifecycle:'legacy-svg-compatibility-baseline',
    replacementStatus:concept.releaseApproved===true?'released':'raster-replacement-required',
    candidateFileName:concept.candidate?.fileName??null,
    candidateState:concept.candidate?.binaryState??null,
    releaseGate:'course1-production-quality-release-manifest'
  });
}

const course1Registry=readJson('visuals/ASSET-REGISTRY.json');
const alreadyMappedCourse1Paths=new Set(governed.filter((row)=>row.courseId===course1.courseId).map((row)=>row.sourcePath));
for(const asset of course1Registry.assets??[]){
  if(path.extname(asset.sourcePath??'').toLowerCase()!=='.svg'||alreadyMappedCourse1Paths.has(asset.sourcePath)) continue;
  governed.push({
    program:'Technician I',
    courseId:course1Registry.courseId,
    id:asset.id,
    title:asset.title,
    sourcePath:asset.sourcePath,
    currentLifecycle:asset.assetLifecycle??asset.status,
    replacementStatus:asset.rasterReplacement?.status??'missing',
    candidatePath:asset.rasterReplacement?.candidateSourcePath??null,
    candidateSha256:asset.rasterReplacement?.candidateSha256??null,
    releaseGate:asset.rasterReplacement?.releaseGate??null
  });
}

for(let n=2;n<=6;n++){
  const registry=readJson(`visuals/COURSE${n}-ASSET-REGISTRY.json`);
  for(const asset of registry.assets??[]){
    const legacySvg=asset.legacySource?.sourcePath ?? asset.rasterReplacement?.generatedFrom;
    if(path.extname(legacySvg??'').toLowerCase()!=='.svg') continue;
    governed.push({
      program:'Technician I',
      courseId:registry.courseId,
      id:asset.id,
      title:asset.title,
      sourcePath:legacySvg,
      currentLifecycle:asset.assetLifecycle??asset.status,
      replacementStatus:asset.rasterReplacement?.status??'missing',
      candidatePath:asset.rasterReplacement?.candidateSourcePath??asset.sourcePath??null,
      candidateSha256:asset.rasterReplacement?.candidateSha256??null,
      releaseGate:asset.rasterReplacement?.releaseGate??null
    });
  }
}

const tech2=readJson('visuals/TECH2-VISUAL-PRODUCTION-PLAN.json');
for(const course of tech2.courses??[]){
  for(const concept of course.concepts??[]){
    if(path.extname(concept.sourcePath??'').toLowerCase()!=='.svg') continue;
    governed.push({
      program:'Technician II',
      courseId:course.courseId,
      id:concept.conceptId,
      title:concept.outcome,
      sourcePath:concept.sourcePath,
      currentLifecycle:concept.status,
      replacementStatus:['approved','produced'].includes(concept.status)?'released':'raster-replacement-required',
      releaseGate:'factual-source-authority-accessibility-responsive-public-path-review'
    });
  }
}

const governedPaths=new Set(governed.map((row)=>row.sourcePath));
const unregistered=svgFiles.filter((file)=>!governedPaths.has(file));

const summary={
  policy:'Production instructional visuals must use reviewed high-resolution raster formats. SVG files are compatibility/review artifacts only unless a narrower non-instructional exception is explicitly documented.',
  allowedProductionFormats:['png','webp','jpg','jpeg'],
  totalLegacySvgFiles:svgFiles.length,
  governedRasterReplacementConcepts:governed.length,
  legacySvgFilesWithoutReplacementMapping:unregistered.length,
  groups:Object.fromEntries(Object.entries(groups).map(([name,files])=>[name,{count:files.length,files}])),
  governed,
  unregistered
};

if(process.argv.includes('--json')){
  process.stdout.write(JSON.stringify(summary,null,2)+'\n');
}else{
  console.log('THC Academy raster replacement backlog');
  console.log(`Legacy SVG files in public asset tree: ${summary.totalLegacySvgFiles}`);
  console.log(`Governed raster replacement concepts/items: ${summary.governedRasterReplacementConcepts}`);
  console.log(`Legacy SVG files without an explicit replacement mapping: ${summary.legacySvgFilesWithoutReplacementMapping}`);
  console.log('');
  for(const [name,row] of Object.entries(summary.groups)){
    console.log(`- ${name}: ${row.count}`);
  }
  console.log('');
  console.log('Use --json for the full machine-readable queue.');
}
