import { z } from 'zod';

export const Person = z.enum(['Lea', 'Jonas', 'Mira', 'Unassigned']);
export const TaskSchema = z.object({
  id: z.string(), title: z.string().min(1), skill: z.string(), effort: z.number().positive(),
  customer:z.string().default(''), description:z.string().default(''), dependency:z.string().default(''),
  trainingStage:z.string().default(''), timeWindow:z.string().default(''), planningWeek:z.string().default(''),
  reviewStatus:z.enum(['Not set','Not required','Planned','Approved','Changes requested']).default('Not set'),
  deadline: z.string().datetime({ offset: true }), priority: z.number().int().min(0).max(3),
  customerPreference: z.string(), dependencyStatus: z.enum(['Ready','Waiting','Blocked']),
  dependencyAvailableAt: z.string().datetime({ offset: true }).nullable(), focus: z.boolean(), external: z.boolean(),
  assignee: Person, start: z.string().datetime({ offset: true }).nullable(), end: z.string().datetime({ offset: true }).nullable(),
  reviewOwner: z.enum(['Mira','None']), reviewStart: z.string().datetime({ offset: true }).nullable(), reviewEnd: z.string().datetime({ offset: true }).nullable(),
  followUpOwner: z.string(), followUpCheckpoint: z.string().datetime({ offset: true }).nullable(),
  decision: z.enum(['Schedule','Split','Request information','Escalate','Hold']), notionPageId: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;
export const RuleKind = z.enum(['no_overlap','availability','customer_only','skill_match','dependency_ready','focus_block','review_buffer','blocked_followup','client_work_window']);
export const EvidenceSchema = z.object({ id: z.string(), sessionId: z.string(), epoch: z.number().int(), at: z.string(), kind: z.enum(['frame','answer','activity']), text: z.string(), image: z.string().optional() });
export type Evidence = z.infer<typeof EvidenceSchema>;
export const AnswerSchema = z.object({id:z.string().uuid(), stage:z.enum(['capture','debrief']), question:z.string().min(1).max(2000), answer:z.string().min(1).max(10000), evidenceIds:z.array(z.string()).min(1).max(100), ruleKinds:z.array(RuleKind).max(9), guardrail:z.boolean()});
export type Answer = z.infer<typeof AnswerSchema>;
export const RuleSchema = z.object({ id:z.string(), kind:RuleKind, title:z.string(), explanation:z.string(), evidenceIds:z.array(z.string()).min(1), expertQuote:z.string().min(1), parameters:z.object({ bufferMinutes:z.number().min(0).max(1440).optional(),person:z.enum(['Lea','Jonas','Mira']).optional(),startHour:z.number().int().min(0).max(23).optional(),endHour:z.number().int().min(1).max(23).optional() }).default({}) }).refine(rule=>rule.kind!=='client_work_window'||(rule.parameters.person!==undefined&&rule.parameters.startHour!==undefined&&rule.parameters.endHour!==undefined&&rule.parameters.startHour<rule.parameters.endHour),{message:'A client work window needs a reviewed person and increasing start/end hours.'});
export type Rule = z.infer<typeof RuleSchema>;
export const WorkMapSchema = z.object({id:z.string(),version:z.number().int().positive(),status:z.enum(['draft','confirmed']),rules:z.array(RuleSchema),teachBack:z.string(),confirmedAt:z.string().optional()});
export type WorkMap = z.infer<typeof WorkMapSchema>;
export type Finding = { ruleId:string; taskIds:string[]; severity:'block'|'warning'; message:string; expertQuote:string; evidenceIds:string[] };
export type Validation = { allowed:boolean; findings:Finding[]; mapVersion:number; checkedAt:string };
export const VisualCoachModelSchema = z.object({summary:z.string().max(1200),concerns:z.array(z.object({ruleId:z.string(),visibleBasis:z.string().min(1).max(1000),message:z.string().min(1).max(1000)}).strict()).max(8),nextQuestion:z.string().max(600),uncertain:z.boolean()}).strict();
export type VisualCoach = {frameId:string;at:string;mapVersion:number;summary:string;concerns:{ruleId:string;visibleBasis:string;message:string;expertQuote:string;evidenceIds:string[]}[];nextQuestion:string;uncertain:boolean};
export type Availability = { person:z.infer<typeof Person>; skill:string[]; start:string; end:string };
export type LearningProgress = { checks:number; blockedChecks:number; encounteredRuleIds:string[]; resolvedRuleIds:string[] };
export type Session = { progress?:LearningProgress; templateVersion?:number; id:string; epoch:number; recording:boolean; phase:'capture'|'map'|'teach'; mode:'sandbox'|'live'; evidence:Evidence[]; answers:Answer[]; map:WorkMap|null; tasks:Task[]; availability:Availability[]; validation:Validation|null; commitStatus:'idle'|'writing'|'complete'|'partial'|'unknown'; revision:number };
export type Capabilities = { elevenLabs:boolean; openAI:boolean; vision?:boolean; observationProvider?:'openai'|'gemini'; notion:boolean; mode:'sandbox'|'live'; model:string; observationModel?:string; observationReasoning?:string; observationImageDetail?:string; voiceModel:string; accessCodeRequired:boolean };

// Bearer session capability is returned once at creation and retained in tab-scoped sessionStorage by the browser; server stores only a digest.
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

// POST /api/sessions/:id/heartbeat {epoch} -> {expiresAt:number}; refresh <=15s while recording (60s lease).
// POST /api/sessions/:id/delete {confirmed:true} -> {deleted:true}; paused sessions only, revokes capability and erases local evidence/journal.

// POST /api/sessions/:id/coach {epoch,frameId} -> VisualCoach; latest current-epoch learner frame, confirmed map, advisory only.
