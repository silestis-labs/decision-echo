# Notion screen-share demo

This demo runs Capture → Map → Teach while the expert and the learner work in Notion in another browser tab. Decision Echo does not call the Notion API on this path: it sees Notion only through the shared tab (`getDisplayMedia`), sampled every two seconds and interpreted by the configured vision model. All names, tasks and times are synthetic.

## Prepare two Notion pages

Import the CSV files in this folder into two separate Notion databases (Notion: *Import → CSV*). Keep the column names; set the date columns to the *Date* type with time and the `Flags` column to *Multi-select* if Notion does not detect them. Dates use the `Month D, YYYY h:mm AM/PM` form that Notion's own CSV export produces; the import itself has not been verified yet, so check one date and the time zone (Europe/Berlin) after importing.

| Page | Import | Purpose |
|---|---|---|
| Expert week | `notion-expert-week.csv` + `notion-availability.csv` | The week the expert plans while explaining their judgment. It does not contain the learner's urgent task. |
| Learner case | `notion-learner-case.csv` + `notion-availability.csv` | The same week plus the unseen urgent task *Atlas Data Correction*. |

The visual coach receives these same case facts from the server (`sandboxTasks`/`sandboxAvailability` in `src/domain/planning.ts`). If you edit the CSVs by hand, the coach and the screen will disagree; regenerate them with `npx vitest run src/domain/demo-seed.test.ts -u` after changing the sandbox data instead.

Notion saves every edit immediately. Duplicate both pages before each rehearsal or recording and work in the copy, so every run starts from the same state.

## Run the demo

Use Chrome or Edge (tab sharing is not available in Firefox or Safari). Put Decision Echo and Notion side by side in two windows so the panel stays visible while you work in Notion.

1. **Capture.** Start a session, choose *Share screen* and select the Notion *Expert week* tab. Plan the week while talking. At natural pauses the interviewer asks about what is visible; answer and save at least three answers, one about a guardrail. *Off the record* stops the screen, microphone and uploads.
2. **Map.** Answer at least three new debrief questions, review the teach-back and confirm it.
3. **Teach.** Open the *Learner case* tab, share it and connect the voice tutor. The tutor first asks the learner to predict their next decision. When the visual coach sees a change that conflicts with a confirmed rule, the tutor steps in and explains it with the expert's words; *Replay original expert evidence* shows the expert's screen moment.

## What to claim

- Prevention before a change happens comes from the prediction step and the tutor's intervention. The visual coach is advisory: it can be late or wrong, and it cannot block Notion's autosave.
- The controlled *Check with the learned rules → I approve · save* path in the Teach view is the technical pre-save gate; it applies to the in-app proposal, not to edits made directly in Notion.
- A recording does not train model weights. The exported skill contains instructions and evidence only.
