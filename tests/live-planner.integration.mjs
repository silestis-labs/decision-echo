// Opt-in paid-provider regression. Actual rendered planner pixels, fictional task data,
// synthetic typed speech and a fake microphone. This is not OS capture or ASR verification.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
if(process.env.RUN_LIVE_PLANNER!=='1'){console.log('SKIP live planner: set RUN_LIVE_PLANNER=1 after authorizing provider usage.');process.exit(0);}
const uiOrigin=process.env.TEST_UI_ORIGIN||'http://127.0.0.1:5173';
const apiOrigin=process.env.TEST_API_ORIGIN||'http://127.0.0.1:8787';
const output='docs/reviews/live-planner-measurements-2026-10-04.json';
const metrics={checkedAt:new Date().toISOString(),status:'running',model:null,measurements:{},checks:{},limitations:['Browser display-media uses a static synthetic canvas; actual planner pixels are supplied by a direct Playwright element screenshot to the real observe endpoint.','Automatic browser observe calls for the permission-fixture canvas are locally stubbed to avoid billing and false screen-understanding claims.','Voice uses labeled synthetic typed narration and a fake muted microphone; no speech recognition or OS permissions are verified.','This tests a synthetic planning edit and provider context transfer; no Notion writes, human expert rule learning or universal save interception.']};
try{const previous=JSON.parse(await readFile(output,'utf8'));const {priorAttempts,...attempt}=previous;metrics.priorAttempts=[...(priorAttempts||[]),attempt].slice(-10);}catch{/* First run has no measurement history. */}
function safeSyntheticQuote(text){return typeof text==='string'&&!/https?:\/\/|Bearer\s|sk-[a-z0-9]|agent_[a-z0-9]/i.test(text)?text.slice(0,1600):null;}
let browser,page,id='',token='',stage='startup';
const started=performance.now();
async function api(suffix,body){const response=await fetch(`${apiOrigin}/api/sessions/${id}${suffix}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(35000)});if(!response.ok){const error=new Error('Authenticated test operation failed');error.name=`HTTP_${response.status}`;throw error;}return response.json();}
async function agentLines(){return page.locator('.transcript p').filter({has:page.locator('b').filter({hasText:/^ai$/})}).allTextContents();}
try{
 browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({permissions:['microphone'],viewport:{width:1600,height:1200},timezoneId:'Europe/Berlin'});page=await context.newPage();let pageErrors=0;page.on('pageerror',()=>{pageErrors++;});
 await page.addInitScript(()=>{navigator.mediaDevices.getDisplayMedia=async()=>{const canvas=document.createElement('canvas');canvas.width=800;canvas.height=450;const c=canvas.getContext('2d');c.fillStyle='#eee';c.fillRect(0,0,800,450);c.fillStyle='#123';c.font='20px sans-serif';c.fillText('Synthetic permission stream, actual planner screenshot tested separately',15,50);return canvas.captureStream(2);};});
 await page.route('**/api/sessions/*/observe',route=>route.fulfill({json:{question:'',ruleKinds:[],guardrail:false}}));
 await page.goto(uiOrigin);
 const config=await (await page.request.get(`${apiOrigin}/api/config`)).json();assert(config.openAI&&config.elevenLabs,'Both providers must be configured');metrics.model=config.observationModel||config.model;metrics.observationReasoning=config.observationReasoning;metrics.observationImageDetail=config.observationImageDetail;metrics.compileAndCoachModel=config.model;
 stage='session_create';await page.getByRole('button',{name:'Start sandbox session →',exact:true}).click();await expect(page.getByRole('heading',{name:'Weekly planning',exact:true})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1')||'[]').length),{timeout:10000}).toBeGreaterThan(0);
 ({id,token}=await page.evaluate(()=>{const ref=JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0];return {id:ref.id,token:ref.token};}));
 await page.getByText('Demo testing tools',{exact:true}).click().catch(async()=>{await page.getByText('Demo testing tools',{exact:false}).click();});
 await page.getByRole('checkbox',{name:'Synthetic simulation — mute microphone and send typed test replies',exact:true}).check();
 stage='voice_connect';const voiceStart=performance.now();await page.getByRole('button',{name:'Start session',exact:true}).click();
 await expect(page.locator('.session-controls__status')).toContainText('Voice ready',{timeout:35000});metrics.measurements.voiceConnectMs=Math.round(performance.now()-voiceStart);
 stage='planner_edit';await expect(page.getByLabel('Finalize Client Presentation assignee',{exact:true})).toHaveValue('Jonas');
 const editStart=performance.now();await page.getByLabel('Finalize Client Presentation assignee',{exact:true}).selectOption('Lea');
 await expect.poll(async()=>{const s=await api('');return s.evidence.some(e=>e.kind==='activity'&&e.text.includes('Finalize Client Presentation')&&e.text.includes('Jonas')&&e.text.includes('Lea'));},{timeout:10000}).toBe(true);
 metrics.measurements.editToActivityEvidenceMs=Math.round(performance.now()-editStart);metrics.checks.realUiAssigneeChangedToLea=true;metrics.checks.activityEvidenceRecordsJonasToLea=true;
 const current=await api('');assert.equal(current.tasks.find(t=>t.id==='presentation').assignee,'Jonas','Capture planner edits must remain a local draft');metrics.checks.editDidNotAutosaveServerPlan=true;
 stage='planner_pixels';await page.locator('.np-page').scrollIntoViewIfNeeded();const pixels=await page.locator('.np-page').screenshot({type:'jpeg',quality:75});assert(pixels.length<390000,'Screenshot exceeds evidence image budget');metrics.measurements.renderedPlannerJpegBytes=pixels.length;
 const image='data:image/jpeg;base64,'+pixels.toString('base64');const captured=await api('/evidence',{epoch:current.epoch,kind:'frame',text:'Actual rendered synthetic planner screenshot after Jonas to Lea edit',image});
 stage='real_vision_observe';const observeStart=performance.now();const observation=await api('/observe',{epoch:captured.epoch,image});metrics.measurements.realObserveMs=Math.round(performance.now()-observeStart);
 metrics.syntheticEvidence={observationQuestion:safeSyntheticQuote(observation.question),agentReply:null};
 metrics.checks.observeReturnedQuestion=typeof observation.question==='string'&&observation.question.trim().length>0;
 metrics.checks.observeMentionsVisibleLeaOrJonas=/\b(Lea|Jonas)\b/i.test(observation.question||'');metrics.checks.observeReturnedCustomerOnlyOperator=observation.ruleKinds?.includes('customer_only')??false;
 stage='real_voice_context_probe';const before=(await agentLines()).length;const replyStart=performance.now();
 await page.getByRole('textbox',{name:'Synthetic reply',exact:true}).fill('Synthetic integration probe. From the latest structured planning_workspace screen_event, name the task I just edited and its new person. Do not guess or repeat the original plan. If you did not receive the event, say you cannot tell.');
 await page.getByRole('button',{name:'Send synthetic reply to ElevenLabs',exact:true}).click();
 await expect.poll(async()=>{const fresh=(await agentLines()).slice(before).join(' ');return /\bLea\b/i.test(fresh)&&/presentation/i.test(fresh);},{timeout:35000}).toBe(true);
 metrics.measurements.voiceProbeToGroundedReplyMs=Math.round(performance.now()-replyStart);metrics.syntheticEvidence.agentReply=safeSyntheticQuote((await agentLines()).slice(before).join(' '));metrics.checks.voiceIdentifiesEditedPresentationAndLeaWithoutNamesInProbe=true;
 metrics.checks.noBrowserRuntimeErrors=pageErrors===0;assert.equal(pageErrors,0,'Browser runtime error');assert(metrics.checks.observeReturnedQuestion,'No question returned for the actual planner image');assert(metrics.checks.observeMentionsVisibleLeaOrJonas,'Vision follow-up did not identify the visible assignee names');metrics.status='passed';
}catch(error){metrics.status='failed';metrics.failure={stage,category:error?.name||'Error'};process.exitCode=1;}
finally{
 if(page&&!page.isClosed()){await page.getByRole('button',{name:'◼ Off the record',exact:true}).first().click({timeout:3000}).catch(()=>{});await expect(page.locator('.banner[role="status"]')).toContainText('Off the record',{timeout:5000}).catch(()=>{});}
 if(id&&token){try{let s;for(let attempt=0;attempt<4;attempt++){s=await api('');if(!s.recording)break;try{s=await api('/recording',{recording:false,epoch:s.epoch});break;}catch(error){if(error.name!=='HTTP_409')throw error;}}s=await api('');assert.equal(s.recording,false,'Stop recording before deleting the synthetic test session');await api('/delete',{confirmed:true});metrics.checks.syntheticSessionDeleted=true;}catch{metrics.checks.syntheticSessionDeleted=false;metrics.cleanupStatus='needs_reconciliation';process.exitCode=1;}}
 await browser?.close();metrics.measurements.totalMs=Math.round(performance.now()-started);await writeFile(output,JSON.stringify(metrics,null,2)+'\n');
 console.log(JSON.stringify({status:metrics.status,stage:metrics.failure?.stage??'complete',measurements:metrics.measurements,checks:metrics.checks}));
}
