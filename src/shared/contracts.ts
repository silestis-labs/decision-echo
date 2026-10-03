import { z } from 'zod';

export const Person = z.enum(['Lea', 'Jonas', 'Mira', 'Unassigned']);
export const TaskSchema = z.object({
  id: z.string(), title: z.string().min(1), skill: z.string(), effort: z.number().positive(),
  deadline: z.string().datetime({ offset: true }), priority: z.number().int().min(0).max(3),
  customerPreference: z.string(), dependencyStatus: z.enum(['Ready','Waiting','Blocked']),
  dependencyAvailableAt: z.string().datetime({ offset: true }).nullable(), focus: z.boolean(), external: z.boolean(),
  assignee: Person, start: z.string().datetime({ offset: true }).nullable(), end: z.string().datetime({ offset: true }).nullable(),
  reviewOwner: z.enum(['Mira','None']), reviewStart: z.string().datetime({ offset: true }).nullable(), reviewEnd: z.string().datetime({ offset: true }).nullable(),
  followUpOwner: z.string(), followUpCheckpoint: z.string().datetime({ offset: true }).nullable(),
  decision: z.enum(['Schedule','Split','Request information','Escalate','Hold']), notionPageId: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;
export const RuleKind = z.enum(['no_overlap','availability','customer_only','skill_match','dependency_ready','focus_block','review_buffer','blocked_followup']);
export const EvidenceSchema = z.object({ id: z.string(), sessionId: z.string(), epoch: z.number().int(), at: z.string(), kind: z.enum(['frame','answer','activity']), text: z.string(), image: z.string().optional() });
export type Evidence = z.infer<typeof EvidenceSchema>;
export const AnswerSchema = z.object({id:z.string(), stage:z.enum(['capture','debrief']), question:z.string(), answer:z.string().min(1), evidenceIds:z.array(z.string()), ruleKinds:z.array(RuleKind), guardrail:z.boolean()});
export type Answer = z.infer<typeof AnswerSchema>;
export const RuleSchema = z.object({ id:z.string(), kind:RuleKind, title:z.string(), explanation:z.string(), evidenceIds:z.array(z.string()).min(1), expertQuote:z.string().min(1), parameters:z.object({ bufferMinutes:z.number().min(0).max(1440).optional() }).default({}) });
export type Rule = z.infer<typeof RuleSchema>;
export const WorkMapSchema = z.object({id:z.string(),version:z.number().int().positive(),status:z.enum(['draft','confirmed']),rules:z.array(RuleSchema),teachBack:z.string(),confirmedAt:z.string().optional()});
export type WorkMap = z.infer<typeof WorkMapSchema>;
export type Finding = { ruleId:string; taskIds:string[]; severity:'block'|'warning'; message:string; expertQuote:string; evidenceIds:string[] };
export type Validation = { allowed:boolean; findings:Finding[]; mapVersion:number; checkedAt:string };
export type Availability = { person:z.infer<typeof Person>; skill:string[]; start:string; end:string };
export type Session = { id:string; epoch:number; recording:boolean; phase:'capture'|'map'|'teach'; mode:'sandbox'|'live'; evidence:Evidence[]; answers:Answer[]; map:WorkMap|null; tasks:Task[]; availability:Availability[]; validation:Validation|null; commitStatus:'idle'|'writing'|'complete'|'partial'|'unknown'; revision:number };
export type Capabilities = { elevenLabs:boolean; openAI:boolean; notion:boolean; mode:'sandbox'|'live'; model:string; voiceModel:string };

// Bearer session capability is returned once at creation and retained in browser memory.
// Every session request carries Authorization: Bearer <token>; never put it in a URL.
// API: GET /api/config -> Capabilities
// POST /api/sessions {mode} -> {session, token}
// GET /api/sessions/:id -> Session
// POST /api/sessions/:id/recording {recording:boolean, epoch:number} -> Session
// POST /api/sessions/:id/evidence {epoch,kind,text,image?} -> Session
// POST /api/sessions/:id/answers Answer -> Session
// POST /api/sessions/:id/compile {} -> Session (draft map only)
// POST /api/sessions/:id/confirm {version:number} -> Session
// POST /api/sessions/:id/map {rules:Rule[],teachBack:string,version:number} -> Session (new draft version)
// POST /api/sessions/:id/teach {} -> Session (introduces the unseen case)
// POST /api/sessions/:id/validate {tasks:Task[], revision:number} -> {session, validation}
// POST /api/sessions/:id/commit {tasks:Task[], revision:number, mapVersion:number, confirmed:true} -> Session
// POST /api/sessions/:id/voice {role:'expert'|'tutor'} -> {signedUrl:string}
// POST /api/sessions/:id/observe {epoch:number,image:string} -> {question:string,ruleKinds:string[],guardrail:boolean}
// GET /api/sessions/:id/export -> {markdown:string,map:WorkMap}
