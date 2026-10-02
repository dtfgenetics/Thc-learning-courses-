import assert from 'node:assert/strict'; import {evaluateRule,evaluateScenarioRules} from '../packages/domain/applied-learning-rules.mjs';
const state={equipment:{circulationFan:'failed'},environment:{rh:70,tempC:26.8}};
assert.equal(evaluateRule({eq:[{var:'equipment.circulationFan'},'failed']},state),true);
assert.equal(evaluateRule({and:[{gt:[{var:'environment.rh'},65]},{gt:[{var:'environment.tempC'},25]}]},state),true);
const out=evaluateScenarioRules([{id:'R1',when:{eq:[{var:'equipment.circulationFan'},'failed']},then:{event:'flag-failure'}}],state);
assert.equal(out[0].matched,true); assert.equal(out[0].outcome.event,'flag-failure');
assert.throws(()=>evaluateRule({eval:['x']},state),/unsupported/);
console.log('Applied-learning rules adapter OK');
