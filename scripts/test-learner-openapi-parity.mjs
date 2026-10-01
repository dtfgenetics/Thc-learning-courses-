import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync('apps/api/src/server.mjs','utf8');
const contract = fs.readFileSync('openapi/learner-api.yaml','utf8');

function contractRoutes(source){
  const routes=[];
  let currentPath=null;
  for(const line of source.split(/\r?\n/)){
    const pathMatch=line.match(/^  (\/me\/[^:]+(?:\{[^}]+\}[^:]*)?):\s*$/);
    if(pathMatch){ currentPath=pathMatch[1]; continue; }
    const methodMatch=line.match(/^    (get|post|put|patch|delete):\s*$/);
    if(currentPath && methodMatch){
      const normalized='/api/v1'+currentPath.replace(/\{([^}]+)\}/g,':$1');
      routes.push(`${methodMatch[1].toUpperCase()} ${normalized}`);
    }
  }
  return routes.sort();
}

const runtimeRoutes=[...server.matchAll(/route = '([A-Z]+) (\/api\/v1\/me\/[^']+)'/g)]
  .map((match)=>`${match[1]} ${match[2]}`);
if (server.includes("route = \`${req.method} /api/v1/me/profile\`")) {
  runtimeRoutes.push('GET /api/v1/me/profile', 'PUT /api/v1/me/profile');
}
runtimeRoutes.sort();
const documentedRoutes=contractRoutes(contract);

assert.equal(documentedRoutes.length>0,true,'learner OpenAPI contract must expose authenticated learner routes');
assert.deepEqual(documentedRoutes,runtimeRoutes,'learner OpenAPI route/method set must exactly match runtime route markers');
assert.match(contract,/openapi:\s*3\.1\.0/,'learner contract must use OpenAPI 3.1');
assert.match(contract,/bearerAuth:/,'learner contract must declare bearer authentication');
assert.match(contract,/academic course completion and professional credential issuance remain separate/i,'learner contract must preserve academic/credential boundary');
assert.match(contract,/privacy-bounded competency transcript/i,'transcript contract must describe privacy-bounded evidence');
assert.equal(/\/me\/.*issu(?:e|ance)|\/me\/.*credential.*issue/i.test(contract),false,'learner API must not expose credential issuance mutation');
assert.equal(/correctAnswer|answerKey|scoringKey|evaluatorNotes|response_json/i.test(contract),false,'learner OpenAPI must not expose restricted answer/evaluator fields');

console.log(`Learner OpenAPI parity: PASS (${runtimeRoutes.length} authenticated learner route/method pairs)`);
