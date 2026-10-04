import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
if(process.env.RUN_LIVE_VISION!=='1'){console.log('SKIP live vision: set RUN_LIVE_VISION=1');process.exit(0);}
const base=process.env.TEST_API_ORIGIN||'http://127.0.0.1:8787';
let token='',id='',s,browser;
async function call(path,body){const started=performance.now();const r=await fetch(base+'/api'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});const v=await r.json();assert.equal(r.status,body&&path==='/sessions'?201:200,JSON.stringify(v));if(/\/(compile|coach)$/.test(path))console.log(JSON.stringify({operation:path.split('/').at(-1),latencyMs:Math.round(performance.now()-started)}));return v;}
const api=(suffix,body)=>call('/sessions/'+id+suffix,body);
try{
 const config=await call('/config');assert(config.openAI,'OpenAI is not configured');
 if(process.env.EXPECT_OPENAI_MODEL)assert.equal(config.model,process.env.EXPECT_OPENAI_MODEL);
 console.log('Testing live vision model:',config.model);
 const init=await call('/sessions',{mode:'sandbox'});token=init.token;s=init.session;id=s.id;
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1000,height:500}});
 await page.setContent('<html><body style="font:28px sans-serif;padding:30px"><h1>Synthetic learner planner</h1><table border="1" cellpadding="15"><tr><th>Task</th><th>Client requirement</th><th>Assigned person</th></tr><tr><td>Client presentation</td><td>Jonas only</td><td>Lea</td></tr></table><p>Unsaved proposal — synthetic test data</p></body></html>');
 const image='data:image/png;base64,'+(await page.screenshot()).toString('base64');
 s=await api('/recording',{recording:true,epoch:s.epoch});
 s=await api('/evidence',{epoch:s.epoch,kind:'frame',text:'Synthetic expert test fixture',image});const frame=s.evidence.at(-1).id;
 for(let i=0;i<6;i++)s=await api('/answers',{id:crypto.randomUUID(),stage:i<3?'capture':'debrief',question:`Synthetic expert confirmation ${i}`,answer:'A client required assignee is binding. Jonas only means assign Jonas, never Lea. Escalate if that is impossible.',evidenceIds:[frame],ruleKinds:['customer_only'],guardrail:i===2});
 s=await api('/recording',{recording:false,epoch:s.epoch});s=await api('/compile',{});s=await api('/confirm',{version:s.map.version});s=await api('/teach',{});
 s=await api('/recording',{recording:true,epoch:s.epoch});s=await api('/evidence',{epoch:s.epoch,kind:'frame',text:'Synthetic learner wrong-assignee fixture',image});
 const result=await api('/coach',{epoch:s.epoch,frameId:s.evidence.at(-1).id});
 assert.equal(result.mapVersion,s.map.version);assert(result.concerns.some(c=>s.map.rules.find(r=>r.id===c.ruleId)?.kind==='customer_only'&&/Lea|Jonas/i.test(c.visibleBasis)),'Expected grounded required-assignee concern');
 for(const concern of result.concerns){const rule=s.map.rules.find(r=>r.id===concern.ruleId);assert(rule);assert.equal(concern.expertQuote,rule.expertQuote);assert.deepEqual(concern.evidenceIds,rule.evidenceIds);}
 console.log('PASS real Responses vision: synthetic screenshot wrong assignee detected, confirmed expert provenance restored. No real workspace or writes.');
}finally{
 if(id){try{s=await api('');if(s.recording)s=await api('/recording',{recording:false,epoch:s.epoch});await api('/delete',{confirmed:true});}catch{console.error('Synthetic session cleanup requires checking');}}
 await browser?.close();
}
