// Paid, opt-in pilot. Same actual synthetic planner pixels and prompt, interleaved providers.
import {chromium,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {vertexRequest,parseVars} from './helpers/vertex-benchmark.mjs';
if(process.env.RUN_GEMINI_BENCHMARK!=='1'){console.log('SKIP: set RUN_GEMINI_BENCHMARK=1 for authorized paid comparison.');process.exit(0);}
const vars=parseVars(await readFile('.dev.vars','utf8').catch(error=>{if(error.code==='ENOENT')return '';throw error;}));
for(const name of ['OPENAI_API_KEY','VERTEX_AUTH_MODE','GOOGLE_CLOUD_API_KEY','GOOGLE_CLOUD_ACCESS_TOKEN','GOOGLE_CLOUD_PROJECT','GOOGLE_CLOUD_LOCATION','VERTEX_MODEL'])if(process.env[name])vars[name]=process.env[name];
try {vertexRequest(vars,'preflight','data:image/jpeg;base64,YQ==');if(!vars.OPENAI_API_KEY)throw new Error('Missing OPENAI_API_KEY');}
catch(error){console.log(`NOT RUN: ${error.message}. No provider requests made; Application routing unchanged.`);process.exit(2);}
const source=await readFile('src/server/providers.ts','utf8');
const instruction=source.match(/export const OBSERVATION_INSTRUCTION='([^']+)'/)?.[1];
if(!instruction)throw new Error('Production observation instruction not found');
const rounds=Number(process.env.BENCHMARK_ROUNDS||12);
if(!Number.isInteger(rounds)||rounds<2||rounds>20)throw new Error('BENCHMARK_ROUNDS must be 2–20');
const schema=z.object({question:z.string().max(600),ruleKinds:z.array(z.enum(['no_overlap','availability','customer_only','skill_match','dependency_ready','focus_block','review_buffer','blocked_followup'])),guardrail:z.boolean()}).strict();
const report={checkedAt:new Date().toISOString(),status:'running',method:'Identical JPEG and production prompt, alternating provider order. Luna low/high versus Vertex Gemini minimal/default image processing. Complete JSON latency includes body transfer and parsing.',instructionSha256:createHash('sha256').update(instruction).digest('hex'),samples:[],fixtures:[],summaries:[],checks:{},limitations:['Pilot uses two task-assignment screenshot states; repeated samples are not diverse cases.','Automated grounding filters are incomplete; manual output review required before selecting a provider.','No microphone, screen permission picker, automatic app queue or speech-onset latency measured.','No production routing change is made by this benchmark.']};
let browser,id,token;
function loopbackOrigin(value){const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||!['127.0.0.1','localhost','[::1]'].includes(u.hostname)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('Benchmark origins must be loopback origins');return u.origin;}
const api=loopbackOrigin(process.env.TEST_API_ORIGIN||'http://127.0.0.1:8787');
const ui=loopbackOrigin(process.env.TEST_UI_ORIGIN||'http://127.0.0.1:5173');
async function sessionApi(path,body){const r=await fetch(`${api}/api/sessions/${id}${path}`,{method:body===undefined?'GET':'POST',redirect:'error',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`Session HTTP ${r.status}`);return r.json();}
try {
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1600,height:1200},timezoneId:'Europe/Berlin'});
 await page.goto(ui);await page.getByRole('button',{name:'Start sandbox session →',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Weekly planning',exact:true})).toBeVisible();
 ({id,token}=await page.evaluate(()=>{const ref=JSON.parse(sessionStorage.getItem('decision-echo.sessions.v1'))[0];return {id:ref.id,token:ref.token};}));
 const fixtures=[];
 for(const assignee of ['Jonas','Lea']){
  await page.getByLabel('Finalize Client Presentation assignee',{exact:true}).selectOption(assignee);
  const image=await page.locator('.np-page').screenshot({type:'jpeg',quality:75});
  fixtures.push({image:'data:image/jpeg;base64,'+image.toString('base64'),text:await page.locator('.np-page').innerText()});
  report.fixtures.push({assignee,sha256:createHash('sha256').update(image).digest('hex'),jpegBytes:image.length});
 }
 let accessFailed=false;
 for(let round=0;round<rounds&&!accessFailed;round++)for(const provider of (Math.floor(round/2)%2?['gemini','luna']:['luna','gemini'])){
  const fixture=fixtures[round%2];const sample={provider,round:round+1,fixture:round%2,model:provider==='luna'?'gpt-6-luna':vars.VERTEX_MODEL||'gemini-3.5-flash-lite',status:'pending'};report.samples.push(sample);
  const start=performance.now();
  try {
   let url,headers,body;
   if(provider==='gemini')({url,headers,body}=vertexRequest(vars,instruction,fixture.image));
   else {url='https://api.openai.com/v1/responses';headers={Authorization:`Bearer ${vars.OPENAI_API_KEY}`,'Content-Type':'application/json'};body={model:'gpt-6-luna',reasoning:{effort:'low'},store:false,instructions:instruction,input:[{role:'user',content:[{type:'input_text',text:'Identify a grounded candidate question from this frame. Return the requested result as JSON.'},{type:'input_image',image_url:fixture.image,detail:'high'}]}],text:{format:{type:'json_object'}}};}
   const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(60000)});sample.httpStatus=r.status;
   if(!r.ok){sample.status='provider_error';sample.ms=Math.round(performance.now()-start);await r.body?.cancel();if([400,401,403,404].includes(r.status))accessFailed=true;continue;}
   const result=await r.json();sample.responseMs=Math.round(performance.now()-start);const text=provider==='gemini'?result.candidates?.[0]?.content?.parts?.filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join(''):result.output?.flatMap(o=>o.content||[]).filter(p=>p.type==='output_text').map(p=>p.text||'').join('');
   const value=schema.parse(JSON.parse(text||''));sample.ms=Math.round(performance.now()-start);
   const q=value.question;
   const safe=!/https?:\/\/|Bearer\s|sk-[a-z0-9]|agent_[a-z0-9]/i.test(q);
   sample.question=safe?q:null;sample.ruleKinds=value.ruleKinds;sample.guardrail=value.guardrail;
   sample.checks={strictSchema:true,singleQuestion:(q.match(/\?/g)||[]).length===1,nonempty:q.trim().length>0,safeSyntheticText:safe,noInventedKnownPerson:(q.match(/\b(?:Jonas|Lea|Mira|Atlas)\b/gi)||[]).every(n=>fixture.text.toLowerCase().includes(n.toLowerCase())),noUnsupportedSafetyClaim:!/(?:is|are)\s+(?:fully\s+)?(?:safe|feasible|available)|(?:no|without)\s+(?:conflicts|overlaps)/i.test(q)};
   sample.status=Object.values(sample.checks).every(Boolean)?'passed':'quality_check_failed';
  }catch(error){sample.status='error';sample.ms=Math.round(performance.now()-start);sample.errorCategory=error?.name||'Error';}
  console.log(JSON.stringify({provider,round:round+1,status:sample.status,ms:sample.ms,httpStatus:sample.httpStatus}));
 }
 for(const provider of ['luna','gemini']){
  const samples=report.samples.filter(s=>s.provider===provider);const times=samples.filter(s=>Number.isFinite(s.responseMs)).map(s=>s.responseMs).sort((a,b)=>a-b);
  report.summaries.push({provider,attempts:samples.length,passed:samples.filter(s=>s.status==='passed').length,completedResponses:times.length,medianMs:times.length?(times[Math.floor((times.length-1)/2)]+times[Math.floor(times.length/2)])/2:null,p95Ms:times.length>=20?times[Math.ceil(times.length*.95)-1]:null,rangeMs:times.length?[times[0],times.at(-1)]:null});
 }
 report.status=report.samples.length===rounds*2&&report.samples.every(s=>s.status==='passed')?'pilot_complete_manual_review_required':'pilot_incomplete_or_quality_failure';
 if(report.status!=='pilot_complete_manual_review_required')process.exitCode=1;
}catch(error){report.status='failed';report.errorCategory=error?.name||'Error';process.exitCode=1;}
finally {
 if(id&&token)try{const s=await sessionApi('');if(s.recording)await sessionApi('/recording',{recording:false,epoch:s.epoch});await sessionApi('/delete',{confirmed:true});report.checks.syntheticSessionDeleted=true;}catch{report.checks.syntheticSessionDeleted=false;process.exitCode=1;}
 try{await browser?.close();}catch{report.checks.browserClosed=false;process.exitCode=1;}
 await writeFile('docs/reviews/gemini-luna-benchmark.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,summaries:report.summaries,checks:report.checks}));
}
