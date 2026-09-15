import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const writeJson = (rel, value) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(value, null, 2) + '\n');
};
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const objectives = [
  {
    id: 'LO-LH-TECH1-002-01',
    competency: 'COMP-PLANT-BIO-001',
    statement: 'Execute a repeatable crop-observation route that samples representative locations and preserves room, zone, plant or bench identity.',
    bloomLevel: 'apply', status: 'draft', version: '1.0.0'
  },
  {
    id: 'LO-LH-TECH1-002-02',
    competency: 'COMP-FLOWER-001',
    statement: 'Describe cannabis developmental and reproductive stage from observable morphology while distinguishing biological stage from calendar timing.',
    bloomLevel: 'apply', status: 'draft', version: '1.0.0'
  },
  {
    id: 'LO-LH-TECH1-002-03',
    competency: 'COMP-PLANT-BIO-001',
    statement: 'Differentiate direct observation, spatial or population pattern, contextual evidence and unsupported causal diagnosis during routine crop inspection.',
    bloomLevel: 'analyze', status: 'draft', version: '1.0.0'
  },
  {
    id: 'LO-LH-TECH1-002-04',
    competency: 'COMP-PRO-QA-001',
    statement: 'Create a reconstructable crop-observation record with sample context, objective wording, useful photographs, timing, identity and unresolved uncertainty.',
    bloomLevel: 'apply', status: 'draft', version: '1.0.0'
  },
  {
    id: 'LO-LH-TECH1-002-05',
    competency: 'COMP-PRO-SOP-001',
    statement: 'Follow supplied observation and escalation procedures, documenting abnormal conditions and handing off unresolved findings without exceeding Technician I authority.',
    bloomLevel: 'apply', status: 'draft', version: '1.0.0'
  }
];
for (const objective of objectives) writeJson(`content/learning-objectives/${objective.id}.json`, objective);

const lesson = ({ id, title, competencies, learningObjectives, estimatedMinutes, references, overview, vocabulary, sections, workedExamples, commonMistakes, practicalApplication, summary, blocks = [] }) => ({
  id, title, version: '1.0.0', status: 'draft', competencies, learningObjectives, estimatedMinutes, references, assessment: null,
  content: { overview, vocabulary, sections, workedExamples, commonMistakes, practicalApplication, summary, ...(blocks.length ? { blocks } : {}) }
});

const lessons = [
  lesson({
    id: 'LESSON-LH-TECH1-002-01',
    title: 'Structured Crop Walks and Representative Observation',
    competencies: ['COMP-PLANT-BIO-001'],
    learningObjectives: ['LO-LH-TECH1-002-01', 'LO-LH-TECH1-002-03'],
    estimatedMinutes: 55,
    references: ['REF-PLANT-BIO-001'],
    overview: 'A useful crop walk is a repeatable evidence-collection process, not a search for the worst-looking plant. Technician I learners practice confirming crop identity, selecting representative observation points, scanning whole-crop patterns before close inspection, and preserving location and sample context so later decisions are based on evidence rather than memory or sampling bias.',
    vocabulary: [
      { term: 'representative observation', definition: 'An observation chosen to describe the crop or a defined area without intentionally selecting only convenient or abnormal plants.' },
      { term: 'sampling bias', definition: 'A systematic distortion caused when the observed plants or locations are not representative of the population or question being evaluated.' },
      { term: 'spatial pattern', definition: 'The distribution of an observation across locations, such as isolated, edge-concentrated, zonal or room-wide occurrence.' },
      { term: 'observation route', definition: 'A repeatable sequence of crop locations used to reduce omissions and make comparisons over time more meaningful.' }
    ],
    sections: [
      { title: 'Start with purpose and identity', body: 'Before inspecting plants, confirm why the walk is being performed and which room, zone, cultivar or lot, bench or tray, developmental stage and time apply. These identifiers prevent a technically accurate note from being attached to the wrong crop or process context.', references: ['REF-PLANT-BIO-001'] },
      { title: 'Sample the crop instead of the problem', body: 'A representative route commonly includes center and edge positions, different irrigation or environmental zones, multiple canopy positions where relevant, and any defined high-risk or follow-up locations. The exact route is facility specific; the transferable rule is to avoid drawing room-wide conclusions from one convenient or visibly abnormal plant.', references: ['REF-PLANT-BIO-001'] },
      { title: 'Observe the whole pattern before the detail', body: 'First compare uniformity, posture, architecture, color, developmental consistency and the distribution of abnormalities. Then inspect leaves, stems, nodes, roots or media when visible, and reproductive structures. Preserving the scale of the pattern helps separate an isolated event from a zone-level or room-wide condition.', references: ['REF-PLANT-BIO-001'] }
    ],
    workedExamples: [
      'One wilted plant among otherwise upright neighbors is documented as an isolated observation and compared with nearby plants rather than recorded as proof that the entire room needs irrigation.',
      'An edge-only difference in plant height is recorded with exact locations and representative comparison points before environmental, light, irrigation or genetic causes are considered.'
    ],
    commonMistakes: [
      'Inspecting only the most damaged plants and calling the result representative of the whole room.',
      'Recording a finding without the room, zone, plant, bench or other identity needed to reconstruct where it occurred.',
      'Zooming immediately to one leaf and missing whether the same pattern is isolated, zonal or widespread.'
    ],
    practicalApplication: 'Given a room map with 120 plants, design and execute a simulated observation route that includes representative edges, center positions and defined process zones. Record sample size, route, whole-crop pattern and three detailed plant observations without assigning unsupported causes.',
    summary: 'Technician I observation begins with a defined purpose, correct identity and a representative route. Whole-crop pattern comes before close-up detail, and every finding retains enough location and sample context to support comparison, escalation and later diagnosis.',
    blocks: [
      { type: 'steps', title: 'Repeatable crop-walk sequence', items: [
        { title: 'Confirm purpose', body: 'Know whether the walk is routine, follow-up, pre-work, post-event or another supplied purpose.' },
        { title: 'Confirm identity', body: 'Record room, zone, crop or lot, date/time and any plant, bench or tray identifiers required by the task.' },
        { title: 'Follow the route', body: 'Use the supplied or justified representative route instead of selecting only obvious problem plants.' },
        { title: 'Scan whole-crop pattern', body: 'Note uniformity, posture, architecture, color and developmental distribution before close inspection.' },
        { title: 'Inspect structures', body: 'Describe relevant leaves, stems, nodes, roots or media when visible, and reproductive structures.' },
        { title: 'Preserve pattern and context', body: 'Record whether findings are isolated, zonal, edge-associated, widespread or otherwise spatially organized.' }
      ], references: ['REF-PLANT-BIO-001'] },
      { type: 'scenario', title: 'The worst plant is at the door', setting: 'A visibly stressed plant is the first plant encountered. The rest of the room has not been inspected.', prompt: 'What should the technician do before making a room-level statement?', options: ['Use the doorway plant as the room sample because it is easiest to access', 'Follow the representative route and compare multiple locations before describing room-level pattern', 'Diagnose the doorway plant and apply the same diagnosis to all plants', 'Skip location notes until the cause is known'], answer: 'Follow the representative route and compare multiple locations before describing room-level pattern', feedback: 'A conspicuous plant can be important, but it does not establish the distribution of a condition. Representative observation is needed before making a room-level statement.', references: ['REF-PLANT-BIO-001'] }
    ]
  }),
  lesson({
    id: 'LESSON-LH-TECH1-002-02',
    title: 'Growth Stage and Reproductive Morphology in Crop Records',
    competencies: ['COMP-PLANT-BIO-001', 'COMP-FLOWER-001'],
    learningObjectives: ['LO-LH-TECH1-002-02', 'LO-LH-TECH1-002-03'],
    estimatedMinutes: 55,
    references: ['REF-PLANT-BIO-001', 'REF-FLOWER-MORPH-2023-001'],
    overview: 'Developmental stage is a biological description supported by visible morphology, not simply the number of days since germination, transplant or a photoperiod change. Learners practice using plant structures and reproductive development as evidence, documenting mixed-stage populations honestly, and escalating unexpected reproductive morphology without turning cultivar labels or schedules into proof.',
    vocabulary: [
      { term: 'developmental stage', definition: 'A biological phase described by observable plant development rather than by calendar time alone.' },
      { term: 'reproductive morphology', definition: 'Observable structures associated with sexual and flowering development that can be documented directly.' },
      { term: 'inflorescence', definition: 'A reproductive shoot system bearing flowers and associated structures.' },
      { term: 'phenology', definition: 'The study or description of recurring biological developmental events and their timing in relation to conditions.' }
    ],
    sections: [
      { title: 'Morphology supports stage assignment', body: 'Cannabis changes structurally through vegetative and reproductive development. Schedule information is useful context, but stage records are stronger when they describe observable features such as node and branch development, emergence of reproductive structures, inflorescence development and maturation-related morphology.', references: ['REF-PLANT-BIO-001', 'REF-FLOWER-MORPH-2023-001'] },
      { title: 'Calendar time is context, not a universal stage rule', body: 'Development varies with genotype, plant history and environment. A study or facility schedule can describe expected timing, but it should not be converted into a universal claim that every plant reaches the same biological stage on the same day. Record the schedule and the morphology separately when both matter.', references: ['REF-FLOWER-MORPH-2023-001'] },
      { title: 'Mixed development is data', body: 'When a crop is not developmentally uniform, record the distribution rather than forcing every plant into one label. Unexpected reproductive structures, atypical development or meaningful stage differences should be photographed and escalated according to crop and genetics procedures.', references: ['REF-PLANT-BIO-001', 'REF-FLOWER-MORPH-2023-001'] }
    ],
    workedExamples: [
      'A room is scheduled as flower week two, but the record also describes the visible reproductive structures and notes that several plants lag behind the dominant morphology.',
      'Unexpected reproductive morphology is documented with plant identity, location and clear close and context photographs, then escalated without claiming a genetic cause that has not been verified.'
    ],
    commonMistakes: [
      'Assigning developmental stage from days since a schedule event without checking morphology.',
      'Using cultivar name as proof that a plant must display a specific reproductive pattern.',
      'Ignoring mixed-stage plants because the room schedule contains only one stage label.'
    ],
    practicalApplication: 'Review a simulated crop containing vegetative plants, plants entering reproductive development and a smaller group with delayed or unexpected morphology. Record the dominant stage, exceptions, supporting visible features and escalation needs without using schedule timing as the sole evidence.',
    summary: 'Growth-stage records are strongest when morphology and schedule context are kept distinct. Technicians describe what structures are present, document developmental distribution, preserve uncertainty and escalate unexpected reproductive findings rather than forcing the crop to match a calendar label.',
    blocks: [
      { type: 'comparison', title: 'Morphology versus calendar-only staging', left: { label: 'Evidence-based stage note', body: 'Describes visible developmental structures and distribution, with schedule timing retained as context.' }, right: { label: 'Calendar-only stage note', body: 'Assigns stage solely from days since germination, transplant or photoperiod change, even when plant morphology differs.' }, references: ['REF-FLOWER-MORPH-2023-001'] },
      { type: 'callout', title: 'Evidence boundary', tone: 'evidence', body: 'The cited life-cycle morphology study supports using visible development to characterize stage. Its observations should not be converted into universal day-by-day timing rules for every cultivar or production system.', references: ['REF-FLOWER-MORPH-2023-001'] }
    ]
  }),
  lesson({
    id: 'LESSON-LH-TECH1-002-03',
    title: 'Observation, Pattern, Context and Diagnostic Boundaries',
    competencies: ['COMP-PLANT-BIO-001', 'COMP-PRO-SOP-001'],
    learningObjectives: ['LO-LH-TECH1-002-03', 'LO-LH-TECH1-002-05'],
    estimatedMinutes: 60,
    references: ['REF-PLANT-BIO-001'],
    overview: 'A Technician I creates reliable evidence for diagnosis without pretending that every visible symptom proves a cause. This lesson trains learners to separate direct observations from interpretations, describe incidence and spatial pattern, add available environmental or work-history context, recognize urgent abnormalities, and escalate when the evidence or authority boundary does not support an independent conclusion.',
    vocabulary: [
      { term: 'observation', definition: 'A description of directly visible, measured or otherwise documented evidence without an unsupported causal conclusion.' },
      { term: 'interpretation', definition: 'A reasoned meaning assigned to observations that may remain provisional until additional evidence confirms it.' },
      { term: 'incidence', definition: 'The proportion or count of observed units showing a defined condition within the sampled population.' },
      { term: 'differential', definition: 'A set of plausible explanations considered when evidence does not yet support one confirmed cause.' }
    ],
    sections: [
      { title: 'Describe before you diagnose', body: 'Color change, tissue damage, posture, architecture, root appearance, developmental differences and spatial patterns can be recorded directly. A causal label such as nutrient deficiency, pathogen, irrigation failure or genetic weakness requires supporting evidence. Technician I records the observation and routes the case when diagnosis exceeds the task or available evidence.', references: ['REF-PLANT-BIO-001'] },
      { title: 'Pattern changes the investigation', body: 'One plant, one bench, one irrigation zone, one room edge and an entire room represent different evidence patterns. Record counts or proportions where practical, location and severity using supplied definitions, and whether neighboring comparison plants show the same condition.', references: ['REF-PLANT-BIO-001'] },
      { title: 'Context strengthens a note without proving cause', body: 'Recent irrigation, environmental readings, lighting or equipment events, transplant or canopy work, IPM history and developmental stage can make an observation more useful. Context should be attached as context unless the supplied procedure and evidence justify a causal conclusion.', references: ['REF-PLANT-BIO-001'] },
      { title: 'Escalate consequence and uncertainty', body: 'Sudden widespread wilt, suspected spreading pest or disease evidence, unexpected reproductive morphology, strong root-zone abnormality, substantial zone differences or damage associated with equipment or work can require prompt escalation. Follow the supplied procedure and preserve the original condition before changing it when safe to do so.', references: ['REF-PLANT-BIO-001'] }
    ],
    workedExamples: [
      'Older lower leaves on 6 of 20 sampled plants in Zone B show interveinal yellowing. The note records distribution, location, photos and available root-zone measurements without declaring a specific deficiency.',
      'A room-wide droop appears shortly after a scheduled irrigation event. The technician records the timing and pattern, checks supplied irrigation and environmental status, and escalates rather than independently changing the control strategy.'
    ],
    commonMistakes: [
      'Replacing an objective description with a disease or nutrient label that has not been verified.',
      'Recording an environmental or irrigation event as proof of cause rather than as context.',
      'Changing conditions before documenting the original abnormal state when there is no immediate safety reason to do so.'
    ],
    practicalApplication: 'Sort a set of crop notes into direct observation, context, interpretation and unsupported diagnosis. Rewrite weak notes to include location, distribution, developmental context and escalation status, then identify which cases require immediate versus routine follow-up under the supplied procedure.',
    summary: 'Technician I observation protects the distinction between evidence and diagnosis. Strong notes preserve what changed, where, how widely, under what context and what was escalated, allowing a qualified person to investigate without inheriting an unsupported conclusion.',
    blocks: [
      { type: 'table', title: 'Evidence layers in a crop note', columns: ['Layer', 'Example', 'How to treat it'], rows: [
        ['Direct observation', 'Six lower leaves show interveinal yellowing', 'Record as observed evidence'],
        ['Pattern', 'Six of twenty sampled plants, concentrated in Zone B', 'Record distribution and sample context'],
        ['Context', 'Irrigation event completed 45 minutes earlier', 'Attach as relevant history, not automatic proof'],
        ['Interpretation', 'Irrigation delivery could be involved', 'Keep provisional unless evidence supports confirmation'],
        ['Unsupported diagnosis', 'The room has a specific deficiency', 'Do not record as fact without sufficient evidence/authority']
      ], references: ['REF-PLANT-BIO-001'] },
      { type: 'scenario', title: 'One zone droops after irrigation', setting: 'Plants in one irrigation zone are drooping while the rest of the room remains upright. A scheduled irrigation event just completed.', prompt: 'What is the strongest Technician I response?', options: ['Record irrigation failure as confirmed and reprogram the controller', 'Record the zone pattern, compare representative points, check supplied irrigation/environment status and escalate unresolved deviation', 'Water the entire room again because droop always means drought', 'Delete the observation if plants may recover later'], answer: 'Record the zone pattern, compare representative points, check supplied irrigation/environment status and escalate unresolved deviation', feedback: 'The spatial pattern and timing are useful evidence, but neither proves the cause or authorizes independent control redesign.', references: ['REF-PLANT-BIO-001'] }
    ]
  }),
  lesson({
    id: 'LESSON-LH-TECH1-002-04',
    title: 'Crop Observation Records, Photographs and Shift Handoff',
    competencies: ['COMP-PRO-QA-001', 'COMP-PRO-SOP-001'],
    learningObjectives: ['LO-LH-TECH1-002-04', 'LO-LH-TECH1-002-05'],
    estimatedMinutes: 60,
    references: ['REF-MHRA-GXP-DATA-INTEGRITY', 'REF-PLANT-BIO-001'],
    overview: 'Observation only becomes operational evidence when another qualified person can reconstruct what was inspected and what remains unresolved. Learners build crop records that preserve identity, time, sample route, objective descriptions, photographs, available context, actions and escalation. Photography is treated as evidence: images retain plant and location identity and avoid edits that can materially change symptom appearance.',
    vocabulary: [
      { term: 'reconstructable record', definition: 'A record containing enough identity, timing, context and history for another qualified person to understand what occurred.' },
      { term: 'photo context', definition: 'The identity, location, scale or scene information needed to interpret a crop image correctly.' },
      { term: 'handoff', definition: 'A structured transfer of completed work, observations, deviations, unresolved conditions and priorities to the next responsible person or shift.' },
      { term: 'uncertainty', definition: 'A clearly stated limit in what the available evidence supports, preserved rather than hidden by an invented conclusion.' }
    ],
    sections: [
      { title: 'A crop note needs identity and timing', body: 'A useful record identifies the room or zone, crop or batch, plant or bench when relevant, date/time, developmental context and the person or controlled system responsible for the entry. A technically correct observation attached to the wrong location or time can mislead later decisions.', references: ['REF-MHRA-GXP-DATA-INTEGRITY'] },
      { title: 'Photographs preserve both detail and context', body: 'When photos are required, capture an overall plant or area view plus a close view of the relevant structure when practical. Link the image to crop identity and time. Avoid filters or edits that materially alter color or appearance; retake under more consistent lighting when the image is not reliable enough for comparison.', references: ['REF-PLANT-BIO-001', 'REF-MHRA-GXP-DATA-INTEGRITY'] },
      { title: 'Handoffs distinguish done, observed and unresolved', body: 'The receiving person should be able to tell what was completed, what was observed, what actions were taken, what conditions remain unresolved, what was escalated and what should be checked next. Missing or uncertain information remains clearly identified instead of being filled with a guess.', references: ['REF-MHRA-GXP-DATA-INTEGRITY'] },
      { title: 'Corrections preserve the observation history', body: 'If an observation record is corrected, use the supplied record-control method so the original history remains understandable. Do not silently replace a plant identity, timestamp or finding in a way that makes the record appear to have always contained the corrected information.', references: ['REF-MHRA-GXP-DATA-INTEGRITY'] }
    ],
    workedExamples: [
      'A photo set includes a whole-plant image and a close image of the affected leaf, both tied to Room 2, Zone C, Plant 2C-17, date/time and the corresponding written observation.',
      'A shift handoff states that Zone B was rechecked, documents the remaining pattern, notes that the cause is unresolved, records who was notified and specifies the next required observation rather than writing only “watch plants.”'
    ],
    commonMistakes: [
      'Saving symptom photographs without plant, room or zone identity.',
      'Using color filters, enhancement or inconsistent lighting as the primary evidence for a color-related symptom.',
      'Writing a handoff that lists completed tasks but omits unresolved abnormalities or uncertainty.',
      'Silently overwriting the original observation when correcting an identity or timestamp error.'
    ],
    practicalApplication: 'Complete a simulated crop observation report from a room map, image set and environmental/work-history packet. The report must identify the sample route, preserve crop and photo identity, separate observation from interpretation, document escalation and produce a shift handoff that another learner can reconstruct without seeing the original room.',
    summary: 'Crop records turn observation into transferable evidence. Preserve identity, timing, sample context, objective wording, photographs, actions, uncertainty and follow-up so the next qualified person can reconstruct the crop state and continue the work without guessing.',
    blocks: [
      { type: 'document', title: 'Minimum crop-observation record', description: 'Exact fields vary by facility, but the record should preserve enough context for reconstruction.', fields: [
        { label: 'Crop identity', value: 'Room/zone plus cultivar, lot, batch, bench, tray or plant ID as required' },
        { label: 'Date/time', value: 'When the observation actually occurred' },
        { label: 'Purpose and route', value: 'Why the crop was inspected and how representative points were selected' },
        { label: 'Developmental context', value: 'Observed stage/morphology with schedule context when relevant' },
        { label: 'Observation and pattern', value: 'Objective findings plus sample size, distribution and severity terms defined by procedure' },
        { label: 'Photo evidence', value: 'Context and close views linked to identity and time when required' },
        { label: 'Available context', value: 'Relevant measurements or work history kept distinct from confirmed cause' },
        { label: 'Action/escalation', value: 'What was done, who was notified and what remains unresolved' },
        { label: 'Handoff/follow-up', value: 'Next check, hold, priority or open question for the receiving role' }
      ], references: ['REF-MHRA-GXP-DATA-INTEGRITY', 'REF-PLANT-BIO-001'] },
      { type: 'callout', title: 'Evidence boundary', tone: 'evidence', body: 'Data-integrity principles are used here as a transferable quality framework for trustworthy cultivation records. They are not presented as a claim that pharmaceutical GxP regulations automatically govern every cannabis cultivation record.', references: ['REF-MHRA-GXP-DATA-INTEGRITY'] }
    ]
  })
];
for (const item of lessons) writeJson(`content/lessons/${item.id}.json`, item);

const module = {
  id: 'MOD-LH-TECH1-002-OBSERVATION',
  title: 'Technician Crop Observation, Development & Records',
  version: '1.0.0',
  status: 'draft',
  lessons: lessons.map((x) => x.id),
  competencies: ['COMP-PLANT-BIO-001', 'COMP-FLOWER-001', 'COMP-PRO-QA-001', 'COMP-PRO-SOP-001'],
  assessment: 'ASSESS-LH-TECH1-002-M01'
};
writeJson(`content/modules/${module.id}.json`, module);

const items = [
  ['001','COMP-PLANT-BIO-001','LO-LH-TECH1-002-01','apply','moderate','scenario','A routine crop walk begins at the room entrance where one plant is badly wilted. What is the best next step before describing the room-level condition?',['Use the wilted plant as the room sample because it is obvious','Follow the supplied representative route and compare multiple locations before describing the room-level pattern','Diagnose the room as under-watered and water every plant','Remove the plant so the record is not biased'],1,'One conspicuous plant does not establish the distribution of a condition. A representative route is needed before a room-level statement.',['REF-PLANT-BIO-001']],
  ['002','COMP-PLANT-BIO-001','LO-LH-TECH1-002-01','apply','moderate','multiple-choice','Which observation plan best reduces location sampling bias in a room with multiple irrigation zones?',['Inspect only plants nearest the door','Inspect only the plants that look different','Use representative points across edges, center and relevant process zones defined by the route','Choose plants from one bench and multiply the result'],2,'Representative observation intentionally samples relevant areas instead of relying on convenience or visible abnormality alone.',['REF-PLANT-BIO-001']],
  ['003','COMP-PLANT-BIO-001','LO-LH-TECH1-002-01','analyze','moderate','scenario','A technician inspected 12 plants but did not record where they were located. What is the main evidence problem?',['The sample is automatically too small','The observations cannot be reliably reconstructed or interpreted spatially','The plants must be reinspected only at night','Location never matters when photographs exist'],1,'Without location context, another person cannot determine the spatial distribution or reproduce the observation route.',['REF-PLANT-BIO-001']],
  ['004','COMP-PLANT-BIO-001','LO-LH-TECH1-002-01','apply','easy','multiple-choice','What should generally be observed before zooming in on a single leaf symptom?',['The room-wide or whole-plant pattern and uniformity','The likely nutrient brand involved','The final diagnosis','The harvest date'],0,'Whole-crop and whole-plant pattern provides context for interpreting a local structure or symptom.',['REF-PLANT-BIO-001']],
  ['005','COMP-FLOWER-001','LO-LH-TECH1-002-02','apply','moderate','scenario','A room schedule says flower week two, but several plants show less reproductive development than the rest. What is the best record?',['All plants are flower week two because the schedule controls biology','Record the visible developmental distribution and keep the schedule as separate context','Change the cultivar name for the lagging plants','Ignore the lagging plants because they are a minority'],1,'Developmental stage should be supported by observable morphology; schedule timing is useful context but not proof that every plant is biologically identical.',['REF-FLOWER-MORPH-2023-001']],
  ['006','COMP-FLOWER-001','LO-LH-TECH1-002-02','understand','easy','multiple-choice','Why should developmental stage not be assigned from days since a photoperiod change alone?',['Cannabis has no reproductive development','Observable development can vary with genotype, history and environment','Calendar dates are never useful context','Only root color defines stage'],1,'Calendar timing can provide context, but observable morphology is required for a defensible biological stage description.',['REF-FLOWER-MORPH-2023-001']],
  ['007','COMP-FLOWER-001','LO-LH-TECH1-002-02','apply','moderate','scenario','Unexpected reproductive structures are observed on one identified plant. What is the strongest Technician I action?',['Record plant identity, location and clear morphology evidence and escalate according to procedure','Declare the entire cultivar genetically unstable','Remove every plant without documentation','Change the record to match the expected schedule'],0,'Unexpected reproductive morphology should be documented as observed and escalated without turning limited evidence into a broad causal claim.',['REF-PLANT-BIO-001','REF-FLOWER-MORPH-2023-001']],
  ['008','COMP-FLOWER-001','LO-LH-TECH1-002-02','analyze','moderate','scenario','Most plants show similar inflorescence development, while about 15% visibly lag. Which statement is best?',['The crop has one uniform stage because a majority agrees','Document the dominant morphology and the lagging subgroup rather than forcing one label on every plant','The lagging plants are necessarily diseased','Stage can only be determined after harvest'],1,'Mixed development is meaningful evidence and should be recorded as a distribution.',['REF-FLOWER-MORPH-2023-001']],
  ['009','COMP-PLANT-BIO-001','LO-LH-TECH1-002-03','analyze','moderate','scenario','Six of twenty sampled plants in Zone B show interveinal yellowing on older lower leaves. Which note best preserves the evidence boundary?',['Zone B definitely has magnesium deficiency','Six of twenty sampled Zone B plants show interveinal yellowing on older lower leaves; photos and available root-zone measurements attached','The cultivar is weak','The room looks hungry'],1,'The stronger note records visible evidence, distribution and context without asserting a cause that has not been established.',['REF-PLANT-BIO-001']],
  ['010','COMP-PLANT-BIO-001','LO-LH-TECH1-002-03','analyze','moderate','scenario','One plant is wilted while adjacent plants on the same bench remain upright. What is the most useful interpretation at this stage?',['The whole room needs more water','The finding is currently isolated and should be documented and compared before a broader cause is claimed','The cultivar cannot tolerate the room','All irrigation emitters have failed'],1,'An isolated pattern supports a different investigation path than a room-wide pattern; it does not establish a room-wide cause.',['REF-PLANT-BIO-001']],
  ['011','COMP-PLANT-BIO-001','LO-LH-TECH1-002-03','apply','moderate','multiple-choice','How should a recent irrigation event be treated when documenting a new crop abnormality?',['As useful context unless evidence and procedure establish it as the cause','As proof that irrigation caused the abnormality','As irrelevant and omitted from the record','As permission to redesign the irrigation program'],0,'Work history can strengthen context without automatically proving causation.',['REF-PLANT-BIO-001']],
  ['012','COMP-PLANT-BIO-001','LO-LH-TECH1-002-03','analyze','hard','scenario','Plants along one room edge are shorter with longer internodes than plants in the center. What is the best first record?',['Bad genetics on the edge','A spatially concentrated edge pattern with representative plant measurements and available environment/light/irrigation context','The entire room needs a new lighting plan','Remove edge plants before taking photographs'],1,'Preserving the spatial pattern and available context is more defensible than assigning a cause before evidence supports it.',['REF-PLANT-BIO-001']],
  ['013','COMP-PRO-QA-001','LO-LH-TECH1-002-04','apply','moderate','multiple-choice','Which photo record is strongest for a color-related leaf observation?',['A filtered close-up with no plant ID','A whole-plant context image plus a clear close image linked to plant/location identity and time','A social-media screenshot with unknown lighting','Any image is sufficient if the technician remembers the plant'],1,'Context and identity make the image reconstructable, while filters or unknown provenance can undermine comparison.',['REF-PLANT-BIO-001','REF-MHRA-GXP-DATA-INTEGRITY']],
  ['014','COMP-PRO-QA-001','LO-LH-TECH1-002-04','apply','moderate','scenario','A symptom photo is strongly color-shifted by lighting. What is the best evidence action when conditions allow?',['Increase saturation until the symptom is obvious','Retake under more consistent or neutral lighting and preserve crop identity','Use the image and omit the lighting issue','Convert it to a stylized filter'],1,'When color is part of the observation, a more faithful image is preferable to editing that can change symptom appearance.',['REF-PLANT-BIO-001','REF-MHRA-GXP-DATA-INTEGRITY']],
  ['015','COMP-PRO-QA-001','LO-LH-TECH1-002-04','analyze','moderate','scenario','A crop note says only “plants look bad today.” What makes the record inadequate?',['It is too short and lacks objective condition, identity, distribution and useful context','It contains no diagnosis','It does not name a fertilizer','It is written in present tense'],0,'Vague wording does not allow another person to reconstruct what was actually observed.',['REF-MHRA-GXP-DATA-INTEGRITY']],
  ['016','COMP-PRO-QA-001','LO-LH-TECH1-002-04','analyze','hard','scenario','A technician later realizes a photo was linked to the wrong plant ID. What should happen?',['Silently replace the ID so the record appears correct from the start','Use the controlled correction method so the original history and corrected identity remain reconstructable','Delete the entire crop walk','Keep the wrong ID because corrections are never allowed'],1,'Corrections should preserve the true record history rather than silently rewriting it.',['REF-MHRA-GXP-DATA-INTEGRITY']],
  ['017','COMP-PRO-SOP-001','LO-LH-TECH1-002-05','apply','moderate','scenario','A sudden room-wide droop is observed. What is the strongest Technician I response?',['Document the room-wide pattern, check the supplied relevant status information and escalate promptly under procedure','Independently reprogram environmental controls','Wait until the next shift without recording it','Assume the cultivar normally behaves this way'],0,'A widespread sudden change can have significant consequence. Technician I documents and checks within scope, then escalates rather than redesigning control strategy.',['REF-PLANT-BIO-001']],
  ['018','COMP-PRO-SOP-001','LO-LH-TECH1-002-05','apply','moderate','scenario','Plant damage appears immediately after a canopy-work order was completed. What should the observation record include?',['Only the damage description; work history should be hidden','Location and pattern of damage plus the relevant work-order/shift context and escalation status','A statement that the worker definitely caused the damage','No record unless the cause is confirmed'],1,'Relevant work history should be connected to the observation without converting timing alone into proof of cause.',['REF-PLANT-BIO-001']],
  ['019','COMP-PRO-SOP-001','LO-LH-TECH1-002-05','apply','moderate','multiple-choice','Which handoff best preserves an unresolved observation?',['Zone B issue fixed','Zone B rechecked at 14:00; 4 of 12 sampled plants remain wilted; cause unresolved; lead notified; next check due per work order','Plants still weird','No note until a diagnosis is confirmed'],1,'A useful handoff states what was checked, what remains, uncertainty, escalation and the next required action.',['REF-MHRA-GXP-DATA-INTEGRITY']],
  ['020','COMP-PRO-SOP-001','LO-LH-TECH1-002-05','analyze','hard','scenario','A technician suspects disease spread but the task does not authorize diagnosis or treatment selection. What is the best response?',['Choose a pesticide based on the symptom','Document location and evidence, preserve supplied quarantine boundaries and escalate according to procedure','Move affected plants through clean areas for closer viewing','Record a confirmed disease name so the next shift acts faster'],1,'The technician preserves evidence and containment boundaries while escalating work outside their diagnostic or treatment authority.',['REF-PLANT-BIO-001']]
];

const questionObjects = items.map(([num, competency, objective, bloomLevel, difficulty, type, stem, choices, correct, rationale, references]) => ({
  id: `ITEM-LH-TECH1-002-${num}`,
  version: 1,
  status: 'draft',
  purpose: 'summative',
  competency,
  objective,
  bloomLevel,
  difficulty,
  type,
  stem,
  choices,
  correct,
  rationale,
  references,
  extensions: { courseId: 'COURSE-LH-TECH1-002', itemSet: 'course2-v1' }
}));
for (const q of questionObjects) writeJson(`content/questions/${q.id}.json`, q);

const allItemIds = questionObjects.map((x) => x.id);
const assessmentBase = {
  version: '1.0.0', status: 'draft',
  competencies: ['COMP-PLANT-BIO-001', 'COMP-FLOWER-001', 'COMP-PRO-QA-001', 'COMP-PRO-SOP-001'],
  objectives: objectives.map((x) => x.id),
  passingScorePercent: 80,
  randomizeItems: true,
  randomizeChoices: true,
  accommodations: { allowExtendedTime: true, allowAlternativeAccessiblePresentation: true }
};
writeJson('content/assessments/ASSESS-LH-TECH1-002-M01.json', {
  ...assessmentBase,
  id: 'ASSESS-LH-TECH1-002-M01',
  title: 'Course 002 Module — Crop Observation, Development & Records Check',
  purpose: 'formative',
  items: allItemIds.slice(0, 12),
  maxAttempts: null,
  feedbackMode: 'immediate'
});
writeJson('content/assessments/ASSESS-LH-TECH1-002-FINAL.json', {
  ...assessmentBase,
  id: 'ASSESS-LH-TECH1-002-FINAL',
  title: 'Plant Observation, Growth Stages & Crop Records — Course Assessment',
  purpose: 'summative',
  items: allItemIds,
  maxAttempts: null,
  cooldownHours: 0,
  feedbackMode: 'post-attempt-domain-level',
  totalItems: 20,
  blueprint: [
    { competency: 'COMP-PLANT-BIO-001', items: 8, cognitiveTarget: 'Representative crop inspection, evidence patterns and observation-versus-diagnosis reasoning' },
    { competency: 'COMP-FLOWER-001', items: 4, cognitiveTarget: 'Morphology-based developmental and reproductive-stage observation' },
    { competency: 'COMP-PRO-QA-001', items: 4, cognitiveTarget: 'Reconstructable observation records and photo evidence quality' },
    { competency: 'COMP-PRO-SOP-001', items: 4, cognitiveTarget: 'Escalation, handoff and authority-boundary decisions' }
  ],
  itemSelection: {
    minimumActiveItemsPerCompetency: 1,
    targetBankItemsPerCompetency: 10,
    requireReferenceBackedItems: true,
    requireHumanAssessmentReview: true
  },
  extensions: {
    courseId: 'COURSE-LH-TECH1-002',
    linkedCredentialPractical: 'PRACTICAL-TECH1-A',
    bankStatus: 'development-seed',
    bankExpansionTarget: 30,
    completionModel: 'The course assessment is development evidence only while the course remains draft. Credential performance still requires the mapped Technician I practical and program-level release gates.'
  }
});

const coursePath = 'content/courses/COURSE-LH-TECH1-002.json';
const course = readJson(coursePath);
course.version = '0.2.0';
course.modules = ['MOD-PLANT-BIO-001', 'MOD-FLOWER-001', 'MOD-LH-TECH1-001-RECORDS', 'MOD-LH-TECH1-002-OBSERVATION'];
course.finalAssessment = 'ASSESS-LH-TECH1-002-FINAL';
course.learningOutcomes = [
  'Execute a repeatable crop-observation route and preserve plant, room, zone, time and sample context.',
  'Describe cannabis developmental and reproductive stage from observable morphology while keeping schedule timing as context rather than proof.',
  'Separate direct observation, population or spatial pattern, contextual evidence and unsupported causal diagnosis.',
  'Create reconstructable crop records and image evidence that preserve identity, timing, uncertainty, escalation and shift-handoff needs.'
];
course.extensions = {
  ...course.extensions,
  maturity: 'instruction-assessment-draft',
  developmentDependencies: ['MOD-PLANT-BIO-001', 'MOD-FLOWER-001', 'MOD-LH-TECH1-001-RECORDS', 'MOD-LH-TECH1-002-OBSERVATION'],
  dedicatedCourseAssessmentRequired: false,
  dedicatedPerformanceValidationRequired: true,
  mappedPractical: 'PRACTICAL-TECH1-A',
  humanTechnicalReviewRequired: true,
  accessibilityReviewRequired: true,
  assessmentBankExpansionTarget: 30
};
writeJson(coursePath, course);

const course2Test = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\n\nconst root = process.cwd();\nconst read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));\nconst exists = (p) => fs.existsSync(path.join(root, p));\nconst course = read('content/courses/COURSE-LH-TECH1-002.json');\nassert.equal(course.status, 'draft');\nassert.equal(course.finalAssessment, 'ASSESS-LH-TECH1-002-FINAL');\nassert.ok(course.modules.includes('MOD-LH-TECH1-002-OBSERVATION'));\nassert.equal(course.extensions?.dedicatedCourseAssessmentRequired, false);\nassert.equal(course.extensions?.dedicatedPerformanceValidationRequired, true);\n\nconst module = read('content/modules/MOD-LH-TECH1-002-OBSERVATION.json');\nassert.equal(module.lessons.length, 4);\nassert.equal(module.assessment, 'ASSESS-LH-TECH1-002-M01');\nfor (const lessonId of module.lessons) {\n  assert.ok(exists(\`content/lessons/\${lessonId}.json\`), \`missing Course 002 lesson \${lessonId}\`);\n  const lesson = read(\`content/lessons/\${lessonId}.json\`);\n  assert.ok(lesson.estimatedMinutes >= 45);\n  assert.ok(lesson.content?.overview?.length >= 40);\n  for (const objective of lesson.learningObjectives) assert.ok(exists(\`content/learning-objectives/\${objective}.json\`), \`missing objective \${objective}\`);\n}\n\nconst final = read('content/assessments/ASSESS-LH-TECH1-002-FINAL.json');\nassert.equal(final.status, 'draft');\nassert.equal(final.purpose, 'summative');\nassert.equal(final.items.length, 20);\nassert.equal(new Set(final.items).size, 20);\nassert.deepEqual(new Set(final.objectives), new Set(['LO-LH-TECH1-002-01','LO-LH-TECH1-002-02','LO-LH-TECH1-002-03','LO-LH-TECH1-002-04','LO-LH-TECH1-002-05']));\nconst objectiveCounts = new Map(final.objectives.map((id) => [id, 0]));\nlet appliedOrHigher = 0;\nfor (const itemId of final.items) {\n  const file = \`content/questions/\${itemId}.json\`;\n  assert.ok(exists(file), \`missing item \${itemId}\`);\n  const item = read(file);\n  assert.equal(item.status, 'draft');\n  assert.equal(item.purpose, 'summative');\n  assert.ok(final.competencies.includes(item.competency));\n  assert.ok(final.objectives.includes(item.objective));\n  assert.ok(Array.isArray(item.references) && item.references.length > 0);\n  objectiveCounts.set(item.objective, objectiveCounts.get(item.objective) + 1);\n  if (['apply','analyze','evaluate','create'].includes(item.bloomLevel)) appliedOrHigher++;\n}\nfor (const [id, count] of objectiveCounts) assert.ok(count >= 4, \`\${id} requires at least four course-specific items; found \${count}\`);\nassert.ok(appliedOrHigher >= 18, \`Course 002 bank should be predominantly applied/analyze; found \${appliedOrHigher}/20\`);\nassert.equal(final.extensions?.linkedCredentialPractical, 'PRACTICAL-TECH1-A');\nconsole.log('Course 002 production slice passed: four dedicated lessons, five objectives and twenty source-backed course items are wired while release remains draft-gated.');\n`;
fs.writeFileSync(path.join(root, 'scripts/test-tech1-course2.mjs'), course2Test);

const programTestPath = path.join(root, 'scripts/test-tech1-program-structure.mjs');
fs.writeFileSync(programTestPath, `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\n\nconst root = process.cwd();\nconst read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));\nconst exists = (p) => fs.existsSync(path.join(root, p));\nconst program = read('content/credential-programs/CREDPROG-CULT-TECH-I-001.json');\nassert.equal(program.status, 'draft', 'Technician I program must remain draft until validation and release gates complete');\nassert.equal(program.requiredCourses.length, 7);\nassert.equal(new Set(program.requiredCourses).size, 7);\nfor (const courseId of program.requiredCourses) {\n  const file = \`content/courses/\${courseId}.json\`;\n  assert.ok(exists(file), \`\${courseId} must have a real course object\`);\n  const c = read(file);\n  assert.equal(c.id, courseId);\n  assert.equal(c.credentialBearing, true);\n  assert.equal(c.extensions?.credentialPath, program.id);\n  assert.ok(Array.isArray(c.modules) && c.modules.length > 0);\n  for (const moduleId of c.modules) assert.ok(exists(\`content/modules/\${moduleId}.json\`), \`\${courseId} references missing module \${moduleId}\`);\n  if (courseId !== 'COURSE-LH-TECH1-001') assert.equal(c.status, 'draft', \`\${courseId} must remain draft until its release gates complete\`);\n  if (c.finalAssessment) {\n    assert.ok(exists(\`content/assessments/\${c.finalAssessment}.json\`), \`\${courseId} final assessment must resolve\`);\n    const a = read(\`content/assessments/\${c.finalAssessment}.json\`);\n    assert.ok(['summative','credential'].includes(a.purpose));\n  } else if (courseId !== 'COURSE-LH-TECH1-001') {\n    const exposesGate = c.extensions?.dedicatedCourseAssessmentRequired === true || c.extensions?.dedicatedLabModuleRequired === true;\n    assert.equal(exposesGate, true, \`\${courseId} must expose the missing completion gate\`);\n  }\n}\nfor (const courseId of ['COURSE-LH-TECH1-003','COURSE-LH-TECH1-004','COURSE-LH-TECH1-005','COURSE-LH-TECH1-006']) {\n  const c = read(\`content/courses/\${courseId}.json\`);\n  assert.equal(c.finalAssessment, null);\n  assert.equal(c.extensions?.dedicatedCourseAssessmentRequired, true);\n}\nconst course2 = read('content/courses/COURSE-LH-TECH1-002.json');\nassert.equal(course2.finalAssessment, 'ASSESS-LH-TECH1-002-FINAL');\nassert.equal(course2.extensions?.dedicatedCourseAssessmentRequired, false);\nconst integrated = read('content/courses/COURSE-LH-TECH1-007.json');\nassert.equal(integrated.extensions?.dedicatedLabModuleRequired, true);\nassert.equal(integrated.extensions?.credentialPracticalSetRequired.length, 6);\nassert.equal(new Set(integrated.extensions.credentialPracticalSetRequired).size, 6);\nassert.equal(integrated.extensions?.capstoneRequired, 'CAPSTONE-TECH1-SHIFT-001');\nconsole.log('Technician I program structure passed: all seven courses resolve; Course 002 has advanced to draft instruction/assessment while Courses 003-007 retain explicit completion gates.');\n`);

const pkgPath = path.join(root, 'package.json');
const pkg = readJson('package.json');
pkg.scripts['tech1:program:test'] = 'node scripts/test-tech1-program-structure.mjs';
pkg.scripts['tech1:course2:test'] = 'node scripts/test-tech1-course2.mjs';
if (!pkg.scripts.test.includes('npm run tech1:program:test')) {
  const marker = 'npm run credential:governance:test &&';
  if (!pkg.scripts.test.includes(marker)) throw new Error('credential governance test insertion point missing');
  pkg.scripts.test = pkg.scripts.test.replace(marker, 'npm run tech1:program:test && npm run tech1:course2:test && ' + marker);
} else if (!pkg.scripts.test.includes('npm run tech1:course2:test')) {
  pkg.scripts.test = pkg.scripts.test.replace('npm run tech1:program:test &&', 'npm run tech1:program:test && npm run tech1:course2:test &&');
}
writeJson('package.json', pkg);

console.log('Built Course 002 instructional and assessment production slice.');
