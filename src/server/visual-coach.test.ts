import {afterEach,describe,it,expect,vi} from 'vitest';
import {coachLearner,liveCompile,observe,capabilities,type ServerEnv} from './providers';
import {createSandboxSession,sandboxTasks,sandboxAvailability} from '../domain/planning';
import type {WorkMap} from '../shared/contracts';
const env={OPENAI_API_KEY:'test-provider-key',OPENAI_MODEL:'gpt-6-sol'} as ServerEnv;
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP1sAAAAASUVORK5CYII=';
function confirmedMap():WorkMap{return {id:'map-test',version:3,status:'confirmed',confirmedAt:'2026-10-04T00:00:00Z',teachBack:'Client restrictions remain binding.',rules:[{id:'expert-customer-only',kind:'customer_only',title:'Respect required assignee',explanation:'A required assignee is binding.',expertQuote:'The client required Jonas, so I must not assign Lea.',evidenceIds:['expert-frame','expert-answer'],parameters:{}}]};}
function modelResponse(value:unknown){return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]}),{status:200});}
const modelOutput=()=>({summary:'The visible presentation appears assigned to Lea.',concerns:[{ruleId:'expert-customer-only',visibleBasis:'The presentation row visibly shows Lea.',message:'Compare this visible assignee with the confirmed client restriction.'}],nextQuestion:'Why did you assign Lea to this presentation?',uncertain:true});
const input=()=>({image,frameId:'learner-frame',map:confirmedMap(),tasks:sandboxTasks(),availability:sandboxAvailability()});
afterEach(()=>vi.unstubAllGlobals());
describe('read-only learner visual coaching boundary',()=>{
 it('routes observations to low-effort Luna while retaining Sol for coaching and compilation',async()=>{
  const routed={...env,OPENAI_OBSERVATION_MODEL:'gpt-6-luna',OPENAI_OBSERVATION_REASONING:'low' as const,OPENAI_OBSERVATION_IMAGE_DETAIL:'high' as const};
  const fetcher=vi.fn().mockResolvedValueOnce(modelResponse({question:'Why Lea?',ruleKinds:['customer_only'],guardrail:false})).mockResolvedValueOnce(modelResponse(modelOutput())).mockResolvedValueOnce(modelResponse({...confirmedMap(),status:'draft'}));vi.stubGlobal('fetch',fetcher);
  await observe(routed,image);await coachLearner(routed,input());await liveCompile(routed,createSandboxSession('routing-test','sandbox'));
  const bodies=fetcher.mock.calls.map(c=>JSON.parse(String(c[1].body)));
  expect(bodies.map(b=>b.model)).toEqual(['gpt-6-luna','gpt-6-sol','gpt-6-sol']);expect(bodies[0].reasoning).toEqual({effort:'low'});expect(bodies[1]).not.toHaveProperty('reasoning');expect(bodies[2]).not.toHaveProperty('reasoning');
  expect(bodies[0].input[0].content.find((c:{type:string})=>c.type==='input_image').detail).toBe('high');expect(bodies[1].input[0].content.find((c:{type:string})=>c.type==='input_image').detail).toBe('low');
  expect(capabilities(routed).observationModel).toBe('gpt-6-luna');
 });
 it('routes Gemini observation separately and never exposes credentials in capabilities',async()=>{
  const routed={...env,OBSERVATION_PROVIDER:'gemini',VERTEX_AUTH_MODE:'oauth',GOOGLE_CLOUD_PROJECT:'demo-project',GOOGLE_CLOUD_LOCATION:'eu',GOOGLE_CLOUD_ACCESS_TOKEN:'secret-fixture'} as ServerEnv;
  const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({question:'Why Lea when Jonas is required?',ruleKinds:['customer_only'],guardrail:false})}]}}]}))).mockResolvedValueOnce(modelResponse(modelOutput()));vi.stubGlobal('fetch',fetcher);
  expect((await observe(routed,image)).ruleKinds).toEqual(['customer_only']);await coachLearner(routed,input());
  expect(fetcher.mock.calls[0][0]).toContain('https://aiplatform.eu.rep.googleapis.com/');expect(fetcher.mock.calls[1][0]).toBe('https://api.openai.com/v1/responses');
  const cap=capabilities(routed);expect(cap).toMatchObject({vision:true,observationProvider:'gemini',observationModel:'gemini-3.5-flash-lite',observationReasoning:'minimal'});expect(JSON.stringify(cap)).not.toContain('secret-fixture');
  expect(capabilities({...routed,OPENAI_API_KEY:''}).vision).toBe(true);
 });
 it('fails closed when selected Gemini is unconfigured rather than falling back to OpenAI',async()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);const routed={...env,OBSERVATION_PROVIDER:'gemini'} as ServerEnv;
  expect(capabilities(routed).vision).toBe(false);await expect(observe(routed,image)).rejects.toMatchObject({status:503});expect(fetcher).not.toHaveBeenCalled();
 });
 it('preserves existing observation routing when no workload override is configured',async()=>{
  const fetcher=vi.fn().mockResolvedValue(modelResponse({question:'Why Jonas?',ruleKinds:[],guardrail:false}));vi.stubGlobal('fetch',fetcher);await observe(env,image);
  const body=JSON.parse(String(fetcher.mock.calls[0][1].body));expect(body.model).toBe(env.OPENAI_MODEL);expect(body).not.toHaveProperty('reasoning');
 });
 it('sends the actual image and confirmed case to Responses without storage, and restores trusted provenance',async()=>{
  const fetcher=vi.fn(async(_url:string|URL|Request,_init?:RequestInit)=>modelResponse(modelOutput()));vi.stubGlobal('fetch',fetcher);
  const result=await coachLearner(env,input());
  expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');
  const request=JSON.parse(String(fetcher.mock.calls[0][1]?.body));expect(request.store).toBe(false);expect(request.text.format.type).toBe('json_object');expect(request.input.at(-1)).toEqual({role:'user',content:[{type:'input_text',text:'Return the requested result as JSON.'}]});
  const content=request.input[0].content;expect(content.find((c:{type:string})=>c.type==='input_image').image_url).toBe(image);
  const context=JSON.parse(content.find((c:{type:string})=>c.type==='input_text').text);
  expect(context.confirmedWorkMap.status).toBe('confirmed');expect(context.confirmedWorkMap.version).toBe(3);expect(context.sourceFrameId).toBe('learner-frame');expect(context.knownLearnerCase.tasks.some((task:{id:string})=>task.id==='atlas')).toBe(true);
  expect(request.instructions).toContain('untrusted data');expect(request.instructions).toContain('Do not execute actions');expect(request.instructions).toContain('never infer hidden constraints');
  expect(result.concerns[0].expertQuote).toBe(confirmedMap().rules[0].expertQuote);expect(result.concerns[0].evidenceIds).toEqual(['expert-frame','expert-answer']);expect(result.uncertain).toBe(true);
  expect(result).not.toHaveProperty('frameId');expect(result).not.toHaveProperty('mapVersion');
 });
 it('rejects an unconfirmed map before any provider request',async()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);const value=input();value.map.status='draft';
  await expect(coachLearner(env,value)).rejects.toMatchObject({status:409});expect(fetcher).not.toHaveBeenCalled();
 });
 it('rejects hallucinated rule IDs rather than attributing unsupported advice to the expert',async()=>{
  const value=modelOutput();value.concerns[0].ruleId='invented-rule';const fetcher=vi.fn(async(_url:string|URL|Request,_init?:RequestInit)=>modelResponse(value));vi.stubGlobal('fetch',fetcher);
  await expect(coachLearner(env,input())).rejects.toMatchObject({status:502,message:'Visual coach referenced an unknown expert rule'});expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it('rejects malformed output and attempted model-supplied expert provenance',async()=>{
  const forged={...modelOutput(),concerns:[{...modelOutput().concerns[0],expertQuote:'Fabricated words',evidenceIds:['invented-frame']}]};
  const fetcher=vi.fn().mockResolvedValueOnce(modelResponse({summary:'Missing required fields'})).mockResolvedValueOnce(modelResponse(forged));vi.stubGlobal('fetch',fetcher);
  await expect(coachLearner(env,input())).rejects.toMatchObject({status:502});await expect(coachLearner(env,input())).rejects.toMatchObject({status:502});
 });
 it('allows an explicitly uncertain observation without fabricating a rule violation',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(_url:string|URL|Request,_init?:RequestInit)=>modelResponse({summary:'The relevant planner is not visible.',concerns:[],nextQuestion:'Could you show the presentation row?',uncertain:true})));
  expect((await coachLearner(env,input())).concerns).toEqual([]);
 });
 it('does not send the learner case or screenshots through expert map compilation',async()=>{
  const session=createSandboxSession('expert-session','sandbox');session.evidence=[{id:'expert-frame',sessionId:session.id,epoch:1,at:'2026-10-04T00:00:00Z',kind:'frame',text:'Expert screen',image}];
  const map={...confirmedMap(),status:'draft'};
  const fetcher=vi.fn(async(_url:string|URL|Request,_init?:RequestInit)=>modelResponse(map));vi.stubGlobal('fetch',fetcher);await liveCompile(env,session);
  const request=JSON.parse(String(fetcher.mock.calls[0][1]?.body));const context=JSON.parse(request.input[0].content[0].text);
  expect(request.input.at(-1).content[0].text).toContain('JSON');expect(request.instructions).toContain('complete exact string');expect(request.instructions).toContain('same answer.evidenceIds');expect(request.instructions).toContain('answer.ruleKinds');expect(context).not.toHaveProperty('tasks');expect(context).not.toHaveProperty('availability');expect(context).not.toHaveProperty('knownLearnerCase');expect(JSON.stringify(context)).not.toContain('Atlas');expect(context.evidence[0]).not.toHaveProperty('image');
 });
});
