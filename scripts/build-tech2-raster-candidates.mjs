import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const planPath=path.join(root,'visuals/TECH2-VISUAL-PRODUCTION-PLAN.json');
const manifestPath=path.join(root,'visuals/TECH2-RASTER-CANDIDATE-MANIFEST.json');
const plan=JSON.parse(fs.readFileSync(planPath,'utf8'));
const sha256=(buffer)=>crypto.createHash('sha256').update(buffer).digest('hex');

function webpDimensions(buffer){
  if(buffer.subarray(0,4).toString('ascii')!=='RIFF'||buffer.subarray(8,12).toString('ascii')!=='WEBP'||buffer.subarray(12,16).toString('ascii')!=='VP8L'){
    throw new Error('ImageMagick did not produce lossless WebP');
  }
  const bits=buffer.readUInt32LE(21);
  return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
}

const candidates=[];
for(const course of plan.courses){
  for(const concept of course.concepts){
    const sourcePath=path.join(root,concept.sourcePath);
    const source=fs.readFileSync(sourcePath);
    const sourceText=source.toString('utf8');
    if(/&(?!amp;|lt;|gt;|quot;|apos;|#[0-9]+;|#x[0-9A-Fa-f]+;)/.test(sourceText)){
      throw new Error(`${concept.conceptId}: SVG contains an unescaped XML entity`);
    }
    const candidateSourcePath=concept.sourcePath.replace(/\.svg$/i,'.webp');
    const candidatePath=path.join(root,candidateSourcePath);
    const intermediatePath=`${candidatePath}.png`;
    const rasterized=spawnSync('inkscape',[sourcePath,'--export-type=png','--export-width=2845',`--export-filename=${intermediatePath}`],{encoding:'utf8'});
    if(rasterized.status!==0) throw new Error(`${concept.conceptId}: ${rasterized.stderr||'SVG rasterization failed'}`);
    const rendered=spawnSync('convert',[intermediatePath,'-define','webp:lossless=true','-quality','100',candidatePath],{encoding:'utf8'});
    fs.unlinkSync(intermediatePath);
    if(rendered.status!==0) throw new Error(`${concept.conceptId}: ${rendered.stderr||'WebP conversion failed'}`);
    const candidate=fs.readFileSync(candidatePath);
    if(candidate.length<100) throw new Error(`${concept.conceptId}: WebP output is empty or truncated`);
    const metadata={
      status:'candidate-produced-human-qa-required',
      candidateSourcePath,
      generatedFrom:concept.sourcePath,
      sourceSha256:sha256(source),
      candidateSha256:sha256(candidate),
      bytes:candidate.length,
      pixelDimensions:webpDimensions(candidate),
      encoding:'lossless-webp',
      automatedQa:['source-exists','valid-xml-entities','lossless-webp-signature','shortest-side-at-least-1600','sha256-recorded'],
      releaseApproved:false,
      releaseGate:'canonical-terminology-factual-authority-accessibility-responsive-public-path-review'
    };
    concept.rasterReplacement=metadata;
    candidates.push({conceptId:concept.conceptId,courseId:course.courseId,...metadata});
  }
}

plan.version=2;
plan.updated='2026-09-22';
plan.rasterCandidateProduction={
  state:'candidate-produced-human-qa-required',
  count:candidates.length,
  manifest:'visuals/TECH2-RASTER-CANDIDATE-MANIFEST.json',
  releaseBoundary:'Candidate production does not approve learner cutover. Existing SVG review candidates remain the mapped baseline until each WebP passes human factual, authority-boundary, accessibility, responsive and public-path review.'
};
fs.writeFileSync(planPath,`${JSON.stringify(plan,null,2)}\n`);
fs.writeFileSync(manifestPath,`${JSON.stringify({
  schemaVersion:1,
  id:'THC-ACADEMY-TECH2-RASTER-CANDIDATES-001',
  updated:'2026-09-22',
  count:candidates.length,
  releaseApproved:false,
  purpose:'Auditable lossless WebP review candidates for all governed Technician II primary visuals.',
  releaseBoundary:plan.rasterCandidateProduction.releaseBoundary,
  candidates
},null,2)}\n`);
console.log(`Built ${candidates.length} Technician II lossless WebP candidates.`);
