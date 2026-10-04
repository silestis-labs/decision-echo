// Actual unpacked MV3 extension -> disposable local Wrangler/Durable Object.
// Temporary config contains no provider keys; no deployment or voice/model calls.
import {chromium, expect} from '@playwright/test';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('.'), scratch=await mkdtemp(path.join(tmpdir(),'decision-echo-extension-worker-'));
let context, child, id, token;
const targetServer=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Synthetic Worker extension target</title><button id="decision">Assign synthetic Worker task</button><textarea aria-label="Private input"></textarea>');});
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return server.address().port;}
const targetOrigin=`http://127.0.0.1:${await listen(targetServer)}`;
const reserve=createServer();const apiPort=await listen(reserve);await new Promise(resolve=>reserve.close(resolve));
const apiOrigin=`http://127.0.0.1:${apiPort}`;
async function request(suffix='',body,status=200){
 const response=await fetch(`${apiOrigin}/api/sessions/${id}${suffix}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body===undefined?undefined:JSON.stringify(body)});
 assert.equal(response.status,status,`Unexpected API status for ${suffix||'session'}`);return response.json();
}
try{
 const extension=path.join(root,'apps/chrome-extension');
 context=await chromium.launchPersistentContext(path.join(scratch,'profile'),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
 const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const extensionOrigin=worker.url().replace('/background.js','');
 const configuration=JSON.parse(await readFile(path.join(root,'wrangler.jsonc'),'utf8'));
 delete configuration.$schema;
 configuration.name='decision-echo-extension-test';configuration.main=path.join(root,'src/server/index.ts');configuration.assets.directory=path.join(root,'dist');
 configuration.vars={MODE:'sandbox',OPENAI_MODEL:'gpt-6-sol',ELEVENLABS_VOICE_MODEL:'v4-turbo',APP_ORIGIN:targetOrigin,EXTENSION_ORIGIN:extensionOrigin};
 const configPath=path.join(scratch,'wrangler.json');await writeFile(configPath,JSON.stringify(configuration));
 // Config and cwd are outside the project, so .dev.vars is never loaded.
 child=spawn(path.join(root,'node_modules/.bin/wrangler'),['dev','--local','--config',configPath,'--ip','127.0.0.1','--port',String(apiPort),'--persist-to',path.join(scratch,'state')],{cwd:scratch,detached:true,stdio:['ignore','pipe','pipe'],env:{...process.env,WRANGLER_SEND_METRICS:'false',CI:'true'}});
 // Consume output without printing environment/configuration or secrets.
 child.stdout.on('data',()=>{});child.stderr.on('data',()=>{});
 let ready=false;
 for(let i=0;i<60;i++){if(child.exitCode!==null)throw Error('Disposable Wrangler exited before readiness');try{const response=await fetch(apiOrigin+'/api/config',{signal:AbortSignal.timeout(500)});if(response.ok){const value=await response.json();assert.equal(value.elevenLabs,false);assert.equal(value.openAI,false);assert.equal(value.notion,false);ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
 assert(ready,'Disposable Wrangler did not become ready');
 const created=await fetch(apiOrigin+'/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'sandbox'})});assert.equal(created.status,201);const initial=await created.json();id=initial.session.id;token=initial.token;
 let session=await request('/recording',{recording:true,epoch:initial.session.epoch});
 // Verify exact-origin CORS independently from Chrome's privileged GET behavior.
 const allowed=await fetch(apiOrigin+`/api/sessions/${id}`,{method:'OPTIONS',headers:{Origin:extensionOrigin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'Authorization, Content-Type'}});assert.equal(allowed.status,204);assert.equal(allowed.headers.get('Access-Control-Allow-Origin'),extensionOrigin);
 const denied=await fetch(apiOrigin+`/api/sessions/${id}`,{headers:{Origin:'chrome-extension://unapproved',Authorization:`Bearer ${token}`}});assert.equal(denied.status,403);
 const target=await context.newPage();await target.goto(targetOrigin);
 const panel=await context.newPage();await panel.goto(extensionOrigin+'/panel.html');await panel.locator('#endpoint').fill(apiOrigin);await panel.locator('#session').fill(id);await panel.locator('#token').fill(token);await panel.locator('#origin').fill(targetOrigin);
 await target.bringToFront();await panel.locator('#start').click();await expect(panel.locator('#status')).toHaveText('Recording selected tab metadata');
 await target.locator('#decision').click();await expect.poll(async()=> (await request()).evidence.some(e=>e.text==='Click: Assign synthetic Worker task')).toBe(true);
 await new Promise(resolve=>setTimeout(resolve,550));await target.locator('textarea').fill('PRIVATE SYNTHETIC VALUE');await target.locator('textarea').press('Control+A');await expect.poll(async()=> (await request()).evidence.some(e=>e.text==='Shortcut activity')).toBe(true);
 session=await request();assert(!JSON.stringify(session.evidence).includes('PRIVATE SYNTHETIC VALUE'));const activeEpoch=session.epoch;
 await panel.locator('#frames').check();await target.bringToFront();await expect(panel.locator('#status')).toHaveText('Screenshot permission missing. Click the extension toolbar action on the selected tab, then consent again.',{timeout:12000});await panel.locator('#frames').uncheck();
 await target.bringToFront();await panel.locator('#start').click();await expect(panel.locator('#status')).toHaveText('Recording selected tab metadata');await panel.locator('#stop').click();await expect(panel.locator('#status')).toHaveText('Off record: workspace capture stopped');
 session=await request();assert.equal(session.recording,false);assert(session.epoch>activeEpoch);const pausedCount=session.evidence.length;
 await request('/evidence',{epoch:activeEpoch,kind:'activity',text:'Synthetic stale activity'},409);
 await target.locator('#decision').click();await new Promise(resolve=>setTimeout(resolve,2300));assert.equal((await request()).evidence.length,pausedCount);
 session=await request('/recording',{recording:true,epoch:session.epoch});await target.bringToFront();await panel.locator('#start').click();await expect(panel.locator('#status')).toHaveText('Recording selected tab metadata');
 await request('/recording',{recording:false,epoch:session.epoch});await expect(panel.locator('#status')).toHaveText('Stopped: workspace capture authority changed',{timeout:7000});
 console.log('PASS actual unpacked MV3 + disposable local Worker/SQLite Durable Object: exact-origin CORS, capability auth, click/shortcut evidence, typed-value privacy, heartbeat, enforced screenshot permission, local/remote off-record and stale-epoch rejection. No providers or deployment used.');
}finally{
 await context?.close();if(child?.pid){try{process.kill(-child.pid,'SIGTERM');}catch{}await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);setTimeout(resolve,3000);});}
 await new Promise(resolve=>targetServer.close(resolve));await rm(scratch,{recursive:true,force:true});
}
