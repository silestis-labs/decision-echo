import {describe,expect,it} from 'vitest';
import {sandboxAvailability,sandboxTasks,validatePlan} from './planning';
import type {Rule,Task,WorkMap} from '../shared/contracts';

const map=(kind:Rule['kind']='no_overlap'):WorkMap=>({id:'source-check',version:1,status:'confirmed',teachBack:'Confirmed expert reasoning',rules:[{id:`learned-${kind}`,kind,title:kind,explanation:'Expert explanation',expertQuote:'Exact expert evidence',evidenceIds:['frame','answer'],parameters:{}}]});
const check=(task:Task,selected=map())=>validatePlan([task],sandboxAvailability(),selected);

describe('explicit source constraints without matching learned operators',()=>{
  it.each([
    ['required assignee',(t:Task)=>{t.assignee='Lea';},'required assignment'],
    ['availability',(t:Task)=>{t.start='2026-10-07T17:00:00+02:00';t.end='2026-10-07T20:00:00+02:00';},'supplied availability'],
    ['blocked dependency',(t:Task)=>{t.dependencyStatus='Blocked';},'dependency'],
    ['future dependency',(t:Task)=>{t.dependencyAvailableAt='2026-10-07T15:00:00+02:00';},'dependency'],
  ])('blocks %s without presenting it as learned evidence',(_name,change,fragment)=>{
    const task=sandboxTasks()[1];change(task);
    const result=check(task);
    expect(result.allowed).toBe(false);
    const finding=result.findings.find(f=>f.message.includes(fragment));
    expect(finding).toMatchObject({ruleId:'system',expertQuote:'',evidenceIds:[]});
    expect(finding?.message).toMatch(/^Source constraint:/);
  });

  it('retains hard deadlines and effort when the expert has not taught feasibility checks',()=>{
    const task=sandboxTasks()[1];task.end='2026-10-08T13:00:00+02:00';
    expect(check(task).findings.some(f=>f.ruleId==='system'&&f.message.includes('deadline'))).toBe(true);
    task.end='2026-10-07T15:00:00+02:00';
    expect(check(task).findings.some(f=>f.ruleId==='system'&&f.message.includes('estimated effort'))).toBe(true);
  });

  it('uses Europe/Berlin for a Morning only start, allowing the reference 09–13 slot',()=>{
    const task=sandboxTasks()[0];
    expect(check(task).allowed).toBe(true);
    task.start='2026-10-08T10:00:00Z'; // 12:00 in Berlin, regardless of browser/process timezone.
    task.end='2026-10-08T14:00:00Z';
    expect(check(task).findings.some(f=>f.message.includes('Morning only'))).toBe(true);
    task.start='2026-10-08T07:00:00Z';task.end='2026-10-08T11:00:00Z';
    expect(check(task).allowed).toBe(true);
  });

  it('retains the matching expert explanation without a duplicate source finding',()=>{
    const task=sandboxTasks()[1];task.assignee='Lea';
    const result=check(task,map('customer_only'));
    const matching=result.findings.filter(f=>f.message.includes('required assignment'));
    expect(matching).toHaveLength(1);
    expect(matching[0]).toMatchObject({ruleId:'learned-customer_only',expertQuote:'Exact expert evidence',evidenceIds:['frame','answer']});
  });

  it('does not turn a soft preference or unknown time-window text into a new policy',()=>{
    const task=sandboxTasks()[0];task.customerPreference='Prefers Jonas';task.timeWindow='Ask the expert';
    expect(check(task).allowed).toBe(true);
  });

  it('keeps learned judgments separate: overlap remains an evidenced operator',()=>{
    const tasks=sandboxTasks();
    Object.assign(tasks[3],{assignee:'Lea',decision:'Schedule',start:'2026-10-08T09:00:00+02:00',end:'2026-10-08T11:00:00+02:00'});
    const absent=validatePlan(tasks,sandboxAvailability(),map('customer_only'));
    expect(absent.findings.some(f=>f.message.includes('double-booked'))).toBe(false);
    expect(validatePlan(tasks,sandboxAvailability(),map()).findings.some(f=>f.ruleId==='learned-no_overlap'&&f.message.includes('double-booked'))).toBe(true);
  });
});
