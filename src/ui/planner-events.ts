import type { Task } from '../shared/contracts';

// Fields a planner user can change. Source facts (deadline, effort, customer, ...) are read-only in the planner.
const editable: { key: keyof Task; label: string; date?: boolean }[] = [
  { key: 'assignee', label: 'person' },
  { key: 'decision', label: 'decision' },
  { key: 'start', label: 'start', date: true },
  { key: 'end', label: 'end', date: true },
  { key: 'reviewOwner', label: 'review owner' },
  { key: 'reviewStart', label: 'review start', date: true },
  { key: 'reviewEnd', label: 'review end', date: true },
  { key: 'followUpOwner', label: 'follow-up owner' },
  { key: 'followUpCheckpoint', label: 'follow-up checkpoint', date: true },
];

const show = (value: unknown, date?: boolean) => {
  if (value === null || value === undefined || value === '') return 'empty';
  if (date && typeof value === 'string' && Number.isFinite(Date.parse(value))) return new Date(value).toLocaleString('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return String(value).slice(0, 120);
};

/** Structured screen events for planner edits, e.g. "Edited Finalize Client Presentation: person Jonas → Lea". */
export function describeTaskChanges(before: Task[], after: Task[]): string[] {
  const previous = new Map(before.map(t => [t.id, t]));
  const events: string[] = [];
  for (const task of after) {
    const old = previous.get(task.id);
    if (!old) continue;
    for (const field of editable) {
      const a = old[field.key], b = task[field.key];
      const same = field.date ? (a === b || (typeof a === 'string' && typeof b === 'string' && Date.parse(a) === Date.parse(b))) : a === b;
      if (!same) events.push(`Edited ${task.title.slice(0, 120)}: ${field.label} ${show(a, field.date)} → ${show(b, field.date)}`);
    }
  }
  return events;
}
