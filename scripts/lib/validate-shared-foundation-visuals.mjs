import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export function validateSharedFoundationVisuals({ root=process.cwd(), assets=[], registryPath }) {
  for (const asset of assets) {
    assert.match(asset.id ?? '', /^VIS-FOUNDATION-[A-Z0-9-]+$/, `${asset.id}: invalid shared-foundation visual id`);
    assert.equal(asset.status, 'produced', `${asset.id}: shared-foundation asset must be produced`);
    assert.equal(asset.deliveryType, 'embedded-visual', `${asset.id}: shared-foundation asset must be embedded instructional visual`);
    assert.ok(Array.isArray(asset.primaryLessons) && asset.primaryLessons.length > 0, `${asset.id}: primary lesson mapping required`);
    assert.ok(Array.isArray(asset.references) && asset.references.length > 0, `${asset.id}: references required`);
    assert.ok(typeof asset.title === 'string' && asset.title.trim(), `${asset.id}: title required`);
    assert.ok(typeof asset.purpose === 'string' && asset.purpose.trim(), `${asset.id}: purpose required`);
    assert.ok(typeof asset.learnerTextAlternative === 'string' && asset.learnerTextAlternative.trim().length >= 30, `${asset.id}: learner text alternative required`);
    assert.ok(typeof asset.caption === 'string' && asset.caption.trim().length >= 30, `${asset.id}: caption required`);
    assert.ok(/^\d+\.\d+\.\d+$/.test(asset.version ?? ''), `${asset.id}: semantic version required`);
    assert.equal(asset.assetLifecycle, 'production-raster-active', `${asset.id}: production raster lifecycle required`);
    assert.ok(['not-recorded','mirrored'].includes(asset.productionRasterDriveMirrorStatus), `${asset.id}: unsupported Drive mirror state`);
    assert.match(asset.learnerPath ?? '', /^\/assets\/course[3-6]\/[A-Za-z0-9._-]+\.webp$/i, `${asset.id}: learner WebP path required`);
    assert.match(asset.sourcePath ?? '', /^apps\/web\/public\/assets\/course[3-6]\/[A-Za-z0-9._-]+\.webp$/i, `${asset.id}: source WebP path required`);
    assert.equal(asset.publicDownloadUrl, `https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/${asset.sourcePath}`);

    const source=path.join(root,asset.sourcePath);
    assert.ok(fs.existsSync(source), `${asset.id}: production WebP missing`);
    const header=fs.readFileSync(source).subarray(0,12);
    assert.equal(header.subarray(0,4).toString('ascii'),'RIFF', `${asset.id}: invalid RIFF header`);
    assert.equal(header.subarray(8,12).toString('ascii'),'WEBP', `${asset.id}: invalid WebP header`);

    const raster=asset.nativeRaster;
    assert.ok(raster, `${asset.id}: nativeRaster evidence required`);
    assert.equal(raster.releaseApproved,true, `${asset.id}: raster must be release-approved`);
    assert.equal(raster.format,'webp', `${asset.id}: raster format must be WebP`);
    assert.ok(['programmatic-scientific-diagram','png'].includes(raster.sourceMasterFormat), `${asset.id}: unsupported raster source master`);
    assert.ok(Number(raster.bytes)>0, `${asset.id}: byte size required`);
    assert.ok(Number(raster.pixelWidth)>=1600, `${asset.id}: raster width below 1600px`);
    assert.ok(Number(raster.pixelHeight)>=1600, `${asset.id}: raster height below 1600px`);
    if (raster.sha256) assert.match(raster.sha256,/^[a-f0-9]{64}$/i, `${asset.id}: SHA-256 must be canonical`);

    for (const lessonId of asset.primaryLessons) {
      const lessonPath=path.join(root,'content/lessons',`${lessonId}.json`);
      assert.ok(fs.existsSync(lessonPath), `${asset.id}: mapped lesson ${lessonId} missing`);
      const lesson=JSON.parse(fs.readFileSync(lessonPath,'utf8'));
      const mapped=(lesson.content?.extensions?.primaryVisuals ?? []).find((v)=>v.assetId===asset.id);
      assert.ok(mapped, `${asset.id}: not wired in ${lessonId} content.extensions.primaryVisuals`);
      assert.equal(mapped.src,asset.learnerPath, `${asset.id}: lesson src must match registry`);
      assert.ok(typeof mapped.alt==='string' && mapped.alt.trim().length>=30, `${asset.id}: mapped alt text required`);
      assert.ok(typeof mapped.caption==='string' && mapped.caption.trim().length>=30, `${asset.id}: mapped caption required`);
      assert.equal(mapped.extensions?.releaseApproved,true, `${asset.id}: mapped release approval required`);
      assert.equal(mapped.extensions?.rasterManifest,registryPath, `${asset.id}: mapped registry path mismatch`);
    }
  }
}
