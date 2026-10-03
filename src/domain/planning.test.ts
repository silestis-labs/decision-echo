import { describe,it,expect } from 'vitest';
import { compileMap,createSandboxSession,sandboxAvailability,sandboxTasks,validatePlan,exportSkill } from './planning';
import type { Rule,WorkMap } from '../shared/contracts';
const kinds:Rule['kind'][]=['no_overlap','availability','customer_only','skill_match','dependency_ready','focus_block','review_buffer','blocked_followup'];
const map = (buffer?:number):WorkMap=>({id:'test',version:1,status:'confirmed',teachBack:'Expert confirmed',rules:kinds.map(kind=>({id:kind,kind,title:kind,explanation:kind,evidenceIds:['e1'],expertQuote:`Expert evidence for ${kind}`,parameters:kind==='review_buffer'&&buffer!==undefined?{bufferMinutes:buffer}:{}}))});
describe('whole-plan expert policy',()=>{
  it('catches urgent work that leaves displaced work double-booked, then accepts a complete correction',()=>{
    const tasks=sandboxTasks();
    Object.assign(tasks[3],{assignee:'Lea',start:'2026-10-08T09:00:00+02:00',end:'2026-10-08T11:00:00+02:00',decision:'Schedule'});
    const result=validatePlan(tasks,sandboxAvailability(),map());
    expect(result.allowed).toBe(false);
    expect(result.findings.find(f=>f.ruleId==='no_overlap')?.taskIds).toEqual(['cohort','atlas']);
    Object.assign(tasks[0],{start:'2026-10-09T08:00:00+02:00',end:'2026-10-09T12:00:00+02:00'});
    expect(validatePlan(tasks,sandboxAvailability(),map()).allowed).toBe(true);
  });
  it('changes behavior when the expert changes the review buffer',()=>{
    const tasks=sandboxTasks();
    expect(validatePlan(tasks,sandboxAvailability(),map(60)).allowed).toBe(true);
    expect(validatePlan(tasks,sandboxAvailability(),map(180)).findings.some(f=>f.ruleId==='review_buffer')).toBe(true);
  });
  it('requires independent review, availability, and enough effort',()=>{
    const tasks=sandboxTasks();
    tasks[1].reviewOwner='None'; tasks[0].end='2026-10-08T10:00:00+02:00';
    const result=validatePlan(tasks,sandboxAvailability(),map());
    expect(result.findings.some(f=>f.ruleId==='review_buffer')).toBe(true);
    expect(result.findings.some(f=>f.ruleId==='system'&&f.taskIds.includes('cohort'))).toBe(true);
  });
  it('treats preferences as advisory and only restrictions as binding',()=>{
    const tasks=sandboxTasks();tasks[0].customerPreference='Prefers Jonas';
    expect(validatePlan(tasks,sandboxAvailability(),map()).allowed).toBe(true);
    tasks[0].customerPreference='Jonas only';
    expect(validatePlan(tasks,sandboxAvailability(),map()).findings.some(f=>f.ruleId==='customer_only')).toBe(true);
  });
  it('rejects blocked or unavailable dependencies and missing followup',()=>{
    const tasks=sandboxTasks();tasks[2].followUpOwner='';tasks[0].dependencyAvailableAt='2026-10-09T10:00:00+02:00';
    const result=validatePlan(tasks,sandboxAvailability(),map());
    expect(result.findings.some(f=>f.ruleId==='blocked_followup')).toBe(true);
    expect(result.findings.some(f=>f.ruleId==='dependency_ready')).toBe(true);
  });
  it('will not bind domain rules that were never learned',()=>{
    const tasks=sandboxTasks();tasks[0].customerPreference='Jonas only';
    const selected=map();selected.rules=selected.rules.filter(r=>r.kind!=='customer_only');
    expect(validatePlan(tasks,sandboxAvailability(),selected).findings.some(f=>f.ruleId==='customer_only')).toBe(false);
  });
  it('rejects unconfirmed maps and invalid intervals',()=>{
    const draft=map();draft.status='draft';const tasks=sandboxTasks();tasks[0].start='bad';
    const result=validatePlan(tasks,sandboxAvailability(),draft);
    expect(result.allowed).toBe(false);expect(result.findings.filter(f=>f.ruleId==='system').length).toBeGreaterThan(1);
    expect(()=>exportSkill(draft,[])).toThrow(/confirmed/);
  });
});
describe('evidence-backed compilation',()=>{
  it('requires capture/debrief and rejects manufactured evidence',()=>{
    const session=createSandboxSession('test','sandbox');
    expect(()=>compileMap(session)).toThrow(/three/);
    session.answers=Array.from({length:6},(_,i)=>({id:String(i),stage:i<3?'capture':'debrief',question:`Question ${i}`,answer:`Actual expert answer ${i}`,evidenceIds:['missing'],ruleKinds:['no_overlap'],guardrail:i===2}));
    expect(()=>compileMap(session)).toThrow(/valid evidence/);
    session.evidence=[{id:'missing',sessionId:'test',epoch:0,at:new Date().toISOString(),kind:'answer',text:'Expert answer evidence'}];
    const result=compileMap(session);expect(result.status).toBe('draft');expect(result.rules[0].expertQuote).toContain('Actual expert answer');
    session.answers[5].question=session.answers[0].question;
    expect(()=>compileMap(session)).toThrow(/distinct/);
  });
});
