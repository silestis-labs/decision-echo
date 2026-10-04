// Actual unpacked MV3 Chromium + actual HTTP requests; synthetic local backend.
// Does not use personal Chrome profiles or prove the deployed Worker CORS config.
import {chromium, expect} from '@playwright/test';
import {createServer} from 'node:http';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
if(process.env.TEST_WORKER==='1'){await import('./worker-runtime.test.mjs');process.exit(0);}
let recording=true, epoch=1, extensionOrigin='', requests=[], evidence=[];
const server=createServer(async(req,res)=>{
  if(req.url.startsWith('/target')) {res.end('<!doctype html><title>Synthetic extension target</title><button id="decision">Assign synthetic task</button><textarea aria-label="Private input"></textarea>');return;}
  if (!req.url.startsWith('/api/')) {res.writeHead(404);res.end();return;}
  const origin=req.headers.origin;
  if(origin && origin!==extensionOrigin){res.writeHead(403);res.end('{}');return;}
  res.setHeader('Access-Control-Allow-Origin',extensionOrigin);res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  assert.equal(req.headers.authorization,'Bearer synthetic-runtime-token');
  assert(!req.url.includes('synthetic-runtime-token'));
  let raw='';for await(const part of req)raw+=part;
  const body=raw?JSON.parse(raw):null;requests.push({url:req.url,body});
  if(req.url.endsWith('/recording')){recording=body.recording;epoch++;}
  if(req.url.endsWith('/evidence')){
    if(!recording||body.epoch!==epoch){res.writeHead(409);res.end('{}');return;}
    evidence.push(body);
  }
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({recording,epoch}));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const profile=await mkdtemp(path.join(tmpdir(),'decision-echo-extension-runtime-'));
let context;
try{
 const extension=path.resolve('apps/chrome-extension');
 context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
 const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
 extensionOrigin=worker.url().replace('/background.js','');
 const target=await context.newPage();await target.goto(base+'/target');
 const panel=await context.newPage();await panel.goto(extensionOrigin+'/panel.html');
 await expect(panel.locator('#extension-origin')).toHaveText(extensionOrigin);
 await panel.locator('#endpoint').fill(base);await panel.locator('#session').fill('synthetic-session');await panel.locator('#token').fill('synthetic-runtime-token');await panel.locator('#origin').fill(base);
 await target.bringToFront();await panel.locator('#start').click();await expect(panel.locator('#status')).toHaveText('Recording selected tab metadata');
 await target.locator('#decision').click();await expect.poll(()=>evidence.some(e=>e.text==='Click: Assign synthetic task')).toBe(true);
 await new Promise(resolve=>setTimeout(resolve,550));await target.locator('textarea').fill('SENSITIVE SYNTHETIC VALUE');await target.locator('textarea').press('Control+A');
 await expect.poll(()=>evidence.some(e=>e.text==='Shortcut activity')).toBe(true);
 assert(!JSON.stringify(evidence).includes('SENSITIVE SYNTHETIC VALUE'));
 await panel.locator('#frames').check();await target.bringToFront();
 // Direct test opening of the panel is not a Chrome toolbar gesture. Verify the
 // browser enforces activeTab screenshot permission; do not weaken the manifest.
 await expect(panel.locator('#status')).toHaveText('Screenshot permission missing. Click the extension toolbar action on the selected tab, then consent again.',{timeout:12000});
 assert.equal(evidence.filter(e=>e.kind==='frame').length,0);await panel.locator('#frames').uncheck();
 await target.bringToFront();await panel.locator('#start').click();await expect(panel.locator('#status')).toHaveText('Recording selected tab metadata');
 await panel.locator('#stop').click();await expect(panel.locator('#status')).toHaveText('Off record: workspace capture stopped');
 const count=evidence.length;await target.locator('#decision').click();await new Promise(resolve=>setTimeout(resolve,2300));assert.equal(evidence.length,count);
 // Same panel may reuse its memory-only token; a remote epoch change stops it.
 recording=true;await target.bringToFront();await panel.locator('#start').click();await expect(panel.locator('#status')).toHaveText('Recording selected tab metadata');
 recording=false;epoch++;await expect(panel.locator('#status')).toHaveText('Stopped: workspace capture authority changed',{timeout:7000});
 recording=true;await target.bringToFront();await panel.locator('#start').click();await expect(panel.locator('#status')).toHaveText('Recording selected tab metadata');
 await target.goto(base+'/target?new-document=1');await expect(panel.locator('#status')).toHaveText('Stopped: tab navigated. Consent again to restart.');
 await panel.locator('#forget').click();await target.bringToFront();await panel.locator('#start').click();await expect(panel.locator('#status')).toHaveText('Session and token required');
 console.log('PASS actual unpacked MV3 runtime: content injection, metadata/shortcut privacy, browser-enforced screenshot consent, HTTP + bearer transfer, local and remote pause, navigation stop, memory reuse and forget. Backend is synthetic.');
}catch(error){console.error('Extension status:',await context?.pages().find(p=>p.url().endsWith('/panel.html'))?.locator('#status').textContent());throw error;}finally{await context?.close();await new Promise(resolve=>server.close(resolve));await rm(profile,{recursive:true,force:true});}
