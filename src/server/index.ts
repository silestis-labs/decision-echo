import { Hono } from 'hono';
import { DurableObject } from 'cloudflare:workers';
import { z } from 'zod';
import { AnswerSchema,TaskSchema,WorkMapSchema,RuleSchema,type Session,type Task } from '../shared/contracts';
import { createSandboxSession,upgradeSandboxTemplate,compileMap,validatePlan,exportSkill } from '../domain/planning';
import { ApiError,digest,constantEqual,readBody,imageSchema,requiresDemoAccess } from './safety';
import { capabilities,voiceUrl,observe,coachLearner,liveCompile,readNotion,writeNotionTask,type ServerEnv } from './providers';
const app=new Hono<{Bindings:ServerEnv}>();
app.use('/api/*',async(c,next)=>{
 const origin=c.req.header('Origin');if(origin&&origin!==c.env.APP_ORIGIN&&origin!==c.env.EXTENSION_ORIGIN)return c.json({error:'Origin not allowed'},403);
 if(origin){c.header('Access-Control-Allow-Origin',origin);c.header('Vary','Origin')}
 c.header('Cache-Control','no-store');c.header('X-Content-Type-Options','nosniff');
 if(c.req.method==='OPTIONS'){c.header('Access-Control-Allow-Methods','GET, POST, OPTIONS');c.header('Access-Control-Allow-Headers','Content-Type, Authorization, X-Demo-Access');return c.body(null,204)}
 await next();
});
app.onError((error,c)=>{if(error instanceof ApiError){if(error.retryAfter)c.header('Retry-After',error.retryAfter);return c.json({error:error.message},error.status as 400)}if(error instanceof z.ZodError)return c.json({error:'Invalid request or provider schema'},422);return c.json({error:'Internal server error'},500)});
app.get('/api/config',c=>c.json(capabilities(c.env,new URL(c.req.url).origin)));
app.post('/api/sessions',async c=>{
 // Fail closed outside local development: new capabilities permit paid provider calls.
 if(requiresDemoAccess(c.env.APP_ORIGIN,c.env.DEMO_ACCESS_CODE,new URL(c.req.url).origin)){
  if(!c.env.DEMO_ACCESS_CODE)throw new ApiError(503,'Configure a demo access code before accepting public sessions');
  if(!constantEqual(c.req.header('X-Demo-Access')??'',c.env.DEMO_ACCESS_CODE))throw new ApiError(401,'Demo access code required');
 }
 const {mode}=z.object({mode:z.enum(['sandbox','live'])}).strict().parse(await readBody(c.req.raw,2000));
 if(mode==='live'&&!capabilities(c.env).notion)throw new ApiError(503,'Live mode requires Notion configuration and explicit availability');
 const id=crypto.randomUUID(), token=crypto.randomUUID()+crypto.randomUUID();
 const stub=c.env.SESSIONS.get(c.env.SESSIONS.idFromName(id));
 const response=await stub.fetch('https://session/init',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,mode,tokenHash:await digest(token)})});
 if(!response.ok)return response;return c.json({session:await response.json(),token},201);
});
app.all('/api/sessions/:id/*',async c=>{const id=z.string().uuid().parse(c.req.param('id'));return c.env.SESSIONS.get(c.env.SESSIONS.idFromName(id)).fetch(c.req.raw)});
app.get('/api/sessions/:id',async c=>{const id=z.string().uuid().parse(c.req.param('id'));return c.env.SESSIONS.get(c.env.SESSIONS.idFromName(id)).fetch(c.req.raw)});
app.all('*',c=>c.env.ASSETS.fetch(c.req.raw));
export default app;
const now=()=>new Date().toISOString();
const CAPTURE_LEASE_MS=60_000;
const MAX_EVIDENCE=1000;

const planSchema=z.object({tasks:z.array(TaskSchema).min(1).max(200),revision:z.number().int().nonnegative()}).strict();
function assertCompile(session:Session){
 const capture=session.answers.filter(a=>a.stage==='capture'),debrief=session.answers.filter(a=>a.stage==='debrief');
 if(capture.length<3||!capture.some(a=>a.guardrail)||debrief.length<3)throw new ApiError(422,'Need three capture answers including guardrail and three new debrief answers');
 if(new Set(session.answers.map(a=>a.question.trim().toLowerCase())).size!==session.answers.length)throw new ApiError(422,'Questions must be distinct');
 const ids=new Set(session.evidence.map(e=>e.id));if(session.answers.some(a=>!a.question.trim()||!a.answer.trim()||!a.evidenceIds.length||a.evidenceIds.some(id=>!ids.has(id))))throw new ApiError(422,'Answers must link real session evidence');
}
function assertMap(session:Session){
 if(!session.map)throw new ApiError(422,'No Work Map');WorkMapSchema.parse(session.map);
 const evidence=new Map(session.evidence.map(e=>[e.id,e]));
 const supported=(r:Session['map'] extends null?never:import('../shared/contracts').Rule)=>session.answers.some(a=>a.answer===r.expertQuote&&a.ruleKinds.includes(r.kind)&&r.evidenceIds.some(id=>a.evidenceIds.includes(id)&&evidence.get(id)?.kind==='frame')&&r.evidenceIds.some(id=>a.evidenceIds.includes(id)&&evidence.get(id)?.kind==='answer'&&evidence.get(id)?.text===a.answer));
 if(!session.map.rules.length||!session.map.teachBack.trim()||new Set(session.map.rules.map(r=>r.id)).size!==session.map.rules.length||session.map.rules.some(r=>r.evidenceIds.some(id=>!evidence.has(id))||!supported(r)))throw new ApiError(422,'Each rule needs the same expert answer, its frame and exact quote');
}
function sameTasks(a:Task[],b:Task[]){const dates=['start','end','deadline','reviewStart','reviewEnd','followUpCheckpoint','dependencyAvailableAt'];const normalize=(tasks:Task[])=>tasks.map(t=>Object.fromEntries(Object.entries(t).map(([k,v])=>[k,dates.includes(k)&&typeof v==='string'?Date.parse(v):v]))).sort((x,y)=>String(x.id).localeCompare(String(y.id)));return JSON.stringify(normalize(a))===JSON.stringify(normalize(b))}
function mergeProposal(base:Task[],proposal:Task[]):Task[]{
 if(proposal.length!==base.length||new Set(proposal.map(t=>t.id)).size!==base.length)throw new ApiError(422,'Whole plan must contain exactly the session tasks');

 return base.map(task=>{const change=proposal.find(t=>t.id===task.id);if(!change)throw new ApiError(422,'Unknown task');return {...task,assignee:change.assignee,start:change.start,end:change.end,reviewOwner:change.reviewOwner,reviewStart:change.reviewStart,reviewEnd:change.reviewEnd,followUpOwner:change.followUpOwner,followUpCheckpoint:change.followUpCheckpoint,decision:change.decision}});
}
export class EchoSession extends DurableObject<ServerEnv>{
 constructor(ctx:DurableObjectState,env:ServerEnv){super(ctx,env);ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS session_state (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL, token_hash TEXT NOT NULL)');ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS frame_assets (id TEXT PRIMARY KEY, image TEXT NOT NULL)');ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS write_journal (id TEXT PRIMARY KEY, task_id TEXT NOT NULL, status TEXT NOT NULL, at TEXT NOT NULL)')}
 private load(){const row=this.ctx.storage.sql.exec<{data:string;token_hash:string}>('SELECT data,token_hash FROM session_state WHERE id=1').toArray()[0];if(!row)throw new ApiError(404,'Session not found');return {session:upgradeSandboxTemplate(JSON.parse(row.data) as Session),hash:row.token_hash}}
 private save(session:Session){for(const e of session.evidence)if(e.image)this.ctx.storage.sql.exec('INSERT OR IGNORE INTO frame_assets(id,image) VALUES(?,?)',e.id,e.image);const metadata={...session,evidence:session.evidence.map(({image,...e})=>e)};this.ctx.storage.sql.exec('UPDATE session_state SET data=? WHERE id=1',JSON.stringify(metadata))}
 private async refreshLease(){const expiresAt=Date.now()+CAPTURE_LEASE_MS;await this.ctx.storage.put('capture_lease',expiresAt);await this.ctx.storage.setAlarm(expiresAt);return expiresAt}
 private async expireLease(){const expiresAt=await this.ctx.storage.get<number>('capture_lease');const s=this.load().session;if(s.recording&&(!expiresAt||expiresAt<=Date.now())){s.recording=false;s.epoch++;s.revision++;this.save(s);await this.ctx.storage.delete('capture_lease');return true}return false}
 async alarm(){await this.expireLease()}
 private visible(s:Session):Session{
  const latest=[...s.evidence].reverse().find(e=>e.kind==='frame');
  const asset=latest?this.ctx.storage.sql.exec<{image:string}>('SELECT image FROM frame_assets WHERE id=?',latest.id).toArray()[0]:undefined;
  return {...s,tasks:s.mode==='sandbox'&&s.phase!=='teach'?s.tasks.filter(t=>t.id!=='atlas'):s.tasks,evidence:s.evidence.map(({image,...e})=>e.id===latest?.id&&asset?{...e,image:asset.image}:e)};
 }
 private ensureCurrent(revision:number,epoch?:number){const s=this.load().session;if(s.revision!==revision||(epoch!==undefined&&s.epoch!==epoch))throw new ApiError(409,'Session changed; discard stale result');return s}
 async fetch(request:Request){try{return await this.handle(request)}catch(error){const status=error instanceof ApiError?error.status:error instanceof z.ZodError?422:500;const response=Response.json({error:error instanceof ApiError?error.message:error instanceof z.ZodError?'Invalid request or provider schema':'Internal session error'},{status});if(error instanceof ApiError&&error.retryAfter)response.headers.set('Retry-After',error.retryAfter);return response}}
 private async handle(request:Request):Promise<Response>{
 const url=new URL(request.url);
 if(url.pathname==='/init'){
  if(this.ctx.storage.sql.exec('SELECT id FROM session_state').toArray().length)throw new ApiError(409,'Session already initialized');
  const init=z.object({id:z.string().uuid(),mode:z.enum(['sandbox','live']),tokenHash:z.string().length(64)}).strict().parse(await readBody(request,3000));
  const s=createSandboxSession(init.id,init.mode);if(init.mode==='live'){const live=await readNotion(this.env);s.tasks=live.tasks;this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS heldout (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');this.ctx.storage.sql.exec('INSERT INTO heldout VALUES(1,?)',JSON.stringify(live.heldout));s.availability=live.availability;s.evidence=[];s.answers=[];s.map=null;}
  this.ctx.storage.sql.exec('INSERT INTO session_state(id,data,token_hash) VALUES(1,?,?)',JSON.stringify(s),init.tokenHash);return Response.json(this.visible(s));
 }
 const loaded=this.load();const auth=request.headers.get('Authorization');if(!auth?.startsWith('Bearer ')||!constantEqual(await digest(auth.slice(7)),loaded.hash))throw new ApiError(401,'Invalid session capability');
 await this.expireLease();let s=this.load().session;const action=url.pathname.split('/')[4]||'';
 if(request.method==='GET'){if(action===''){return Response.json(this.visible(s))}if(action==='frames'){const id=url.pathname.split('/')[5];if(!s.evidence.some(e=>e.id===id&&e.kind==='frame'))throw new ApiError(404,'Frame not found');const asset=this.ctx.storage.sql.exec<{image:string}>('SELECT image FROM frame_assets WHERE id=?',id).toArray()[0];if(!asset)throw new ApiError(404,'Frame not found');return Response.json({image:asset.image});}if(action==='journal')return Response.json({commitStatus:s.commitStatus,writes:this.ctx.storage.sql.exec('SELECT id,task_id,status,at FROM write_journal ORDER BY at').toArray()});if(action==='export'){if(!s.map||s.map.status!=='confirmed')throw new ApiError(409,'Confirm the Work Map before exporting');return Response.json({markdown:exportSkill(s.map,s.evidence),map:s.map})}throw new ApiError(404,'Not found')}
 if(request.method!=='POST')throw new ApiError(405,'Method not allowed');
 const body=await readBody(request);s=this.load().session;
 if(s.commitStatus==='writing'&&action!=='recording')throw new ApiError(409,'A commit is in progress');
 if(action==='recording'){
  const b=z.object({recording:z.boolean(),epoch:z.number().int()}).strict().parse(body);if(b.epoch!==s.epoch)throw new ApiError(409,'Stale capture epoch');s.recording=b.recording;s.epoch++;s.revision++;this.save(s);if(b.recording)await this.refreshLease();else{await this.ctx.storage.delete('capture_lease');await this.ctx.storage.deleteAlarm()}return Response.json(this.visible(s));
 }
 if(action==='heartbeat'){
  const {epoch}=z.object({epoch:z.number().int()}).strict().parse(body);if(!s.recording||epoch!==s.epoch)throw new ApiError(409,'Capture paused or stale epoch');return Response.json({expiresAt:await this.refreshLease()});
 }
 if(action==='delete'){
  z.object({confirmed:z.literal(true)}).strict().parse(body);
  if(s.recording||['writing','partial','unknown'].includes(s.commitStatus))throw new ApiError(409,'Stop recording and reconcile any uncertain commit before deleting');
  this.ctx.storage.sql.exec('DELETE FROM frame_assets');this.ctx.storage.sql.exec('DELETE FROM write_journal');this.ctx.storage.sql.exec('DELETE FROM session_state');
  this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS heldout (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');this.ctx.storage.sql.exec('DELETE FROM heldout');await this.ctx.storage.delete('capture_lease');await this.ctx.storage.deleteAlarm();
  return Response.json({deleted:true});
 }
 if(action==='evidence'){
  const b=z.object({epoch:z.number().int(),kind:z.enum(['frame','activity']),text:z.string().max(5000),image:imageSchema.optional()}).strict().parse(body);
  if(!s.recording||b.epoch!==s.epoch)throw new ApiError(409,'Capture paused or stale epoch');if(b.kind==='frame'&&!b.image)throw new ApiError(422,'A frame needs captured image data');if(b.image&&Number(this.ctx.storage.sql.exec<{total:number}>('SELECT COALESCE(SUM(length(image)),0) AS total FROM frame_assets').toArray()[0].total)+b.image.length>32_000_000)throw new ApiError(413,'Frame retention budget reached; start a new session');if(s.evidence.length>=MAX_EVIDENCE)throw new ApiError(413,'Evidence limit reached');
  if(b.kind==='activity'){const last=[...s.evidence].reverse().find(e=>e.kind==='activity'&&e.text===b.text);if(last&&Date.now()-Date.parse(last.at)<2000){await this.refreshLease();return Response.json(this.visible(s));}}
  s.evidence.push({id:crypto.randomUUID(),sessionId:s.id,at:now(),...b});s.revision++;this.save(s);await this.refreshLease();return Response.json(this.visible(s));
 }
 if(action==='answers'){
  const answer=AnswerSchema.strict().parse(body);if(s.evidence.length>=MAX_EVIDENCE)throw new ApiError(413,'Evidence limit reached');if(s.map?.status==='confirmed')throw new ApiError(409,'Confirmed map is immutable');if(s.answers.length>=30||s.answers.some(a=>a.id===answer.id))throw new ApiError(409,'Duplicate or too many answers');const frameIds=answer.evidenceIds.filter(id=>s.evidence.some(e=>e.id===id&&e.kind==='frame'&&e.sessionId===s.id));
  if(!frameIds.length)throw new ApiError(422,'Answer must link an actual captured frame');
  const answerEvidence={id:crypto.randomUUID(),sessionId:s.id,epoch:s.epoch,at:now(),kind:'answer' as const,text:answer.answer};s.evidence.push(answerEvidence);answer.evidenceIds=[...frameIds,answerEvidence.id];s.answers.push(answer);s.revision++;this.save(s);return Response.json(this.visible(s));
 }
 if(action==='voice'){const {role}=z.object({role:z.enum(['expert','tutor'])}).strict().parse(body);if(role==='tutor'&&s.map?.status!=='confirmed')throw new ApiError(409,'Confirm Work Map first');if(!s.recording)throw new ApiError(409,'Start recording before voice');const epoch=s.epoch;const result=await voiceUrl(this.env,role);const current=this.load().session;if(!current.recording||current.epoch!==epoch)throw new ApiError(409,'Voice authorization became stale');return Response.json(result)}
 if(action==='observe'){
  const b=z.object({epoch:z.number().int(),image:imageSchema}).strict().parse(body);if(!s.recording||b.epoch!==s.epoch)throw new ApiError(409,'Capture paused or stale');
  const result=await observe(this.env,b.image);const current=this.load().session;if(!current.recording||current.epoch!==b.epoch)throw new ApiError(409,'Stale observation discarded');return Response.json(result);
 }
 if(action==='coach'){
  const b=z.object({epoch:z.number().int(),frameId:z.string().uuid()}).strict().parse(body);
  if(s.phase!=='teach'||s.map?.status!=='confirmed')throw new ApiError(409,'Start Teach with a confirmed Work Map before visual coaching');
  if(!s.recording||b.epoch!==s.epoch)throw new ApiError(409,'Capture paused or stale epoch');
  const latest=[...s.evidence].reverse().find(e=>e.kind==='frame');
  if(!latest||latest.id!==b.frameId||latest.epoch!==b.epoch)throw new ApiError(409,'Analyze the latest frame from this learner capture epoch');
  const asset=this.ctx.storage.sql.exec<{image:string}>('SELECT image FROM frame_assets WHERE id=?',b.frameId).toArray()[0];
  if(!asset)throw new ApiError(404,'Learner frame not found');
  const mapVersion=s.map.version;
  const result=await coachLearner(this.env,{image:asset.image,frameId:b.frameId,map:s.map,tasks:s.tasks,availability:s.availability});
  const current=this.load().session;
  if(!current.recording||current.epoch!==b.epoch||current.phase!=='teach'||current.map?.status!=='confirmed'||current.map.version!==mapVersion)throw new ApiError(409,'Stale visual coaching discarded');
  return Response.json({...result,frameId:b.frameId,at:latest.at,mapVersion});
 }
 if(action==='compile'){
  z.object({}).strict().parse(body);if(s.map?.status==='confirmed')throw new ApiError(409,'Confirmed map requires explicit editing before recompilation');if(s.phase==='teach')throw new ApiError(409,'Learner evidence cannot compile expert rules');assertCompile(s);if(s.recording)throw new ApiError(409,'Pause recording before compiling');
  const revision=s.revision,epoch=s.epoch;const map=this.env.OPENAI_API_KEY?await liveCompile(this.env,s):compileMap(s);
  s=this.ensureCurrent(revision,epoch);s.map=map;assertMap(s);s.phase='map';s.revision++;this.save(s);return Response.json(this.visible(s));
 }
 if(action==='confirm'){
  const {version}=z.object({version:z.number().int()}).strict().parse(body);assertCompile(s);assertMap(s);if(s.map!.version!==version||s.map!.status!=='draft')throw new ApiError(409,'Map version changed');s.map!.status='confirmed';s.map!.confirmedAt=now();s.revision++;this.save(s);return Response.json(this.visible(s));
 }
 if(action==='map'){
  const b=z.object({rules:z.array(RuleSchema).min(1).max(30),teachBack:z.string().min(1).max(10000),version:z.number().int()}).strict().parse(body);
  if(!s.map||b.version!==s.map.version||s.phase==='teach')throw new ApiError(409,'Map version changed or learner already started');
  s.map={id:s.map.id,version:s.map.version+1,status:'draft',rules:b.rules,teachBack:b.teachBack};assertMap(s);s.validation=null;s.revision++;this.save(s);return Response.json(this.visible(s));
 }
 if(action==='teach'){
  z.object({}).strict().parse(body);if(s.map?.status!=='confirmed')throw new ApiError(409,'Confirm map first');if(s.phase!=='teach'&&s.mode==='live'){const held=this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM heldout WHERE id=1').toArray()[0];if(held)s.tasks.push(...JSON.parse(held.data));}s.phase='teach';s.revision++;this.save(s);return Response.json(this.visible(s));
 }
 if(action==='validate'||action==='commit'){
  const b=(action==='commit'?planSchema.extend({mapVersion:z.number().int(),confirmed:z.literal(true)}):planSchema).parse(body);
  if(s.phase!=='teach')throw new ApiError(409,'Start the learner case first');if(b.revision!==s.revision)throw new ApiError(409,'Plan revision changed');if(!s.map||s.map.status!=='confirmed')throw new ApiError(409,'An expert-confirmed map is required');
  let tasks=mergeProposal(s.tasks,b.tasks);
  if(s.mode==='live'){const fresh=await readNotion(this.env);s=this.ensureCurrent(b.revision);fresh.tasks.push(...fresh.heldout);if(!sameTasks(fresh.tasks,s.tasks))throw new ApiError(409,'Notion changed externally; start a fresh session');tasks=mergeProposal(fresh.tasks,b.tasks);s.availability=fresh.availability;}
  const validation=validatePlan(tasks,s.availability,s.map!,{requireUrgentResolution:true});s.validation=validation;
  if(action==='validate'){
   const previous=s.progress??{checks:0,blockedChecks:0,encounteredRuleIds:[],resolvedRuleIds:[]};
   const blocked=validation.findings.filter(f=>f.severity==='block'&&f.ruleId!=='system').map(f=>f.ruleId);
   s.progress={checks:previous.checks+1,blockedChecks:previous.blockedChecks+(validation.allowed?0:1),encounteredRuleIds:[...new Set([...previous.encounteredRuleIds,...blocked])],resolvedRuleIds:validation.allowed?[...new Set([...previous.resolvedRuleIds,...previous.encounteredRuleIds])]:previous.resolvedRuleIds};
  }
  if(action==='validate'){this.save(s);return Response.json({session:this.visible(s),validation})}
  if(!validation.allowed)throw new ApiError(422,'Learned guardrail blocks commit');if(!('mapVersion' in b)||b.mapVersion!==s.map!.version)throw new ApiError(409,'Map version changed');if(s.commitStatus!=='idle')throw new ApiError(409,'Commit already attempted; reconcile instead of retrying');
  s.commitStatus='writing';s.revision++;this.save(s);
  if(s.mode==='sandbox'){s.tasks=tasks;s.commitStatus='complete';s.revision++;this.save(s);return Response.json(this.visible(s))}
  let count=0;for(const task of tasks){const journalId=crypto.randomUUID();this.ctx.storage.sql.exec('INSERT INTO write_journal VALUES(?,?,?,?)',journalId,task.id,'attempting',now());
   try{await writeNotionTask(this.env,task);this.ctx.storage.sql.exec('UPDATE write_journal SET status=? WHERE id=?','verified',journalId);count++;}catch{
    this.ctx.storage.sql.exec('UPDATE write_journal SET status=? WHERE id=?','unknown',journalId);const current=this.load().session;current.commitStatus=count?'partial':'unknown';current.revision++;this.save(current);return Response.json(this.visible(current));}
   const current=this.load().session;if(current.epoch!==s.epoch){current.commitStatus='partial';current.revision++;this.save(current);return Response.json(this.visible(current));}
  }
  s=this.load().session;s.tasks=tasks;s.commitStatus='complete';s.revision++;this.save(s);return Response.json(this.visible(s));
 }
 throw new ApiError(404,'Not found');
 }
}
