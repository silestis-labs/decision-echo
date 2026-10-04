export type PendingVoiceContext={context:string;debrief:boolean;teach?:boolean};
/** The React SDK startSession returns void. Wait for connected state before sending. */
export function deliverVoiceContext(status:string,pending:PendingVoiceContext|null,sender:{sendContextualUpdate:(text:string)=>void;sendUserMessage:(text:string)=>void}):PendingVoiceContext|null{
 if(status!=='connected'||!pending)return pending;
 sender.sendContextualUpdate(pending.context);
 if(pending.debrief)sender.sendUserMessage('The expert has finished capture. Ask three new debrief questions, one at a time, about missing judgment or exceptions. Do not repeat questions already answered and do not introduce a learner test case.');
 if(pending.teach)sender.sendUserMessage('I am the learner and I am about to work the new case in my own app. Before I change anything, ask me to predict my next decision and why. Coach me one step at a time and ask for a prediction again before each consequential change.');
 return null;
}
