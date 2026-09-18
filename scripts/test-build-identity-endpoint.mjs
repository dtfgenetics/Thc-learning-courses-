import assert from 'node:assert/strict';
import { once } from 'node:events';
import { buildPublicBuildIdentity, createAcademyWebServer } from '../apps/web/server.mjs';

const sha='0123456789abcdef0123456789abcdef01234567';

assert.deepEqual(buildPublicBuildIdentity({}), {
  service: 'thc-academy-web',
  buildId: null,
  sourceSha: null,
  exactIdentityAvailable: false
});

assert.deepEqual(buildPublicBuildIdentity({
  ACADEMY_BUILD_ID: 'deploy-20260918-001',
  ACADEMY_SOURCE_SHA: sha
}), {
  service: 'thc-academy-web',
  buildId: 'deploy-20260918-001',
  sourceSha: sha,
  exactIdentityAvailable: true
});

const malformed=buildPublicBuildIdentity({
  ACADEMY_BUILD_ID: '<script>alert(1)</script>',
  ACADEMY_SOURCE_SHA: 'short-sha'
});
assert.equal(malformed.buildId,null);
assert.equal(malformed.sourceSha,null);
assert.equal(malformed.exactIdentityAvailable,false);

const env={NODE_ENV:'production',ACADEMY_BUILD_ID:'build-42',GITHUB_SHA:sha};
const server=createAcademyWebServer({env});
server.listen(0,'127.0.0.1');
await once(server,'listening');
try{
  const base=`http://127.0.0.1:${server.address().port}`;
  const response=await fetch(`${base}/api/build-info`);
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type')??'',/^application\/json/);
  assert.deepEqual(await response.json(),{
    service:'thc-academy-web',
    buildId:'build-42',
    sourceSha:sha,
    exactIdentityAvailable:true
  });
} finally {
  server.close();
  await once(server,'close');
}

console.log('Academy public build identity endpoint: PASS');
