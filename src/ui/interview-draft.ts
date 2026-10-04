export type DraftQuestion={text:string;frameId:string;origin:'manual'|'voice'|'vision'};
const same=(a:string,b:string)=>a.trim().replace(/\s+/g,' ').toLowerCase()===b.trim().replace(/\s+/g,' ').toLowerCase();
/** Explicit question/answer association. New agent turns cannot relabel an unsaved answer. */
export class InterviewDraft{
 question:DraftQuestion|null=null;answer='';private selectedFrame='';private queued:DraftQuestion[]=[];saving=false;
 get next(){return this.queued[0]??null;}
 get queuedCount(){return this.queued.length;}
 get frameId(){return this.question?.frameId||this.selectedFrame;}
 get dirty(){return !!this.question?.text.trim()||!!this.answer.trim();}
 manualQuestion(text:string,frameId:string){if(this.saving)return;this.question=text?{text,frameId:this.question?.frameId||this.selectedFrame||frameId,origin:'manual'}:null;this.queued=this.queued.filter(q=>!same(q.text,text));}
 manualAnswer(text:string,frameId:string){if(this.saving)return;this.answer=text;if(this.question&&!this.question.frameId)this.question={...this.question,frameId};}
 relink(frameId:string){if(this.saving)return;this.selectedFrame=frameId;if(this.question)this.question={...this.question,frameId};}
 receiveQuestion(question:DraftQuestion,respondingToActive=false):'active'|'queued'|'unchanged'{if(respondingToActive&&this.question){if(!this.answer.trim()&&!this.saving)this.question={...this.question,text:question.text};return 'unchanged';}if(this.question&&same(this.question.text,question.text))return 'unchanged';if(!this.dirty&&!this.saving){this.question=question;return 'active';}if(!this.queued.some(q=>same(q.text,question.text)))this.queued.push(question);return 'queued';}
 receiveAnswer(text:string):boolean{if(this.saving||this.next||!this.question?.text.trim())return false;this.answer=this.answer?`${this.answer}\n${text}`:text;return true;}
 useNext():boolean{if(this.saving||this.answer.trim()||!this.next)return false;this.question=this.queued.shift()!;return true;}
 beginSave(){if(this.saving||!this.question?.text.trim()||!this.answer.trim()||!this.question.frameId)throw new Error('A complete answer needs its question and a pinned captured frame.');this.saving=true;return {question:this.question.text.trim(),answer:this.answer.trim(),frameId:this.question.frameId};}
 finishSave(success:boolean){this.saving=false;if(success){this.question=null;this.answer='';this.selectedFrame='';}}
 discardCurrent(){this.question=null;this.answer='';this.selectedFrame='';this.saving=false;}
 discardQueued(){this.queued=[];}
 closePhase(){if(this.dirty||this.saving)throw new Error('Save or discard the current interview draft before completing this phase.');this.reset();}
 reset(){this.discardCurrent();this.queued=[];}
}
