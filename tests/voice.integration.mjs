// Opt-in real ElevenLabs account test. Uses labeled synthetic evidence/text, never microphone transcription claims.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
if(process.env.RUN_LIVE_VOICE!=='1'){console.log('SKIP real ElevenLabs test: set RUN_LIVE_VOICE=1 after authorizing account usage.');process.exit(0);}
const browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
let page,sessionID,token;
try{
 const context=await browser.newContext({permissions:['microphone'],viewport:{width:1440,height:1100}});page=await context.newPage();let pageErrors=0;page.on('pageerror',()=>pageErrors++);
 await page.addInitScript(()=>{navigator.mediaDevices.getDisplayMedia=async()=>{const canvas=document.createElement('canvas');canvas.width=800;canvas.height=450;const c=canvas.getContext('2d');c.fillStyle='#eee';c.fillRect(0,0,800,450);c.fillStyle='#123';c.font='22px sans-serif';c.fillText('Synthetic live voice integration fixture',20,40);return canvas.captureStream(2);};});
 await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'Start sandbox session →',exact:true}).click();await expect(page.getByRole('button',{name:'Share screen',exact:true})).toBeVisible();
 ({sessionID,token}=await page.evaluate(()=>{const ref=JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0];return {sessionID:ref.id,token:ref.token};}));
 await page.getByRole('checkbox',{name:'Synthetic simulation — mute microphone and send typed test replies',exact:true}).check();
 await page.getByRole('button',{name:'Share screen',exact:true}).click();await page.getByRole('button',{name:'Screen moment',exact:false}).first().waitFor({timeout:15000});
 await page.getByRole('button',{name:'Connect ElevenLabs voice',exact:true}).click();await expect(page.getByRole('button',{name:'Voice connected',exact:true})).toBeVisible({timeout:35000});
 await page.getByRole('textbox',{name:'Synthetic reply',exact:true}).fill('This is a synthetic test. Jonas must do the presentation because the client explicitly requested Jonas only. Please acknowledge that requirement in one short sentence.');
 await page.getByRole('button',{name:'Send synthetic reply to ElevenLabs',exact:true}).click();
 await expect.poll(()=>page.locator('.transcript p').filter({has:page.locator('b').filter({hasText:/^ai$/})}).allTextContents().then(lines=>lines.join(' ')),{timeout:35000}).toMatch(/Jonas/);
 await page.getByRole('button',{name:'◼ Off the record',exact:true}).click();await expect(page.getByRole('status')).toContainText('Off the record');
 ({sessionID,token}=await page.evaluate(()=>{const ref=JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0];return {sessionID:ref.id,token:ref.token};}));
 // Seed an explicitly synthetic confirmed map, isolated from a human expert claim.
 await page.evaluate(async()=>{const ref=JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0];const call=async(suffix,body)=>{const r=await fetch(`/api/sessions/${ref.id}${suffix}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${ref.token}`},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw Error('Synthetic fixture preparation failed');return r.json();};let s=await call('');const frame=s.evidence.find(e=>e.kind==='frame').id;for(let i=0;i<6;i++)s=await call('/answers',{id:crypto.randomUUID(),stage:i<3?'capture':'debrief',question:`Synthetic live voice fixture question ${i}`,answer:'[Synthetic test narration] Client only restrictions bind the assignee. Never double-book the complete plan.',evidenceIds:[frame],ruleKinds:['customer_only','no_overlap'],guardrail:i===2});s=await call('/compile',{});await call('/confirm',{version:s.map.version});});
 await page.reload();await expect(page.getByRole('heading',{name:'Your skill library',exact:true})).toBeVisible();await page.getByRole('button',{name:'03 Teach',exact:true}).click();
 await page.getByLabel('Atlas Data Correction decision',{exact:true}).selectOption('Escalate');
 await page.getByRole('button',{name:/Atlas Data Correction/}).click();
 const atlasDetails=page.getByRole('complementary',{name:'Atlas Data Correction details',exact:true});
 await atlasDetails.getByLabel('Follow-up owner',{exact:true}).fill('Jonas');await atlasDetails.getByLabel('Atlas Data Correction follow-up checkpoint',{exact:true}).fill('2026-10-08T11:00');
 await page.getByRole('button',{name:'Close task details',exact:true}).click();
 await page.getByLabel('Finalize Client Presentation assignee',{exact:true}).selectOption('Lea');
 await page.getByRole('button',{name:'Check with the learned rules',exact:true}).click();await expect(page.getByRole('heading',{name:'Pause before saving',exact:true})).toBeVisible();
 await page.getByRole('checkbox',{name:'Synthetic simulation — mute microphone and send typed test replies',exact:true}).check();await page.getByRole('button',{name:'Share learner screen',exact:true}).click();
 await page.getByRole('button',{name:'Connect voice tutor',exact:true}).click();
 await expect(page.getByRole('button',{name:'Send synthetic reply to ElevenLabs',exact:true})).toBeDisabled(); // Empty replies remain disabled.
 await page.getByRole('textbox',{name:'Synthetic reply',exact:true}).fill('Synthetic learner test: explain the currently blocked assignment using the validation context already supplied. Which person is required?');
 await expect(page.getByRole('button',{name:'Send synthetic reply to ElevenLabs',exact:true})).toBeEnabled({timeout:35000});await page.getByRole('button',{name:'Send synthetic reply to ElevenLabs',exact:true}).click();
 await expect.poll(()=>page.locator('.transcript p').filter({has:page.locator('b').filter({hasText:/^ai$/})}).allTextContents().then(lines=>lines.join(' ')),{timeout:35000}).toMatch(/Jonas/);
 await expect(page.getByRole('button',{name:'I approve · save sandbox plan',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'◼ Off the record',exact:true}).click();await expect(page.getByRole('status')).toContainText('Off the record');
 await page.getByLabel('Finalize Client Presentation assignee',{exact:true}).selectOption('Jonas');
 await page.getByRole('button',{name:'Check with the learned rules',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Proposal passed the confirmed rules',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'I approve · save sandbox plan',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Sandbox proposal saved. No Notion workspace was changed.');
 await page.getByRole('button',{name:'04 Skill library',exact:true}).click();
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download reviewed SKILL.md ↓',exact:true}).click();
 const download=await downloadPromise;assert.equal(await download.failure(),null,'Reviewed skill export failed');
 assert.match(download.suggestedFilename(),/SKILL\.md$/);assert.equal(pageErrors,0,'Unexpected browser error during live voice test');
 console.log('PASS real ElevenLabs expert+tutor WebSocket sessions, labeled synthetic typed messages, grounded tutor reply after pre-existing blocked check, disabled save, off-record, corrected sandbox save and reviewed skill download. Screen/microphone are synthetic; map answers are explicitly synthetic fixtures. No speech-recognition or real expert-learning claim.');
}finally{
 if(page&&!page.isClosed())await page.getByRole('button',{name:'◼ Off the record',exact:true}).click({timeout:3000}).catch(()=>{});
 await browser.close();
 if(sessionID&&token)await fetch(`http://127.0.0.1:8787/api/sessions/${sessionID}/delete`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({confirmed:true})}).catch(()=>{});
}
