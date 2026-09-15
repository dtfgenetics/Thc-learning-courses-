import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const write = (rel, obj) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(obj, null, 2)}\n`);
};

const objectives = [
  ['LO-LH-TECH2-002-01','COMP-ENV-ADV-001','Verify sensor placement, representativeness, comparison method and calibration status before using environmental data for troubleshooting or control decisions.','evaluate'],
  ['LO-LH-TECH2-002-02','COMP-LIGHT-ADV-001','Evaluate lighting measurements and spatial patterns using repeatable measurement geometry, instrument context and crop-plane comparisons.','analyze'],
  ['LO-LH-TECH2-002-03','COMP-IRRIGATION-ADV-001','Verify irrigation equipment response and distribution using measured output, pressure, filtration and zone comparisons rather than nominal equipment ratings.','analyze'],
  ['LO-LH-TECH2-002-04','COMP-CULT-EQUIPMENT-CARE-001','Distinguish assigned operator verification and routine care from servicing, protected access, disassembly or hazardous-energy work requiring an authorized role.','evaluate'],
  ['LO-LH-TECH2-002-05','COMP-SAFETY-WORK-001','Identify safety, stored-energy and authorization boundaries during sensor and equipment verification and preserve a safe status when escalation is required.','apply'],
  ['LO-LH-TECH2-002-06','COMP-PRO-QA-001','Classify sensor/equipment faults from evidence, preserve inconvenient data, document actions and produce a reconstructable maintenance or supervisor handoff.','evaluate']
];
for (const [id, competency, statement, bloomLevel] of objectives) write(`content/learning-objectives/${id}.json`, {id, competency, statement, bloomLevel, status:'draft', version:'1.0.0'});

const lessons = [
  {
    id:'LESSON-LH-TECH2-002-01', title:'Representative Sensors, Calibration and Data-Quality Verification',
    competencies:['COMP-ENV-ADV-001','COMP-PRO-QA-001'], learningObjectives:['LO-LH-TECH2-002-01','LO-LH-TECH2-002-06'], estimatedMinutes:60,
    references:['REF-VPD-002','REF-ENV-TEMP-2025-001','REF-MHRA-GXP-DATA-INTEGRITY'],
    content:{
      overview:'Technician II troubleshooting starts by asking whether the data deserve to drive a decision. Placement, shielding, crop plane, response time, calibration history, maintenance history and agreement with independent measurements all affect whether a sensor represents the condition under investigation.',
      vocabulary:[
        {term:'Representativeness',definition:'How well a measurement describes the location, crop zone or process condition relevant to the decision.'},
        {term:'Colocation check',definition:'Temporary comparison of sensors at the same location to determine whether disagreement follows the instrument or the environment.'},
        {term:'Data-quality flag',definition:'A documented reason a value may be unreliable, incomplete, unrepresentative or unsuitable for a specific decision.'}
      ],
      sections:[
        {title:'Placement is part of the measurement',body:'Wall, return-air and canopy sensors can describe different microenvironments. Record exact position, height, shielding and crop context before treating disagreement as instrument failure.',references:['REF-VPD-002']},
        {title:'Use comparison before conclusion',body:'Colocated comparison with a verified instrument helps distinguish a spatial gradient from sensor bias or drift. A comparison should use enough stabilization time and the same exposure conditions.',references:['REF-ENV-TEMP-2025-001']},
        {title:'Preserve questionable data instead of hiding it',body:'If a sensor is suspected, flag the value, record why, preserve the original data and document the comparison or calibration evidence. Do not change setpoints or records merely to make the dashboard look normal.',references:['REF-MHRA-GXP-DATA-INTEGRITY']}
      ],
      workedExamples:['A wall sensor and canopy probe disagree; moving a verified reference beside each sensor shows the difference follows location, supporting a real spatial gradient.','A probe remains offset from a verified reference when colocated, so the reading is flagged and the instrument is routed through the authorized calibration/maintenance process.'],
      commonMistakes:['Calling every disagreement a calibration failure.','Comparing sensors in different locations and treating the comparison as a calibration test.','Deleting or overwriting data after deciding a sensor is suspect.'],
      practicalApplication:'Create a sensor-verification record including device ID, exact location, comparison instrument, stabilization period, paired readings, calibration status, data-quality disposition and escalation decision.',
      summary:'Reliable troubleshooting starts by verifying that sensor data are representative, comparable and documented well enough to support the decision being made.'
    }
  },
  {
    id:'LESSON-LH-TECH2-002-02', title:'Trends, Controllers, Alarms and Fault Classification',
    competencies:['COMP-ENV-ADV-001','COMP-LIGHT-ADV-001','COMP-PRO-QA-001'], learningObjectives:['LO-LH-TECH2-002-01','LO-LH-TECH2-002-02','LO-LH-TECH2-002-06'], estimatedMinutes:65,
    references:['REF-VPD-002','REF-ENV-TEMP-2025-001','REF-LIGHT-001','REF-MHRA-GXP-DATA-INTEGRITY'],
    content:{
      overview:'An alarm is a signal to investigate, not a diagnosis. Advanced verification compares commanded state, measured response, independent evidence, spatial pattern and time-series behavior before classifying a condition as sensor, control, equipment, distribution or process-related.',
      vocabulary:[
        {term:'Commanded state',definition:'The controller or automation state the system is requesting, such as on, off, open, closed or a target output.'},
        {term:'Observed response',definition:'The measured physical response that should follow a command if the sensor, controller and equipment chain is working as expected.'},
        {term:'Fault classification',definition:'A bounded evidence-based category describing where a problem is most likely located without claiming an unverified root cause.'}
      ],
      sections:[
        {title:'Separate command from response',body:'A controller display can show a command without proving the equipment produced the intended physical response. Compare independent process measurements, equipment indicators and trends.',references:['REF-ENV-TEMP-2025-001']},
        {title:'Use trend shape and spatial pattern',body:'Step changes, flatlined values, repeated cycling, delayed response and location-specific deviations can suggest different verification paths. The pattern narrows hypotheses but does not replace direct checks.',references:['REF-VPD-002']},
        {title:'Lighting measurements need repeatable geometry',body:'PPFD comparisons should use consistent canopy plane, sensor orientation and sampling locations. A single convenient point should not stand in for a spatial lighting map.',references:['REF-LIGHT-001']},
        {title:'Classify without overstating root cause',body:'Technician II may document a likely sensor/data-quality fault, control-response mismatch or equipment-response failure while escalating repairs or engineering decisions that exceed assigned authority.',references:['REF-MHRA-GXP-DATA-INTEGRITY']}
      ],
      workedExamples:['A dehumidifier command changes but room and local humidity trends do not respond; the condition is classified as a response mismatch pending authorized equipment verification.','A PPFD complaint is tested with a repeatable map rather than one handheld reading near the aisle.'],
      commonMistakes:['Assuming commanded state proves physical response.','Resetting repeated alarms until they disappear.','Using one light reading to characterize the whole canopy.'],
      practicalApplication:'Annotate a trend showing commands, alarms, independent measurements and relevant work events. Assign a provisional fault class and list the next safe check that would distinguish sensor, controller, equipment or spatial-process causes.',
      summary:'Good fault classification connects commands to real response, uses spatial and temporal evidence, and stops short of claiming a repair diagnosis without adequate verification.'
    }
  },
  {
    id:'LESSON-LH-TECH2-002-03', title:'Irrigation and Equipment Response Verification within Safe Authority',
    competencies:['COMP-IRRIGATION-ADV-001','COMP-CULT-EQUIPMENT-CARE-001','COMP-SAFETY-WORK-001','COMP-PRO-QA-001'], learningObjectives:['LO-LH-TECH2-002-03','LO-LH-TECH2-002-04','LO-LH-TECH2-002-05','LO-LH-TECH2-002-06'], estimatedMinutes:70,
    references:['REF-IRRIGATION-001','REF-OSHA-1910-147-LOTO','REF-NIOSH-CANNABIS-HAZARDS-2024'],
    content:{
      overview:'Equipment verification means checking whether the system performs as intended within an assigned procedure. It does not turn the technician into an electrician, mechanic or hazardous-energy authorized employee. Irrigation verification therefore combines measured delivery and pressure/filtration evidence with a strict operator-care boundary.',
      vocabulary:[
        {term:'Distribution uniformity',definition:'How evenly an irrigation system delivers water among representative locations.'},
        {term:'Operator-care boundary',definition:'The last action explicitly assigned to the operator before servicing, protected access or hazardous-energy controls require another authorized role.'},
        {term:'Stored energy',definition:'Energy such as pressure, gravity, spring force, heat or electrical charge that can remain after normal shutdown.'}
      ],
      sections:[
        {title:'Measure installed irrigation performance',body:'Representative catch volumes, line position, pressure and filtration condition reveal distribution problems that nominal emitter ratings cannot prove.',references:['REF-IRRIGATION-001']},
        {title:'A normal stop is not energy isolation',body:'Normal controls do not by themselves establish that unexpected startup or stored energy is controlled for servicing. Protected access, disassembly, guard removal or pressure release are strong boundary cues.',references:['REF-OSHA-1910-147-LOTO']},
        {title:'Do not expand authority because the repair looks simple',body:'The equipment procedure and employer authorization determine what the technician may inspect, reset, clean or adjust. Familiarity or previous experience does not create current authorization.',references:['REF-NIOSH-CANNABIS-HAZARDS-2024','REF-OSHA-1910-147-LOTO']}
      ],
      workedExamples:['A far-end irrigation zone tests low; the technician records catch-volume and pressure evidence but escalates a repair that requires powered disassembly.','A faulted fan may be visually inspected under the operator procedure, but opening an electrical enclosure is routed to the qualified role.'],
      commonMistakes:['Trusting nominal emitter flow without field verification.','Loosening a pressurized fitting because the pump is off.','Using prior maintenance experience as proof of current authorization.'],
      practicalApplication:'Run a representative irrigation/equipment verification exercise, identify the last permitted operator action, document any energy/protected-access cue, preserve safe status and create the maintenance handoff.',
      summary:'Technician II verifies performance deeply but does not cross servicing, hazardous-energy or protected-access boundaries without explicit authorization.'
    }
  },
  {
    id:'LESSON-LH-TECH2-002-04', title:'Verification Reports, Maintenance Handoffs and Post-Action Confirmation',
    competencies:['COMP-PRO-QA-001','COMP-ENV-ADV-001','COMP-IRRIGATION-ADV-001','COMP-SAFETY-WORK-001'], learningObjectives:['LO-LH-TECH2-002-01','LO-LH-TECH2-002-03','LO-LH-TECH2-002-05','LO-LH-TECH2-002-06'], estimatedMinutes:55,
    references:['REF-MHRA-GXP-DATA-INTEGRITY','REF-IRRIGATION-001','REF-OSHA-1910-147-LOTO'],
    content:{
      overview:'A verification is incomplete until another qualified person can reconstruct what was checked, what evidence was observed, what action was authorized, what remains unresolved and whether the process response after the action supports closure.',
      vocabulary:[
        {term:'Maintenance handoff',definition:'A structured transfer of an equipment condition, evidence, current safe status and boundary information to the authorized maintenance or technical role.'},
        {term:'Post-action verification',definition:'A defined check confirming whether an authorized intervention produced the intended process response without creating another problem.'},
        {term:'Closure evidence',definition:'Documented evidence sufficient to support that a reported condition is resolved or safely dispositioned under the applicable procedure.'}
      ],
      sections:[
        {title:'Report exact evidence and current status',body:'Record asset or sensor ID, location, timestamps, commands, readings, comparison method, operator actions, fault classification and current controlled status. Preserve uncertainty explicitly.',references:['REF-MHRA-GXP-DATA-INTEGRITY']},
        {title:'Handoffs include the boundary cue',body:'A useful maintenance handoff identifies why the technician stopped: recurring fault, protected access, stored energy, electrical enclosure, disassembly, pressure or an action not assigned by procedure.',references:['REF-OSHA-1910-147-LOTO']},
        {title:'Verify response after authorized work',body:'When an authorized correction is completed, repeat the relevant measurement or performance check using comparable conditions. Closure should be evidence-based, not assumed because an alarm cleared.',references:['REF-IRRIGATION-001']}
      ],
      workedExamples:['After an authorized emitter correction, representative catch volumes are repeated to show whether distribution improved.','After a sensor replacement, the new device is compared with a verified reference before its data are used for control decisions.'],
      commonMistakes:['Closing a deviation because the alarm disappeared.','Omitting the exact operator boundary from a maintenance ticket.','Rewriting old data after an equipment fault is confirmed.'],
      practicalApplication:'Produce a complete Sensor & Equipment Verification Report with annotated trend/data table, provisional fault classification, safe-status/authority boundary, receiving role and post-action verification plan.',
      summary:'High-quality verification ends with a reconstructable report, safe handoff and evidence that the authorized action actually restored intended performance.'
    }
  }
];
for (const lesson of lessons) write(`content/lessons/${lesson.id}.json`, {version:'1.0.0',status:'draft',assessment:null,...lesson});

const allCompetencies = ['COMP-ENV-ADV-001','COMP-LIGHT-ADV-001','COMP-IRRIGATION-ADV-001','COMP-CULT-EQUIPMENT-CARE-001','COMP-SAFETY-WORK-001','COMP-PRO-QA-001'];
const objectiveIds = objectives.map((x)=>x[0]);
write('content/modules/MOD-LH-TECH2-002-VERIFICATION.json', {
  id:'MOD-LH-TECH2-002-VERIFICATION', title:'Sensor, Controller & Equipment Verification', version:'1.0.0', status:'draft',
  lessons:lessons.map((x)=>x.id), competencies:allCompetencies, assessment:'ASSESS-LH-TECH2-002-M01'
});

const specs = [
  ['COMP-ENV-ADV-001','LO-LH-TECH2-002-01','A wall sensor and a canopy sensor disagree by several points of RH. What is the strongest first interpretation?','The disagreement may reflect location or sensor error; verify placement and use a colocated comparison before deciding.',['The canopy sensor is definitely wrong.','Average the two readings and change the setpoint.','Delete the higher value because it is inconvenient.'],['REF-VPD-002','REF-ENV-TEMP-2025-001']],
  ['COMP-PRO-QA-001','LO-LH-TECH2-002-06','A suspected bad sensor produced data for six hours. What should happen to those historical values?','Preserve them with a documented data-quality flag and the evidence supporting the concern.',['Overwrite them with the room average.','Delete them after replacing the sensor.','Mark the entire crop cycle invalid without review.'],['REF-MHRA-GXP-DATA-INTEGRITY']],
  ['COMP-ENV-ADV-001','LO-LH-TECH2-002-01','Two probes disagree when separated but agree when colocated. What does that result most strongly support?','The original difference was likely spatial rather than an instrument offset.',['Both sensors need replacement.','The controller is necessarily defective.','The room average is sufficient for all crop decisions.'],['REF-VPD-002','REF-ENV-TEMP-2025-001']],
  ['COMP-LIGHT-ADV-001','LO-LH-TECH2-002-02','A technician compares PPFD this week with last week but changes sensor height and orientation. What is the main problem?','The measurement geometry changed, so the values are not a clean repeatable comparison.',['PPFD never requires consistent geometry.','Only lamp wattage matters.','The newer reading automatically replaces the older one.'],['REF-LIGHT-001']],
  ['COMP-LIGHT-ADV-001','LO-LH-TECH2-002-02','One aisle PPFD reading meets target while crop complaints occur under the center canopy. What is the best next step?','Map representative crop-plane locations using consistent orientation and height.',['Increase lighting everywhere.','Use the aisle reading as proof the canopy is uniform.','Change photoperiod before measuring the affected area.'],['REF-LIGHT-001']],
  ['COMP-ENV-ADV-001','LO-LH-TECH2-002-01','A temperature sensor flatlines exactly after maintenance while nearby verified sensors continue changing. What is the best fault classification?','Suspected sensor/data-quality fault pending verification, not a confirmed room-temperature condition.',['Confirmed perfect temperature control.','Confirmed HVAC failure.','Confirmed crop-transpiration failure.'],['REF-ENV-TEMP-2025-001','REF-MHRA-GXP-DATA-INTEGRITY']],
  ['COMP-PRO-QA-001','LO-LH-TECH2-002-06','A controller commands a dehumidifier on, but independent humidity measurements do not respond. What can be concluded now?','There is a command-to-response mismatch that needs equipment/control verification; root cause is not yet confirmed.',['The dehumidifier compressor is definitely failed.','The humidity sensors are definitely wrong.','The controller display proves the equipment is working.'],['REF-VPD-002','REF-ENV-TEMP-2025-001']],
  ['COMP-PRO-QA-001','LO-LH-TECH2-002-06','Repeated alarms clear only after repeated manual resets. What is the strongest response?','Document the recurring fault and escalate under the equipment procedure rather than using resets to mask the condition.',['Keep resetting indefinitely if production resumes.','Change alarm limits so the alerts stop.','Delete prior alarms once the equipment restarts.'],['REF-MHRA-GXP-DATA-INTEGRITY','REF-NIOSH-CANNABIS-HAZARDS-2024']],
  ['COMP-IRRIGATION-ADV-001','LO-LH-TECH2-002-03','A nominal 2-L/h emitter is installed at every site. What does that prove about current distribution?','It proves the nominal rating only; representative measured output is still required to evaluate installed performance.',['Every emitter currently delivers exactly 2 L/h.','Pressure and filtration cannot affect delivery.','Only the first emitter on each line needs measurement.'],['REF-IRRIGATION-001']],
  ['COMP-IRRIGATION-ADV-001','LO-LH-TECH2-002-03','Far-end plants dry faster and catch volumes are lower there. What evidence should be checked next?','Pressure, filtration, line position and representative emitter output across the zone.',['Only nutrient formulation.','Only room CO2.','Only cultivar name.'],['REF-IRRIGATION-001']],
  ['COMP-IRRIGATION-ADV-001','LO-LH-TECH2-002-03','After an authorized irrigation repair, what best supports closure?','Repeat the relevant representative delivery/performance measurement under comparable conditions.',['Assume closure because the repair ticket is complete.','Close the issue when the pump turns on.','Change the irrigation recipe before retesting.'],['REF-IRRIGATION-001']],
  ['COMP-CULT-EQUIPMENT-CARE-001','LO-LH-TECH2-002-04','A blocked powered component can only be cleared by removing a guard. The operator SOP does not authorize guard removal. What should the technician do?','Stop at the operator-care boundary and route the work through the authorized servicing process.',['Remove the guard because the blockage is visible.','Hold the stop button while reaching in.','Ask another technician to remove the guard.'],['REF-OSHA-1910-147-LOTO']],
  ['COMP-SAFETY-WORK-001','LO-LH-TECH2-002-05','A pressurized irrigation component is shut off, but the gauge still shows pressure. What is the correct boundary decision?','Preserve safe status and refer the pressure-release/disassembly work to the authorized servicing process.',['Loosen the fitting slowly.','Tap the gauge until pressure appears to fall.','Have a coworker hold the hose while opening it.'],['REF-OSHA-1910-147-LOTO']],
  ['COMP-CULT-EQUIPMENT-CARE-001','LO-LH-TECH2-002-04','A technician previously repaired similar equipment at another employer. Does that create authorization here?','No; current employer procedure, training and authorization define the permitted work boundary.',['Yes, experience automatically transfers authorization.','Yes, if the repair seems simple.','Yes, whenever production is delayed.'],['REF-NIOSH-CANNABIS-HAZARDS-2024','REF-OSHA-1910-147-LOTO']],
  ['COMP-SAFETY-WORK-001','LO-LH-TECH2-002-05','Which condition most clearly signals that routine verification may have crossed into servicing?','The task requires protected access, guard removal, disassembly or control of hazardous/stored energy.',['The task takes more than five minutes.','The equipment is expensive.','A supervisor is not standing nearby.'],['REF-OSHA-1910-147-LOTO']],
  ['COMP-PRO-QA-001','LO-LH-TECH2-002-06','What belongs in a maintenance handoff after a verification stops at an authority boundary?','Exact asset/location, observed condition, evidence, operator actions, boundary cue, current safe status and receiving role.',['Only the technician’s guess at root cause.','Only the alarm code.','Only a note that maintenance was called.'],['REF-MHRA-GXP-DATA-INTEGRITY','REF-OSHA-1910-147-LOTO']],
  ['COMP-ENV-ADV-001','LO-LH-TECH2-002-01','A verified reference shows the room sensor is offset only during lights-on periods. What should the technician investigate before assuming permanent calibration drift?','Radiant exposure, shielding, placement and other condition-dependent measurement effects.',['Replace all room sensors immediately.','Ignore the lights-off data.','Change the HVAC target to match the offset.'],['REF-ENV-TEMP-2025-001','REF-VPD-002']],
  ['COMP-LIGHT-ADV-001','LO-LH-TECH2-002-02','A PPFD map shows one consistent low region. What is the strongest next step within Technician II scope?','Verify repeatability and relevant fixture/obstruction/context evidence, then escalate adjustment or repair according to authorization.',['Increase all fixtures without verification.','Assume the plants in that region need more fertilizer.','Discard the low readings because the room average is acceptable.'],['REF-LIGHT-001']],
  ['COMP-PRO-QA-001','LO-LH-TECH2-002-06','An alarm disappeared after a reset, but the underlying trend still shows abnormal cycling. What is the best disposition?','Keep the condition open and document the continuing abnormal response for further verification/escalation.',['Close it because the alarm cleared.','Delete the cycling data.','Raise the alarm threshold.'],['REF-MHRA-GXP-DATA-INTEGRITY']],
  ['COMP-IRRIGATION-ADV-001','LO-LH-TECH2-002-03','Catch volumes vary widely but pressure was measured only at the pump. What additional evidence has highest value?','Representative downstream pressure/output and filtration condition across near/far and problem-prone positions.',['The pump nameplate only.','The nutrient brand only.','The previous crop yield only.'],['REF-IRRIGATION-001']],
  ['COMP-CULT-EQUIPMENT-CARE-001','LO-LH-TECH2-002-04','An operator procedure permits one reset, but the fault returns immediately. What should happen next?','Stop repeated resets, document the recurring condition and escalate under the servicing/maintenance pathway.',['Repeat the reset until the equipment stays on.','Bypass the fault input.','Lower the setpoint so the fault does not trigger.'],['REF-NIOSH-CANNABIS-HAZARDS-2024','REF-MHRA-GXP-DATA-INTEGRITY']],
  ['COMP-SAFETY-WORK-001','LO-LH-TECH2-002-05','Why is a normal stop button insufficient proof that equipment is safe to service?','Hazardous or stored energy and unexpected startup may remain unless the employer-defined energy-control procedure is completed.',['Stop buttons never affect equipment.','Only hydraulic systems contain energy.','Servicing safety depends only on how long the equipment has been off.'],['REF-OSHA-1910-147-LOTO']],
  ['COMP-PRO-QA-001','LO-LH-TECH2-002-06','A technician believes a sensor is wrong and changes its recorded values to match a nearby instrument. What is the primary problem?','The original evidence was altered instead of preserved and dispositioned through a documented data-quality process.',['Nearby instruments can never be used as references.','Sensor values may only be recorded once per day.','The technician should have changed the setpoint too.'],['REF-MHRA-GXP-DATA-INTEGRITY']],
  ['COMP-ENV-ADV-001','LO-LH-TECH2-002-01','Which comparison best distinguishes a local microclimate from sensor bias?','Compare the suspect and verified sensors while colocated, then compare representative locations under matched conditions.',['Compare readings taken in different rooms on different days.','Compare only target setpoints.','Compare equipment model numbers.'],['REF-VPD-002','REF-ENV-TEMP-2025-001']],
  ['COMP-ENV-ADV-001','LO-LH-TECH2-002-01','Formative: A canopy sensor reads higher humidity than the wall controller. What should be documented before deciding which is “correct”?','Exact location, height, shielding, time, crop context and comparison method.',['Only the higher number.','Only the controller target.','Only the sensor brand.'],['REF-VPD-002']],
  ['COMP-LIGHT-ADV-001','LO-LH-TECH2-002-02','Formative: Why should repeated PPFD measurements use the same sensor orientation and canopy plane?','To make the measurements comparable and reduce geometry-driven differences.',['Because orientation changes nutrient uptake directly.','Because PPFD is a room-average value only.','Because all sensors auto-correct any geometry change.'],['REF-LIGHT-001']],
  ['COMP-IRRIGATION-ADV-001','LO-LH-TECH2-002-03','Formative: A single emitter tests correctly. What does that establish about a 40-emitter zone?','Only that one location performed correctly; representative distribution still needs verification.',['The whole zone is uniform.','The filter is clean.','Pressure is identical everywhere.'],['REF-IRRIGATION-001']],
  ['COMP-CULT-EQUIPMENT-CARE-001','LO-LH-TECH2-002-04','Formative: A fault requires opening an electrical enclosure not assigned to the operator. What is the correct action?','Preserve equipment status and refer the work to the qualified/authorized role.',['Open it carefully with insulated gloves.','Ask a coworker to watch while opening it.','Reset power repeatedly.'],['REF-OSHA-1910-147-LOTO']],
  ['COMP-SAFETY-WORK-001','LO-LH-TECH2-002-05','Formative: The pump is off but a line remains pressurized. What hazard remains relevant?','Stored pressure energy.',['No energy remains once the pump stops.','Only electrical energy can remain.','Only chemical exposure matters.'],['REF-OSHA-1910-147-LOTO']],
  ['COMP-PRO-QA-001','LO-LH-TECH2-002-06','Formative: What is the safest way to handle an inconvenient outlier that may be real?','Preserve it, verify data quality and document the disposition.',['Delete it immediately.','Replace it with the average.','Hide it from the trend display permanently.'],['REF-MHRA-GXP-DATA-INTEGRITY']],
  ['COMP-ENV-ADV-001','LO-LH-TECH2-002-01','Formative: Two colocated sensors remain consistently offset after stabilization. What does this most strongly justify?','A documented sensor comparison/calibration investigation.',['A room-wide HVAC change.','Deleting both sensors.','Assuming the crop caused the offset.'],['REF-ENV-TEMP-2025-001']],
  ['COMP-PRO-QA-001','LO-LH-TECH2-002-06','Formative: A controller says “ON,” but there is no physical process response. How should the condition be recorded?','As a command-response mismatch pending further verification.',['As a confirmed motor failure.','As a confirmed sensor failure.','As normal because the command is ON.'],['REF-ENV-TEMP-2025-001']],
  ['COMP-IRRIGATION-ADV-001','LO-LH-TECH2-002-03','Formative: What makes nominal emitter flow insufficient for troubleshooting installed irrigation?','Clogging, pressure, filtration, line position and wear can change actual delivery.',['Nominal ratings are always intentionally false.','Water pressure never affects emitters.','Installed systems do not need field checks.'],['REF-IRRIGATION-001']],
  ['COMP-CULT-EQUIPMENT-CARE-001','LO-LH-TECH2-002-04','Formative: What determines whether a simple-looking equipment adjustment is operator care?','The controlled equipment procedure and current employer authorization.',['The technician’s confidence.','The time required.','Whether production is behind schedule.'],['REF-NIOSH-CANNABIS-HAZARDS-2024']],
  ['COMP-SAFETY-WORK-001','LO-LH-TECH2-002-05','Formative: A task requires guard removal to reach the fault. What is the key boundary cue?','Protected access to a hazard that may require the authorized servicing/energy-control process.',['The guard is inconvenient.','The equipment is old.','The fault has happened before.'],['REF-OSHA-1910-147-LOTO']],
  ['COMP-PRO-QA-001','LO-LH-TECH2-002-06','Formative: After authorized maintenance, what should happen before closing the verification record?','Repeat the relevant performance measurement and document whether intended response was restored.',['Close it when maintenance leaves.','Erase the pre-repair data.','Change the original fault classification to “normal.”'],['REF-MHRA-GXP-DATA-INTEGRITY','REF-IRRIGATION-001']]
];

const makeItem = (id, purpose, spec, index) => {
  const [competency,objective,stem,answer,wrong,references] = spec;
  const correct = index % 4;
  const choices = [...wrong]; choices.splice(correct,0,answer);
  return {id,version:1,status:'draft',purpose,competency,objective,bloomLevel:'analyze',difficulty:'hard',type:'scenario',stem,choices,correct,rationale:`${answer} This preserves the evidence and role boundary required by the referenced verification framework.`,references};
};

const summativeIds=[];
for(let i=0;i<24;i++){const id=`ITEM-LH-TECH2-002-${String(i+1).padStart(3,'0')}`;summativeIds.push(id);write(`content/questions/${id}.json`,makeItem(id,'summative',specs[i],i));}
const formativeIds=[];
for(let i=0;i<12;i++){const id=`ITEM-LH-TECH2-002-M01-${String(i+1).padStart(3,'0')}`;formativeIds.push(id);write(`content/questions/${id}.json`,makeItem(id,'formative',specs[24+i],i));}

write('content/assessments/ASSESS-LH-TECH2-002-M01.json',{
  id:'ASSESS-LH-TECH2-002-M01',title:'Environmental Data, Sensors & Equipment Response — Formative Check',version:'1.0.0',status:'draft',purpose:'formative',competencies:allCompetencies,objectives:objectiveIds,items:formativeIds,passingScorePercent:80,maxAttempts:null,cooldownHours:0,feedbackMode:'after-submit',totalItems:12,randomizeItems:true,randomizeChoices:true,accommodations:{allowExtendedTime:true,allowAlternativeAccessiblePresentation:true},extensions:{courseId:'COURSE-LH-TECH2-002',bankStatus:'development-seed',distinctSummativeBank:true,publicCredentialItemsExcluded:true}
});
const blueprintCounts={};
for(const id of summativeIds){const item=read(`content/questions/${id}.json`);blueprintCounts[item.competency]=(blueprintCounts[item.competency]??0)+1;}
const targets={
  'COMP-ENV-ADV-001':'Sensor representativeness, comparison, trend and environmental response verification',
  'COMP-LIGHT-ADV-001':'Repeatable spatial lighting measurement and interpretation',
  'COMP-IRRIGATION-ADV-001':'Measured irrigation distribution and equipment-response verification',
  'COMP-CULT-EQUIPMENT-CARE-001':'Operator-care versus servicing boundary decisions',
  'COMP-SAFETY-WORK-001':'Hazardous/stored-energy and safe-status decisions',
  'COMP-PRO-QA-001':'Fault classification, data integrity, escalation and handoff documentation'
};
write('content/assessments/ASSESS-LH-TECH2-002-FINAL.json',{
  id:'ASSESS-LH-TECH2-002-FINAL',title:'Environmental Data, Sensors & Equipment Response — Course Assessment',version:'1.0.0',status:'draft',purpose:'summative',competencies:allCompetencies,objectives:objectiveIds,items:summativeIds,passingScorePercent:80,maxAttempts:null,cooldownHours:0,feedbackMode:'post-attempt-domain-level',totalItems:24,randomizeItems:true,randomizeChoices:true,blueprint:allCompetencies.map((competency)=>({competency,items:blueprintCounts[competency],cognitiveTarget:targets[competency]})),itemSelection:{minimumActiveItemsPerCompetency:1,targetBankItemsPerCompetency:12,requireReferenceBackedItems:true,requireHumanAssessmentReview:true},accommodations:{allowExtendedTime:true,allowAlternativeAccessiblePresentation:true},extensions:{courseId:'COURSE-LH-TECH2-002',linkedCredentialPractical:'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION',bankStatus:'development-seed',bankExpansionTarget:48,distinctFormativeBank:true,formativeAssessment:'ASSESS-LH-TECH2-002-M01',publicCredentialItemsExcluded:true}
});

const course=read('content/courses/COURSE-LH-TECH2-002.json');
course.version='0.2.0';
course.modules=['MOD-ENV-ADV-001','MOD-LIGHT-ADV-001','MOD-IRRIGATION-ADV-001','MOD-PRO-QA-001','MOD-SAFETY-WORK-001','MOD-LH-TECH1-001-EQUIPMENT','MOD-LH-TECH2-002-VERIFICATION'];
course.competencies=allCompetencies;
course.finalAssessment='ASSESS-LH-TECH2-002-FINAL';
course.learningOutcomes=[
  'Verify whether environmental, lighting and equipment measurements are representative and fit for decisions before changing controls.',
  'Interpret commands, alarms, spatial maps and time-series response to classify likely sensor, control, equipment or distribution faults without overstating root cause.',
  'Verify irrigation/equipment performance using measured output and process evidence while respecting operator-care, servicing and hazardous-energy boundaries.',
  'Produce a reconstructable verification report, safe maintenance handoff and post-action confirmation plan.'
];
course.assessmentPolicy='Course-specific formative and summative items are separate from the public Technician II credential-development bank. Course completion remains draft/development evidence and does not replace Practical B, private operational credential forms, program validation, standard setting or final release approval.';
course.extensions={...course.extensions,maturity:'instruction-assessment-draft',developmentDependencies:course.modules,dedicatedCourseAssessmentRequired:false,dedicatedPerformanceValidationRequired:true,mappedPractical:'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION',dedicatedItemCount:36,formativeItemCount:12,summativeItemCount:24,humanTechnicalReviewRequired:true,accessibilityReviewRequired:true,publicCredentialItemsAreDevelopmentOnly:true,operationalCredentialBankMustBePrivate:true};
write('content/courses/COURSE-LH-TECH2-002.json',course);

const program=read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');
for(const comp of allCompetencies) if(!program.competencies.includes(comp)) program.competencies.push(comp);
write('content/credential-programs/CREDPROG-CULT-TECH-II-001.json',program);

const structurePath='scripts/test-tech2-program-structure.mjs';
let structure=fs.readFileSync(path.join(root,structurePath),'utf8');
structure=structure.replace("if (id === 'COURSE-LH-TECH2-001') {", "if (id === 'COURSE-LH-TECH2-001' || id === 'COURSE-LH-TECH2-002') {");
structure=structure.replace("assert.equal(course.finalAssessment, 'ASSESS-LH-TECH2-001-FINAL');\n    assert.equal(course.extensions.dedicatedCourseAssessmentRequired, false);\n    assert.equal(course.extensions.dedicatedPerformanceValidationRequired, true);\n    assert.equal(course.extensions.mappedPractical, 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP');\n    assert.ok(fs.existsSync(path.join('content/assessments', course.finalAssessment + '.json')), 'Course 201 final assessment must resolve');", "const expectedFinal = id === 'COURSE-LH-TECH2-001' ? 'ASSESS-LH-TECH2-001-FINAL' : 'ASSESS-LH-TECH2-002-FINAL';\n    const expectedPractical = id === 'COURSE-LH-TECH2-001' ? 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP' : 'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION';\n    assert.equal(course.finalAssessment, expectedFinal);\n    assert.equal(course.extensions.dedicatedCourseAssessmentRequired, false);\n    assert.equal(course.extensions.dedicatedPerformanceValidationRequired, true);\n    assert.equal(course.extensions.mappedPractical, expectedPractical);\n    assert.ok(fs.existsSync(path.join('content/assessments', course.finalAssessment + '.json')), id + ' final assessment must resolve');");
fs.writeFileSync(path.join(root,structurePath),structure);

const test=`import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));\nconst course=read('content/courses/COURSE-LH-TECH2-002.json');\nconst program=read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');\nconst finalA=read('content/assessments/ASSESS-LH-TECH2-002-FINAL.json');\nconst formA=read('content/assessments/ASSESS-LH-TECH2-002-M01.json');\nassert.equal(course.version,'0.2.0'); assert.equal(course.status,'draft'); assert.equal(course.finalAssessment,finalA.id);\nassert.ok(course.modules.includes('MOD-LH-TECH2-002-VERIFICATION'));\nassert.equal(course.extensions.mappedPractical,'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION');\nassert.equal(finalA.items.length,24); assert.equal(formA.items.length,12);\nassert.equal(new Set([...finalA.items,...formA.items]).size,36);\nfor(const id of [...finalA.items,...formA.items]) assert.ok(id.startsWith('ITEM-LH-TECH2-002-'));\nconst counts=[0,0,0,0]; for(const id of finalA.items) counts[read('content/questions/'+id+'.json').correct]++; assert.deepEqual(counts,[6,6,6,6]);\nconst fcounts=[0,0,0,0]; for(const id of formA.items) fcounts[read('content/questions/'+id+'.json').correct]++; assert.deepEqual(fcounts,[3,3,3,3]);\nconst practical=read('content/performance-assessments/PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION.json');\nfor(const comp of practical.competencies){assert.ok(course.competencies.includes(comp),'Practical B competency not mapped: '+comp);assert.ok(program.competencies.includes(comp),'Program missing Practical B competency: '+comp);}\nfor(const comp of ['COMP-LIGHT-ADV-001','COMP-CULT-EQUIPMENT-CARE-001']) assert.ok(course.competencies.includes(comp));\nconst bpTotal=finalA.blueprint.reduce((s,r)=>s+r.items,0); assert.equal(bpTotal,24);\nconsole.log('Technician II Course 002 instruction, bank isolation, safety boundary and Practical B alignment passed.');\n`;
fs.writeFileSync(path.join(root,'scripts/test-tech2-course2.mjs'),test);

const pkgPath=path.join(root,'package.json'); const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8')); pkg.scripts['tech2:course2:test']='node scripts/test-tech2-course2.mjs'; if(!pkg.scripts.test.includes('npm run tech2:course2:test')) pkg.scripts.test=pkg.scripts.test.replace('npm run tech2:course1:test','npm run tech2:course1:test && npm run tech2:course2:test'); fs.writeFileSync(pkgPath,`${JSON.stringify(pkg,null,2)}\n`);
fs.writeFileSync(path.join(root,'docs/academy-v2/TECH2_COURSE002_BUILD_STATUS.md'),`# Technician II Course 002 Build Status\n\n**Course:** Environmental Data, Sensors & Equipment Response  \n**Status:** instruction-assessment draft\n\nThis build adds six dedicated objectives, four sensor/equipment-verification lessons, a dedicated verification module, a 12-item formative bank and a separate 24-item summative bank. It expands the course/program map to the exact Practical B competencies: advanced environment, advanced irrigation, QA and safety, while retaining advanced lighting and operator-equipment-care instruction.\n\nPublic \`ITEM-TECH2-*\` credential-development items are excluded from course grading. Course 202 remains draft pending human technical/accessibility review, mapped Practical B validation, pilot evidence, program standard setting, secure private operational forms and final release approval.\n`);
console.log('Built Technician II Course 002 instruction and assessment slice.');
