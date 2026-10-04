import assert from 'node:assert/strict';
const origin=process.env.TEST_API_ORIGIN||'http://127.0.0.1:8787';
const init=await fetch(origin+'/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'sandbox'})});
assert.equal(init.status,201);const {session,token}=await init.json();
async function call(suffix,body,status=200){const response=await fetch(`${origin}/api/sessions/${session.id}${suffix}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body===undefined?undefined:JSON.stringify(body)});const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));return data;}
const started=await call('/recording',{epoch:session.epoch,recording:true});
const lease=await call('/heartbeat',{epoch:started.epoch});assert(lease.expiresAt>Date.now());
console.log('Testing real capture lease expiration without a collector heartbeat (about 61 seconds).');
await new Promise(resolve=>setTimeout(resolve,Math.max(0,lease.expiresAt-Date.now())+1200));
const stopped=await call('');assert.equal(stopped.recording,false);assert.equal(stopped.epoch,started.epoch+1);
await call('/heartbeat',{epoch:started.epoch},409);
await call('/evidence',{epoch:started.epoch,kind:'activity',text:'PRIVATE_PAUSED_CANARY'},409);
assert.equal((await call('')).evidence.some(e=>e.text.includes('PRIVATE_PAUSED_CANARY')),false);
await call('/delete',{confirmed:true});await call('',undefined,404);
console.log('PASS real lease expiry, epoch invalidation, paused privacy canary rejection, authenticated evidence deletion.');
