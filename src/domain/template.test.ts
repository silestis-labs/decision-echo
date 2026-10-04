import {describe,it,expect} from 'vitest';
import {createSandboxSession,sandboxAvailability,sandboxTasks,upgradeSandboxTemplate} from './planning';
import {TaskSchema} from '../shared/contracts';

describe('Notion template data and legacy sessions',()=>{
 it('keeps visible morning capacity without preloading a hotline rule',()=>{
  expect(sandboxAvailability().filter(a=>a.person==='Jonas').map(a=>[a.start,a.end])).toEqual([
   ['2026-10-07T09:00:00+02:00','2026-10-07T12:00:00+02:00'],
   ['2026-10-07T13:00:00+02:00','2026-10-07T17:00:00+02:00'],
   ['2026-10-08T08:00:00+02:00','2026-10-08T12:00:00+02:00'],
   ['2026-10-08T13:00:00+02:00','2026-10-08T17:00:00+02:00'],
   ['2026-10-09T08:00:00+02:00','2026-10-09T12:00:00+02:00'],
  ]);
  expect(sandboxTasks().find(t=>t.id==='presentation')).toMatchObject({customer:'Northstar',reviewStatus:'Planned',trainingStage:'Training 2'});
 });
 it('adds defaults to old task shapes without fabricating review approval',()=>{
  const task:Record<string,unknown>={...sandboxTasks()[1]};for(const key of ['customer','description','dependency','trainingStage','timeWindow','planningWeek','reviewStatus'])delete task[key];
  expect(TaskSchema.parse(task)).toMatchObject({customer:'',reviewStatus:'Not set'});
 });
 it('upgrades untouched old fixtures but preserves recorded or committed capacity',()=>{
  const s=createSandboxSession('old','sandbox');delete s.templateVersion;s.availability=s.availability.filter(a=>a.person!=='Jonas'||new Date(a.start).getUTCHours()===11||new Date(a.start).getUTCDate()===9);
  const old=structuredClone(s.availability);
  expect(upgradeSandboxTemplate(s).availability).toEqual(sandboxAvailability());
  expect(s.availability).toEqual(old);
  expect(upgradeSandboxTemplate({...s,recording:true}).availability).toEqual(old);
  expect(upgradeSandboxTemplate({...s,evidence:[{id:'frame',sessionId:s.id,epoch:0,at:'2026-10-04T00:00:00Z',kind:'frame',text:'Recorded frame'}]}).availability).toEqual(old);
  expect(upgradeSandboxTemplate({...s,commitStatus:'complete'}).availability).toEqual(old);
  expect(upgradeSandboxTemplate({...s,answers:[{id:'answer',stage:'capture',question:'Why?',answer:'An actual recorded answer',evidenceIds:['frame'],ruleKinds:[],guardrail:false}]}).availability).toEqual(old);
 });
});
