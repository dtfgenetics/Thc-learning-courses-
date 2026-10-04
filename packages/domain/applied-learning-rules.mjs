const OPS = new Set(['eq','neq','gt','gte','lt','lte','and','or','not','in']);

function readPath(state, path) {
  if (typeof path !== 'string' || !/^[A-Za-z0-9_.-]+$/.test(path)) throw new TypeError('invalid rule path');
  return path.split('.').reduce((value, key) => value == null ? undefined : value[key], state);
}

function valueOf(value, state) {
  if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 1 && 'var' in value) {
    return readPath(state, value.var);
  }
  return value;
}

export function evaluateRule(rule, state) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) throw new TypeError('rule must be an object');
  const keys=Object.keys(rule);
  if (keys.length !== 1 || !OPS.has(keys[0])) throw new Error('unsupported rule operator');
  const op=keys[0], args=Array.isArray(rule[op]) ? rule[op] : [rule[op]];
  const vals=()=>args.map((arg)=>arg && typeof arg==='object' && !Array.isArray(arg) && Object.keys(arg).some((key)=>OPS.has(key)) ? evaluateRule(arg,state) : valueOf(arg,state));
  if(op==='and') return vals().every(Boolean);
  if(op==='or') return vals().some(Boolean);
  if(op==='not') return !Boolean(vals()[0]);
  const [a,b]=vals();
  if(op==='eq') return a===b;
  if(op==='neq') return a!==b;
  if(op==='gt') return a>b;
  if(op==='gte') return a>=b;
  if(op==='lt') return a<b;
  if(op==='lte') return a<=b;
  if(op==='in') return Array.isArray(b) ? b.includes(a) : typeof b==='string' ? b.includes(String(a)) : false;
  return false;
}

export function evaluateScenarioRules(rules, state) {
  if (!Array.isArray(rules)) throw new TypeError('rules must be an array');
  return rules.map((rule)=>({
    id: rule.id,
    matched: evaluateRule(rule.when,state),
    outcome: evaluateRule(rule.when,state) ? (rule.then ?? null) : null
  }));
}

