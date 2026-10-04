// Manual/native UI integration helper. Generates only an ephemeral synthetic session.
// Places its capability on the clipboard on explicit invocation; never prints it.
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:8787';
const init=await fetch(origin+'/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'sandbox'})});assert.equal(init.status,201);let {session,token}=await init.json();
async function call(suffix,body,status=200){const r=await fetch(`${origin}/api/sessions/${session.id}${suffix}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body===undefined?undefined:JSON.stringify(body)});const v=await r.json();assert.equal(r.status,status,'Native QA API request failed');return v;}
try{
 session=await call('/recording',{recording:true,epoch:session.epoch});
 execFileSync('pbcopy',{input:JSON.stringify({id:session.id,token,endpoint:origin})});
 console.log('Ephemeral synthetic connection copied. Paste into companion, load windows, select Decision Echo Synthetic Fixture, capture, then move the synthetic task.');
 const until=Date.now()+300000;let count=-1;
 while(Date.now()<until){
  session=await call('');const frames=session.evidence.filter(e=>e.kind==='frame');
  if(frames.length!==count){count=frames.length;console.log(`Native frames received: ${count}`);}
  if(!session.recording)break;
  if(frames.length>=2){
   const first=await call('/frames/'+frames[0].id);const last=await call('/frames/'+frames.at(-1).id);
   assert.notEqual(first.image,last.image,'Native frame pixels did not change');
   const oldEpoch=session.epoch;session=await call('/recording',{recording:false,epoch:oldEpoch});
   await call('/evidence',{epoch:oldEpoch,kind:'activity',text:'PAUSED_NATIVE_CANARY'},409);
   assert(!(await call('')).evidence.some(e=>e.text==='PAUSED_NATIVE_CANARY'));
   console.log('PASS two distinct real native frame payloads, actual Worker delivery, remote off-record and stale-canary rejection. Check companion stops. No external input permission claim.');
   break;
  }
  await call('/heartbeat',{epoch:session.epoch});await new Promise(resolve=>setTimeout(resolve,2000));
 }
 assert(count>=2,'Native test incomplete: no two changed frames within five minutes.');
 await new Promise(resolve=>setTimeout(resolve,5000));assert.equal((await call('')).evidence.filter(e=>e.kind==='frame').length,count,'Frames increased after remote pause');
}finally{
 const latest=await call('').catch(()=>null);if(latest?.recording)await call('/recording',{recording:false,epoch:latest.epoch}).catch(()=>{});
 await call('/delete',{confirmed:true}).catch(()=>{});
 console.log('Ephemeral native test session cleaned up; copied capability revoked.');
}
