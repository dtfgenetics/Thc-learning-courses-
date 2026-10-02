import fs from 'node:fs';
import assert from 'node:assert/strict';
import { projectTimeline, projectTimelineMarkers } from '../packages/domain/applied-learning-timeline.mjs';

const fixture=JSON.parse(fs.readFileSync('content/applied-learning/fixtures/environmental-replay-24h.json','utf8'));
const timeline=projectTimeline(fixture.events);
assert.equal(timeline.timestamps.length,4);
assert.deepEqual(timeline.series.airTemperatureC,[23.5,23.0,26.8,24.6]);
assert.deepEqual(timeline.series.relativeHumidityPct,[62,64,70,64]);
assert.equal(timeline.columnar.length,3);
assert.deepEqual(timeline.columnar[0],timeline.timestamps.map((value)=>value/1000));

const markers=projectTimelineMarkers(fixture.events);
assert.deepEqual(markers.map((event)=>event.kind),['equipment','observation','intervention','outcome']);
assert.equal(markers[0].payload.state,'failed');
assert.equal(markers.at(-1).payload.state,'stabilized');

const duplicateTime=[
 {id:'ALEVT-X-1',timestamp:'2026-01-01T00:00:00Z',kind:'environment',payload:{airTemperatureC:20}},
 {id:'ALEVT-X-2',timestamp:'2026-01-01T00:00:00Z',kind:'measurement',payload:{relativeHumidityPct:50}}
];
const merged=projectTimeline(duplicateTime);
assert.equal(merged.timestamps.length,1);
assert.deepEqual(merged.series.airTemperatureC,[20]);
assert.deepEqual(merged.series.relativeHumidityPct,[50]);

console.log('Applied-learning timeline adapter OK');
