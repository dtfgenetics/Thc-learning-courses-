import assert from 'node:assert/strict'; import {dliFromPpfd,ppfdFromDli,fahrenheitToCelsius,celsiusToFahrenheit,gallonsToLiters,litersToGallons} from '../packages/domain/applied-learning-calculations.mjs';
const dli=dliFromPpfd({ppfdUmolM2S:500,photoperiodHours:18}); assert.ok(Math.abs(dli-32.4)<1e-9);
assert.ok(Math.abs(ppfdFromDli({dliMolM2Day:dli,photoperiodHours:18})-500)<1e-9);
assert.ok(Math.abs(fahrenheitToCelsius(68)-20)<1e-9); assert.ok(Math.abs(celsiusToFahrenheit(20)-68)<1e-9);
assert.ok(Math.abs(gallonsToLiters(1)-3.785411784)<1e-12); assert.ok(Math.abs(litersToGallons(3.785411784)-1)<1e-12);
assert.throws(()=>dliFromPpfd({ppfdUmolM2S:-1,photoperiodHours:18}),RangeError);
console.log('Applied-learning calculation adapter OK');
