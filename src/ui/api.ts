import type { Session, Capabilities } from '../shared/contracts';
export class RequestError extends Error { constructor(message:string,public status:number){super(message);} }
export type SessionReference={id:string;token:string;createdAt:string;confirmed:boolean;mode:'sandbox'|'live'};
const STORAGE_KEY='decision-echo.sessions.v1';
let credential:SessionReference|null=null,accessCode='';
/** Shared demo access code, kept in memory only; required by deployments that set DEMO_ACCESS_CODE. */
export function setAccessCode(code:string){accessCode=code.trim();}
// Capabilities stay in this browser tab, never in localStorage, exported skills or URLs.
export function sessionReferences():SessionReference[]{try{const raw=JSON.parse(sessionStorage.getItem(STORAGE_KEY)??'[]');return Array.isArray(raw)?raw.filter((r:SessionReference)=>typeof r.id==='string'&&typeof r.token==='string'&&typeof r.createdAt==='string'&&(r.mode==='sandbox'||r.mode==='live')).slice(0,30):[];}catch{return [];}}
function persist(refs:SessionReference[]){try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(refs.slice(0,30)));}catch{/* Private browsing or storage policy may disable recovery. */}}
export function rememberSession(s:Session){if(!credential||credential.id!==s.id)return;credential={...credential,confirmed:s.map?.status==='confirmed'};persist([credential,...sessionReferences().filter(r=>r.id!==s.id)]);}
export function selectSession(id:string){const ref=sessionReferences().find(r=>r.id===id);if(!ref)throw new Error('This tab does not have access to that session.');credential=ref;}
export function forgetSession(id:string){persist(sessionReferences().filter(r=>r.id!==id));if(credential?.id===id)credential=null;}
export function forgetSessions(){credential=null;try{sessionStorage.removeItem(STORAGE_KEY);}catch{/* Storage may be unavailable. */}}
export async function api<T>(path:string,body?:unknown,signal?:AbortSignal,extraHeaders:Record<string,string>={}):Promise<T>{
 const response=await fetch(`/api${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(credential?{Authorization:`Bearer ${credential.token}`}:{}),...extraHeaders},...(body===undefined?{}:{body:JSON.stringify(body)}),signal});
 if(!response.ok){const value=await response.json().catch(()=>null) as {error?:unknown}|null;throw new RequestError(typeof value?.error==='string'?value.error:`Request failed (${response.status})`,response.status);}
 return response.json() as Promise<T>;
}
export const config=()=>api<Capabilities>('/config');
export async function create(mode:'sandbox'|'live'){const result=await api<{session:Session;token:string}>('/sessions',{mode},undefined,accessCode?{'X-Demo-Access':accessCode}:{});credential={id:result.session.id,token:result.token,mode,createdAt:new Date().toISOString(),confirmed:false};rememberSession(result.session);return result.session;}
export function sessionApi<T>(suffix:string,body?:unknown,signal?:AbortSignal){if(!credential)throw new Error('Start a session first.');return api<T>(`/sessions/${credential.id}${suffix}`,body,signal);}
export function captureConnection(){if(!credential)throw new Error('Start a session first.');return {id:credential.id,token:credential.token,endpoint:'http://127.0.0.1:8787'};}
