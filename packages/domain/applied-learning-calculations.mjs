function finite(name,value){ if(typeof value!=='number'||!Number.isFinite(value)) throw new TypeError(`${name} must be finite`); return value; }
export function dliFromPpfd({ppfdUmolM2S,photoperiodHours}) {
  const ppfd=finite('ppfdUmolM2S',ppfdUmolM2S), hours=finite('photoperiodHours',photoperiodHours);
  if(ppfd<0||hours<0||hours>24) throw new RangeError('invalid DLI inputs');
  return ppfd*hours*3600/1_000_000;
}
export function ppfdFromDli({dliMolM2Day,photoperiodHours}) {
  const dli=finite('dliMolM2Day',dliMolM2Day), hours=finite('photoperiodHours',photoperiodHours);
  if(dli<0||hours<=0||hours>24) throw new RangeError('invalid PPFD inputs');
  return dli*1_000_000/(hours*3600);
}
export function fahrenheitToCelsius(f){ return (finite('fahrenheit',f)-32)*5/9; }
export function celsiusToFahrenheit(c){ return finite('celsius',c)*9/5+32; }
export function litersToGallons(l){ const v=finite('liters',l); if(v<0) throw new RangeError('volume cannot be negative'); return v/3.785411784; }
export function gallonsToLiters(g){ const v=finite('gallons',g); if(v<0) throw new RangeError('volume cannot be negative'); return v*3.785411784; }

