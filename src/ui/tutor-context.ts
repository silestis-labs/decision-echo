import type {Session,Task,Validation} from '../shared/contracts';
export function voiceStartContext(session:Session,phase:'capture'|'debrief'|'teach',proposal:Task[],validation:Validation|null){
 if(phase==='teach')return {phase,confirmedMap:session.map,learnerCase:session.tasks,unsavedProposal:proposal,validation};
 return {phase,expertAnswers:session.answers};
}
