# Demonstrate expert judgment transferring to a new case

Decision Echo captures expert work, clarifies decisions into an evidence-backed Work Map, and teaches a learner through a different case. Weekly planning is the first application of this extensible workflow. This walkthrough uses synthetic tasks and scripted expert answers; it is a rehearsal protocol, not a report of a completed human interview or a claim of general policy induction.

## Prepare

Use the sandbox planning workspace with the local setup in the [README](../README.md). The deterministic controlled checks work without provider credentials. Real screen observation and voice require configured providers; show those capabilities only when connected and working. For a separate Notion screen-share demonstration, prepare the [synthetic Notion pages](demo/README.md). Direct Notion autosave is outside the controlled save gate.

All times below use Europe/Berlin. Start a fresh session. Capture the expert workspace, which excludes **Atlas Data Correction**. Keep credentials and real customer data off screen. Explain the case first: Lea handles analysis, Jonas client communication and Mira independent review. The presentation is due Thursday 8 October 2026 at 12:00; its review is Thursday 09:00–10:00.

## Capture decisions and their reasons

At natural pauses, save at least three distinct capture questions and answers against actual captured screen moments. Mark the guardrail answer and select only the rule types the answer supports. The following text is an explicitly synthetic rehearsal fixture, not a quotation from a real expert.

| Stage | Question | Synthetic expert answer | Supported rule types |
|---|---|---|---|
| Capture | Why is Lea assigned this complete morning analysis block? | Lea has the analysis skill and is available Thursday 09:00–13:00. Keep all four hours together and check that no other work overlaps her slot. | `skill_match`, `availability`, `focus_block`, `no_overlap` |
| Capture | Why does Jonas prepare the presentation and Mira review it? | This customer requires Jonas. Mira independently reviews Thursday 09:00–10:00 after production. Leave at least 60 minutes between review completion and delivery. | `customer_only`, `review_buffer` |
| Capture · guardrail | What would stop you from booking the market analysis? | The customer data is missing. Do not book production before inputs are ready; give the Account Owner a follow-up checkpoint Thursday 10:00. | `dependency_ready`, `blocked_followup` |
| Debrief | What must be rechecked when urgent work displaces a task? | Recheck the entire schedule, including displaced work, against availability and overlaps. A locally feasible new task can still make the week impossible. | `no_overlap`, `availability` |
| Debrief | How do you distinguish a customer preference from a restriction? | An “only” restriction is binding; a preference is advisory. The presentation explicitly requires Jonas. | `customer_only` |
| Debrief | What should the learner explain before delivering external work? | Explain who reviews, when review ends and why the remaining delivery buffer is sufficient. Our rehearsal policy requires at least 60 minutes after review. | `review_buffer` |

Pause capture before compiling. Review the draft teach-back, evidence links and exact expert words. Open a source frame and compare its context with the rule. Set **Review buffer (minutes)** to **60**, save the reviewed draft, then explicitly confirm the Work Map. A saved answer or a model-generated draft is not expert confirmation. Unsupported or contradictory rules need clarification before confirmation.

## Show a mistake caught before controlled saving

Start Teach. The learner now sees the previously hidden **Atlas Data Correction**: two hours, Lea only, Thursday deadline 12:00, inputs available Wednesday 16:00. Ask the learner to predict the consequences of assigning it Thursday 09:00–11:00.

1. In the controlled unsaved proposal, assign Atlas to Lea, set **Schedule**, Thursday 8 October **09:00–11:00**. Leave **Analyze Cohort Data** Thursday **09:00–13:00**.
2. Select **Check with the learned rules**. Expect a blocking overlap finding linking `cohort` and `atlas`. Open its expert evidence and explain: urgent work does not remove the displaced four-hour task. The approval/save action must remain unavailable.
3. Move **Analyze Cohort Data** to Friday 9 October **08:00–12:00**, still assigned to Lea. Keep the presentation's existing production and review slots and the market analysis's follow-up.
4. Check again. With all eight supported rules and the 60-minute buffer, this complete proposal should pass. Explicitly approve the sandbox save. Report observed checks and corrected rules; these counters are not a proficiency score.

A screen-based tutor intervention is advisory. The deterministic prevention demonstrated here comes from the controlled proposal validation and explicit commit path. Screenshots do not establish universal interception of application writes.

## Prove a changed expert rule changes the result

Use two separate rehearsals with the same task facts and corrected learner proposal. Do not save the proposal before comparing it. Session A uses the reviewed 60-minute rule above. In a fresh Session B, the synthetic expert instead says **“Leave at least 180 minutes between review completion and delivery”** in both supporting review-buffer answers. Capture and review the new evidence, set **Review buffer (minutes)** to **180**, save the draft and confirm before starting Teach.

| Identical presentation facts | Session A: 60 minutes | Session B: 180 minutes |
|---|---|---|
| Review ends Thursday 10:00; delivery deadline Thursday 12:00 | 120 minutes remain: buffer passes | 120 minutes remain: `review_buffer` blocks |

Apply the same Atlas assignment and Friday cohort correction in both sessions so unresolved urgent work and overlaps do not obscure this comparison. The supported numeric parameter drives evaluation; changing explanatory prose alone does not redefine the scheduling operator. This is evidence of parameterized rule transfer, not arbitrary rule discovery or model training.

The API rejects Work Map edits after Teach starts. Compare separately confirmed pre-Teach sessions, rather than promising a rule edit during the learner case. Each session preserves its own evidence and map version. If the stricter case is blocked, show the finding; do not bypass it to finish the demo.

## Present the outcome and verification honestly

Use a concrete story: a novice makes a plausible urgent assignment, the expert's whole-week rule catches the displaced-work conflict, and the novice corrects it. Then show the changed buffer comparison and explain the broader capture → reviewed map → new-case teaching product.

Existing automated coverage is in [planning tests](../src/domain/planning.test.ts) for changed review buffers and complete corrections, [demo seed tests](../src/domain/demo-seed.test.ts) for the hidden learner task, and [API integration](../tests/api.integration.mjs) for the actual controlled rejection/commit path. Run the relevant checks when rehearsing changes:

```sh
npx vitest run src/domain/planning.test.ts src/domain/demo-seed.test.ts
npm run test:api
```

Record which steps actually ran, which media or answers were synthetic, whether real provider calls and a real microphone were used, and whether any external writes happened. This document describes expected behavior based on source and test inspection; it does not itself certify a new runtime run, a Notion CSV import, a live interview or real Notion writes.
