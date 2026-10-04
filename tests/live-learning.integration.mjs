// Authorized opt-in: real OpenAI compilation, all six synthetic answers entered through UI.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
if(process.env.RUN_LIVE_LEARNING!=='1'){console.log('SKIP: RUN_LIVE_LEARNING=1 required');process.exit(0);}
const browser=await chromium.launch({headless:true});let ref,page;const metrics=[];
try{
 page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{navigator.mediaDevices.getDisplayMedia=async()=>{const c=document.createElement('canvas');c.width=1200;c.height=800;window.__testCanvas=c;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.fillStyle='#123';x.font='24px sans-serif';x.fillText('Synthetic capture fixture; actual planner image follows',20,40);const stream=c.captureStream(0);window.__testTrack=stream.getVideoTracks()[0];setInterval(()=>window.__testTrack.requestFrame(),500);return stream;};});
 await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'Start sandbox session →',exact:true}).click();
 await page.getByText('Recording settings',{exact:true}).waitFor();ref=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0]);
 await page.getByText('Recording settings',{exact:true}).click();await page.getByRole('button',{name:'Share screen',exact:true}).click();
 await page.getByRole('button',{name:'Screen moment',exact:false}).first().waitFor({timeout:15000});
 const initialFrame=await page.evaluate(async()=>{const r=JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0];const s=await (await fetch(`/api/sessions/${r.id}`,{headers:{Authorization:`Bearer ${r.token}`}})).json();return s.evidence.find(e=>e.kind==='frame').image;});
 const image=(await page.locator('.np-page').screenshot()).toString('base64');
 await page.evaluate(async b=>{const img=new Image();img.src='data:image/png;base64,'+b;await img.decode();const c=window.__testCanvas;c.getContext('2d').drawImage(img,0,0,c.width,c.height);window.__testTrack.requestFrame();},image);
 try{await expect.poll(()=>page.evaluate(async initial=>{const r=JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0];const s=await (await fetch(`/api/sessions/${r.id}`,{headers:{Authorization:`Bearer ${r.token}`}})).json();return s.evidence.some(e=>e.kind==='frame'&&e.image!==initial);},initialFrame),{timeout:15000}).toBe(true);}catch(e){console.log('Frame diagnostic',await page.evaluate(async()=>{const r=JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0];const s=await (await fetch(`/api/sessions/${r.id}`,{headers:{Authorization:`Bearer ${r.token}`}})).json();return {recording:s.recording,frames:s.evidence.filter(e=>e.kind==='frame').length,alerts:[...document.querySelectorAll('[role="alert"]')].map(e=>e.textContent)};}));throw e;}
 const rows=[
  ['Why is Jonas required?','[Synthetic test narration] The customer explicitly said Jonas only. An only restriction is binding.','Honor customer preference'],
  ['Why leave review time?','[Synthetic test narration] Anything external needs an independent reviewer other than the author, and review must finish before the deadline.','Leave review time'],
  ['When do you stop?','[Synthetic test narration] I never double-book a person. Move displaced work to another valid slot; if impossible, escalate instead of dropping review.','No overlapping work'],
  ['How do you handle blocked tasks?','[Synthetic test narration] Blocked work gets no production slot. It gets an owner and a checkpoint to chase the dependency.','Own the follow-up'],
  ['How do you move focus work?','[Synthetic test narration] Focus tasks stay in one complete block. Move the whole block into another available window.','Protect focus blocks'],
  ['How do you use availability?','[Synthetic test narration] I only schedule work inside the assigned person’s available window. Deadlines never justify outside hours.','Respect availability'],
 ];
 for(let i=0;i<rows.length;i++){
  if(i===3)await page.getByRole('button',{name:'Finish capture → debrief',exact:true}).click();
  await page.getByRole('textbox',{name:i<3?'Screen-specific question':'New debrief question',exact:true}).fill(rows[i][0]);
  await page.getByRole('textbox',{name:'Expert’s own answer',exact:true}).fill(rows[i][1]);
  if(!await page.getByRole('checkbox',{name:rows[i][2],exact:true}).isVisible())await page.getByText('Confirm what this answer teaches',{exact:true}).filter({visible:true}).click();
  await page.getByRole('checkbox',{name:rows[i][2],exact:true}).check();
  if(i===2)await page.getByRole('checkbox',{name:'This answer establishes a stop, limit or escalation guardrail'}).check();
  await page.getByRole('button',{name:'Save evidenced answer',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Expert’s own answer',exact:true})).toHaveValue('');
 }
 const start=performance.now();await page.getByRole('button',{name:'Rebuild draft from all answers',exact:true}).click();
 await page.getByRole('button',{name:'I confirm this is how I work',exact:true}).waitFor({timeout:35000});metrics.push({operation:'six_answer_UI_compile',latencyMs:Math.round(performance.now()-start)});
 const compiled=await page.evaluate(async()=>{const r=JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0];return (await fetch(`/api/sessions/${r.id}`,{headers:{Authorization:`Bearer ${r.token}`}})).json();});
 assert.equal(compiled.answers.length,6);assert.equal(compiled.answers.filter(a=>a.stage==='capture').length,3);assert.equal(compiled.answers.filter(a=>a.stage==='debrief').length,3);assert(compiled.answers.some(a=>a.guardrail));assert.equal(compiled.map.status,'draft');
 for(const kind of ['customer_only','review_buffer','no_overlap','blocked_followup','focus_block','availability'])assert(compiled.map.rules.some(r=>r.kind===kind),`Missing learned ${kind}`);
 for(const rule of compiled.map.rules)assert(compiled.answers.some(a=>a.answer===rule.expertQuote&&a.ruleKinds.includes(rule.kind)&&a.evidenceIds.every(id=>rule.evidenceIds.includes(id))),`Unproven ${rule.kind}`);
 await page.getByRole('button',{name:'I confirm this is how I work',exact:true}).click();await page.getByRole('button',{name:'Open unseen learner case →',exact:true}).click();
 await page.getByLabel('Atlas Data Correction decision',{exact:true}).selectOption('Schedule');await page.getByLabel('Atlas Data Correction assignee',{exact:true}).selectOption('Lea');
 await page.getByLabel('Atlas Data Correction start',{exact:true}).fill('2026-10-08T09:00');await page.getByLabel('Atlas Data Correction end',{exact:true}).fill('2026-10-08T11:00');
 const checkStart=performance.now();await page.getByRole('button',{name:'Check with the learned rules',exact:true}).click();await expect(page.getByRole('heading',{name:'Pause before saving',exact:true})).toBeVisible();metrics.push({operation:'controlled_overlap_check',latencyMs:Math.round(performance.now()-checkStart)});
 await expect(page.getByRole('button',{name:'I approve · save sandbox plan',exact:true})).toBeDisabled();
 const blocked=await page.evaluate(async()=>{const r=JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0];return (await fetch(`/api/sessions/${r.id}`,{headers:{Authorization:`Bearer ${r.token}`}})).json();});
 const overlap=blocked.validation.findings.find(f=>blocked.map.rules.some(r=>r.id===f.ruleId&&r.kind==='no_overlap'));
 assert(overlap&&overlap.taskIds.length===2,'Must block on the actual learned two-task overlap');
 await page.getByLabel('Analyze Cohort Data start',{exact:true}).fill('2026-10-09T08:00');await page.getByLabel('Analyze Cohort Data end',{exact:true}).fill('2026-10-09T12:00');
 await page.getByRole('button',{name:'Focus planner',exact:true}).click();await page.getByText('Review plan',{exact:true}).click();await page.getByRole('button',{name:'Check with the learned rules',exact:true}).click();
 await expect(page.getByRole('region',{name:'Session controls',exact:true}).getByText('Plan checked · ready to save',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'I approve · save sandbox plan',exact:true}).click();await expect(page.getByRole('region',{name:'Session controls',exact:true}).getByText('Plan saved',{exact:true})).toBeVisible();
 await page.screenshot({path:'/private/tmp/decision-echo-live-learning-saved.png'});await page.getByRole('button',{name:'Exit full view',exact:true}).click();
 await page.getByRole('button',{name:'04 Skill library',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download reviewed SKILL.md ↓',exact:true}).click();const downloaded=await pending;assert.equal(await downloaded.failure(),null);const skill=await readFile(await downloaded.path(),'utf8');assert(!skill.includes(ref.token));for(const r of compiled.map.rules)assert(skill.includes(r.expertQuote));assert.deepEqual(errors,[]);
 await writeFile('docs/reviews/live-learning-measurements-2026-10-04.json',JSON.stringify({status:'passed',metrics,scope:'Synthetic answers through real UI; real OpenAI compile; controlled Atlas overlap/correction/save; test-owned canvas transport'},null,2)+'\n');console.log('PASS live UI learning and Atlas case',JSON.stringify(metrics));
}finally{await browser.close();if(ref)await fetch(`http://127.0.0.1:8787/api/sessions/${ref.id}/delete`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${ref.token}`},body:JSON.stringify({confirmed:true})}).catch(()=>{});}
