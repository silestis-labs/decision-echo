import type {Session, Validation} from '../shared/contracts';
import './workflow-progress.css';

type Props = {session:Session; validation:Validation|null; currentCheck:boolean};

/** Progress describes persisted evidence and the current proposal, never inferred proficiency. */
export function WorkflowProgress({session,validation,currentCheck}:Props){
 const capture=session.answers.filter(a=>a.stage==='capture');
 const debrief=session.answers.filter(a=>a.stage==='debrief');
 const guardrail=capture.some(a=>a.guardrail);
 const captureReady=capture.length>=3&&guardrail;
 const confirmed=session.map?.status==='confirmed';
 const checked=currentCheck&&validation?.mapVersion===session.map?.version;
 const blocks=checked?validation!.findings.filter(f=>f.severity==='block').length:0;
 const saved=session.commitStatus==='complete';
 const uncertain=['partial','unknown'].includes(session.commitStatus);
 return <section className="workflow-progress" aria-label="Learning workflow progress">
  <ol>
   <li><span className={`workflow-marker ${captureReady?'ready':''}`} aria-hidden="true">{captureReady?'✓':'1'}</span><div><strong>Capture expert judgment</strong><p>{capture.length}/3 answers · {guardrail?'guardrail recorded':'guardrail still needed'}</p></div></li>
   <li><span className={`workflow-marker ${confirmed?'ready':''}`} aria-hidden="true">{confirmed?'✓':'2'}</span><div><strong>Review the Work Map</strong><p>{debrief.length}/3 debrief answers · {session.map?`${session.map.rules.length} rules · v${session.map.version} ${session.map.status}`:'map not compiled'}</p></div></li>
   <li><span className={`workflow-marker ${saved?'ready':''}`} aria-hidden="true">{saved?'✓':'3'}</span><div><strong>Apply to a new case</strong><p>{saved?'Plan saved with explicit approval':uncertain?'Save outcome needs review':session.commitStatus==='writing'?'Saving approved plan…':!confirmed?'Confirm the map before practice':session.phase!=='teach'?'Ready to open the learner case':checked?validation!.allowed?'Current proposal checked · awaiting approval':`${blocks} blocking conflicts · proposal unsaved`:'Check your current proposal before saving'}</p></div></li>
  </ol>
 </section>;
}
