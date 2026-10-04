import { describe, expect, it } from 'vitest';
import { describeTaskChanges } from './planner-events';
import { sandboxTasks } from '../domain/planning';

describe('planner edit events', () => {
  it('describes changed editable fields with old and new values', () => {
    const before = sandboxTasks();
    const after = before.map(t => t.id === 'presentation' ? { ...t, assignee: 'Lea' as const } : t);
    expect(describeTaskChanges(before, after)).toEqual(['Edited Finalize Client Presentation: person Jonas → Lea']);
  });
  it('formats dates in Europe/Berlin and ignores equal instants in another offset', () => {
    const before = sandboxTasks();
    const cohort = before.find(t => t.id === 'cohort')!;
    const sameInstant = new Date(Date.parse(cohort.start!)).toISOString();
    expect(describeTaskChanges(before, before.map(t => t.id === 'cohort' ? { ...t, start: sameInstant } : t))).toEqual([]);
    const moved = describeTaskChanges(before, before.map(t => t.id === 'cohort' ? { ...t, start: '2026-10-09T08:00:00+02:00' } : t));
    expect(moved).toHaveLength(1);
    expect(moved[0]).toMatch(/^Edited Analyze Cohort Data: start .+ → Fri 9 Oct, 08:00$/);
  });
  it('reports nothing for unchanged plans or unknown tasks', () => {
    const before = sandboxTasks();
    expect(describeTaskChanges(before, before)).toEqual([]);
    expect(describeTaskChanges([], before)).toEqual([]);
  });
});
