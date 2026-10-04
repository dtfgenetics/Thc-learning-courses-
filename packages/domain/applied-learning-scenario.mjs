import { projectTimeline, projectTimelineMarkers } from './applied-learning-timeline.mjs';
import { evaluateScenarioRules } from './applied-learning-rules.mjs';

export function learnerScenarioView(scenario) {
  if (!scenario || typeof scenario !== 'object') throw new TypeError('scenario is required');
  const visibleEvents=(scenario.events ?? []).filter((event)=>event.kind!=='equipment');
  return {
    id:scenario.id,version:scenario.version,status:scenario.status,title:scenario.title,summary:scenario.summary,
    subjectId:scenario.subjectId,competencyIds:scenario.competencyIds ?? [],objectiveIds:scenario.objectiveIds ?? [],
    timeline:projectTimeline(visibleEvents),
    markers:projectTimelineMarkers(visibleEvents),
    actions:(scenario.allowedActions ?? []).map(({id,label,description})=>({id,label,description}))
  };
}

export function applyScenarioAction(scenario, actionId) {
  const action=(scenario.allowedActions ?? []).find((candidate)=>candidate.id===actionId);
  if(!action) throw new Error('unknown scenario action');
  const evaluated=evaluateScenarioRules(scenario.rules ?? [],{action:{id:actionId}});
  const match=evaluated.find((row)=>row.matched);
  return {
    scenarioId:scenario.id,actionId,
    result:match?.outcome?.result ?? 'no-change',
    outcomeCode:match?.outcome?.outcomeCode ?? 'NO_RULE_MATCH',
    score:Number(match?.outcome?.score ?? 0)
  };
}

