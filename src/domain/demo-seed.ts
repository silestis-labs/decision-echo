import type { Availability, Task } from '../shared/contracts';
import { sandboxAvailability, sandboxTasks } from './planning';

// Synthetic Notion import files for the screen-share demo. The app never reads these pages through an API:
// the expert and learner work in Notion while Decision Echo watches the shared tab. The case facts the
// visual coach receives come from the same sandbox data, so the Notion pages must be imported from these files.
const notionDate = (value: string | null) => value ? new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)).replace(' at ', ' ') : '';
const cell = (value: unknown) => { const text = String(value ?? ''); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; };
const csv = (rows: unknown[][]) => rows.map(row => row.map(cell).join(',')).join('\n') + '\n';

export function notionTasksCsv(tasks: Task[]) {
  const flags = (t: Task) => [t.focus ? 'Focus Work' : '', t.external ? 'Review Required' : ''].filter(Boolean).join(',');
  return csv([
    ['Task', 'Customer', 'Description', 'Training Stage', 'Time Window', 'Planning Week', 'Dependency', 'Review Status', 'Required Skill', 'Effort (h)', 'Deadline', 'Priority', 'Customer Preference', 'Dependency Status', 'Dependency Available At', 'Flags', 'Proposed Assignee', 'Start', 'End', 'Review Owner', 'Review Start', 'Review End', 'Follow-up Owner', 'Follow-up Checkpoint', 'Decision'],
    ...tasks.map(t => [t.title, t.customer, t.description, t.trainingStage, t.timeWindow, t.planningWeek, t.dependency, t.reviewStatus, t.skill, t.effort, notionDate(t.deadline), `P${t.priority}`, t.customerPreference, t.dependencyStatus, notionDate(t.dependencyAvailableAt), flags(t), t.assignee, notionDate(t.start), notionDate(t.end), t.reviewOwner, notionDate(t.reviewStart), notionDate(t.reviewEnd), t.followUpOwner, notionDate(t.followUpCheckpoint), t.decision]),
  ]);
}

export function notionAvailabilityCsv(availability: Availability[]) {
  return csv([['Person', 'Skills', 'Available from', 'Available until'], ...availability.map(a => [a.person, a.skill.join(', '), notionDate(a.start), notionDate(a.end)])]);
}

/** The expert never sees the learner's urgent task; the learner case adds it to the same week. */
export function demoSeed() {
  const learner = sandboxTasks();
  return {
    expertTasks: notionTasksCsv(learner.filter(t => t.id !== 'atlas')),
    learnerTasks: notionTasksCsv(learner),
    availability: notionAvailabilityCsv(sandboxAvailability()),
  };
}
