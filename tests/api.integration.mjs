import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
let base=process.env.TEST_API_ORIGIN, scratch, child;
try {
if(!base){
 const root=path.resolve('.');scratch=await mkdtemp(path.join(tmpdir(),'decision-echo-api-test-'));
 const reserve=createServer();await new Promise(resolve=>reserve.listen(0,'127.0.0.1',resolve));const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));base=`http://127.0.0.1:${port}`;
 const config=JSON.parse(await readFile(path.join(root,'wrangler.jsonc'),'utf8'));delete config.$schema;
 config.name='decision-echo-api-test';config.main=path.join(root,'src/server/index.ts');config.assets.directory=path.join(root,'dist');
 config.vars={MODE:'sandbox',OPENAI_MODEL:'gpt-6-sol',ELEVENLABS_VOICE_MODEL:'v4-turbo',APP_ORIGIN:'http://127.0.0.1:5173'};
 const configPath=path.join(scratch,'wrangler.json');await writeFile(configPath,JSON.stringify(config));
 // Temporary config/cwd prevents loading developer .dev.vars and paid providers.
 child=spawn(path.join(root,'node_modules/.bin/wrangler'),['dev','--local','--config',configPath,'--ip','127.0.0.1','--port',String(port),'--persist-to',path.join(scratch,'state')],{cwd:scratch,detached:true,stdio:['ignore','pipe','pipe'],env:{...process.env,WRANGLER_SEND_METRICS:'false',CI:'true'}});
 child.stdout.on('data',()=>{});child.stderr.on('data',()=>{});
 let ready=false;for(let i=0;i<60;i++){if(child.exitCode!==null)throw Error('Isolated API Worker exited before readiness');try{const r=await fetch(base+'/api/config',{signal:AbortSignal.timeout(500)});if(r.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,250));}assert(ready,'Isolated API Worker unavailable');
}
const capabilities=await (await fetch(base+'/api/config')).json();assert.equal(capabilities.openAI,false,'Deterministic API regression requires an isolated Worker without model credentials');
let token='',id='',s;
async function call(path,body,status=200,authorized=true){const r=await fetch(base+'/api'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(authorized&&token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});const value=await r.json();assert.equal(r.status,status,JSON.stringify(value));return value;}
const init=await call('/sessions',{mode:'sandbox'},201);({token}=init);s=init.session;id=s.id;
const api=(suffix,body,status)=>call('/sessions/'+id+suffix,body,status);
assert.equal(s.tasks.some(t=>t.id==='atlas'),false,'held-out case leaked');
await call('/sessions/'+id,undefined,401,false);
await api('/compile',{},422);
s=await api('/recording',{recording:true,epoch:s.epoch});const oldEpoch=s.epoch;
await api('/delete',{confirmed:true},409);
assert((await api('/heartbeat',{epoch:s.epoch})).expiresAt>Date.now());
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP1sAAAAASUVORK5CYII=';
s=await api('/evidence',{epoch:s.epoch,kind:'frame',text:'Synthetic integration test screen',image});const frame=s.evidence[0].id;
await api('/coach',{epoch:s.epoch,frameId:frame},409);
s=await api('/evidence',{epoch:s.epoch,kind:'frame',text:'Second synthetic test screen',image});
assert.equal(s.evidence.filter(e=>e.image).length,1,'Ordinary responses must not resend every frame');
assert.equal((await api('/frames/'+frame)).image,image);
await api('/evidence',{epoch:s.epoch,kind:'answer',text:'Forged expert answer'},422);
await api('/answers',{id:crypto.randomUUID(),stage:'capture',question:'Bounded synthetic question',answer:'x'.repeat(10001),evidenceIds:[frame],ruleKinds:[],guardrail:false},422);
s=await api('/evidence',{epoch:s.epoch,kind:'activity',text:'Typing activity'});const beforeActivity=s.evidence.length;
s=await api('/evidence',{epoch:s.epoch,kind:'activity',text:'Typing activity'});assert.equal(s.evidence.length,beforeActivity,'Repeated activity must be coalesced');
const policies=['no_overlap','availability','customer_only','skill_match','dependency_ready','focus_block','review_buffer','blocked_followup'];
for(let i=0;i<6;i++)s=await api('/answers',{id:crypto.randomUUID(),stage:i<3?'capture':'debrief',question:`Distinct synthetic test question ${i}`,answer:`Synthetic expert response ${i}: validate the complete schedule.`,evidenceIds:[frame],ruleKinds:i===0?policies:['no_overlap'],guardrail:i===2});
s=await api('/recording',{recording:false,epoch:s.epoch});
await api('/heartbeat',{epoch:oldEpoch},409);
await api('/evidence',{epoch:oldEpoch,kind:'frame',text:'Stale frame',image},409);
s=await api('/compile',{});assert.equal(s.map.status,'draft');assert.equal(s.map.rules.length,8);assert.equal(s.tasks.some(t=>t.id==='atlas'),false);
await api('/confirm',{version:s.map.version+1},409);
s=await api('/confirm',{version:s.map.version});await api('/compile',{},409);
const exported=await api('/export');assert.match(exported.markdown,/Synthetic expert response/);
s=await api('/teach',{});assert.equal(s.tasks.some(t=>t.id==='atlas'),true);
let held=await api('/validate',{tasks:s.tasks,revision:s.revision});assert.equal(held.validation.allowed,false,'Urgent held work cannot complete case');assert.match(held.validation.findings[0].message,/urgent/);
s=await api('/recording',{recording:true,epoch:s.epoch});
s=await api('/evidence',{epoch:s.epoch,kind:'frame',text:'Synthetic learner screen for coaching gate',image});
const learnerFrame=s.evidence.at(-1).id;
{const before=s.revision;const after=await api('/evidence',{epoch:s.epoch,kind:'activity',text:'Edited Atlas Data Correction: person Unassigned → Lea'});assert.equal(after.revision,before,'Evidence must not invalidate a pending plan revision');const checked=await api('/validate',{tasks:s.tasks,revision:before});assert.equal(typeof checked.validation.allowed,'boolean');s=checked.session;}
await api('/coach',{epoch:s.epoch,frameId:frame},409);
if(!(await call('/config')).openAI)await api('/coach',{epoch:s.epoch,frameId:learnerFrame},503);
s=await api('/recording',{recording:false,epoch:s.epoch});
await api('/coach',{epoch:s.epoch-1,frameId:learnerFrame},409);
const tasks=structuredClone(s.tasks);tasks.find(t=>t.id==='presentation').reviewStatus='Approved';Object.assign(tasks.find(t=>t.id==='atlas'),{assignee:'Lea',start:'2026-10-08T09:00:00+02:00',end:'2026-10-08T11:00:00+02:00',decision:'Schedule'});
let result=await api('/validate',{tasks,revision:s.revision});assert.equal(result.validation.allowed,false);assert.equal(result.session.tasks.find(t=>t.id==='presentation').reviewStatus,'Planned','Forged approval must not overwrite source status');assert(result.validation.findings.some(f=>f.ruleId==='rule-no_overlap'));
await api('/commit',{tasks,revision:s.revision,mapVersion:s.map.version,confirmed:true},422);
Object.assign(tasks.find(t=>t.id==='cohort'),{start:'2026-10-09T08:00:00+02:00',end:'2026-10-09T12:00:00+02:00'});
result=await api('/validate',{tasks,revision:s.revision});assert.equal(result.validation.allowed,true);
await api('/commit',{tasks,revision:s.revision-1,mapVersion:s.map.version,confirmed:true},409);
const results=await Promise.all([api('/commit',{tasks,revision:s.revision,mapVersion:s.map.version,confirmed:true}),api('/commit',{tasks,revision:s.revision,mapVersion:s.map.version,confirmed:true},409)]);
assert.equal(results[0].commitStatus,'complete');s=await api('');assert.equal(s.commitStatus,'complete');assert.equal(s.progress.checks,4);assert.equal(s.progress.blockedChecks,3);assert(s.progress.resolvedRuleIds.includes('rule-no_overlap'));
await api('/delete',{confirmed:true});await api('',undefined,404);await api('/export',undefined,404);
console.log('PASS actual local Durable Object API: capability auth, held-out isolation, evidence provenance, privacy epoch, confirmed-map gate, double booking, complete correction, stale revision and duplicate commit.');

} finally {
 if(child?.pid){try{process.kill(-child.pid,'SIGTERM');}catch{}await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);setTimeout(resolve,3000);});}
 if(scratch)await rm(scratch,{recursive:true,force:true});
}
