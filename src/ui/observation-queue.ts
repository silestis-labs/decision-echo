export type Observation={question:string;ruleKinds:string[];guardrail:boolean};
export type ObservationFrame={frameId:string;epoch:number;image:string};
type Options={request:(frame:ObservationFrame,signal:AbortSignal)=>Promise<Observation>;onResult:(result:Observation,frame:ObservationFrame)=>void;onError:(error:unknown,frame:ObservationFrame)=>void;intervalMs?:number};
/** Observation latency cannot hold the screen uploader. Keep one active request and only the newest pending frame. */
export class ObservationQueue{
 private generation=0;private active=false;private latest:ObservationFrame|null=null;private lastFrame='';private lastStart=-Infinity;private timer:ReturnType<typeof setTimeout>|null=null;private controller:AbortController|null=null;
 constructor(private options:Options){}
 submit(frame:ObservationFrame){if(frame.frameId===this.lastFrame||frame.frameId===this.latest?.frameId)return;this.latest=frame;this.pump();}
 invalidate(){this.generation++;this.latest=null;this.active=false;this.lastFrame='';this.lastStart=-Infinity;if(this.timer)clearTimeout(this.timer);this.timer=null;this.controller?.abort();this.controller=null;}
 private pump(){if(this.active||!this.latest)return;const remaining=(this.options.intervalMs??2000)-(Date.now()-this.lastStart);if(remaining>0){if(!this.timer)this.timer=setTimeout(()=>{this.timer=null;this.pump();},remaining);return;}const frame=this.latest;this.latest=null;this.lastFrame=frame.frameId;this.lastStart=Date.now();this.active=true;const generation=this.generation,controller=new AbortController();this.controller=controller;
 void this.options.request(frame,AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])).then(result=>{if(generation===this.generation&&!controller.signal.aborted)this.options.onResult(result,frame);}).catch(error=>{if(generation===this.generation&&!controller.signal.aborted)this.options.onError(error,frame);}).finally(()=>{if(generation!==this.generation)return;this.active=false;this.controller=null;this.pump();});}
}
